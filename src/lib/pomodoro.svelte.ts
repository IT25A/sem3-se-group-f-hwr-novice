import { browser } from '$app/env';
import { refreshAll } from '$app/navigation';

export type Phase = 'work' | 'short' | 'long';
type Status = 'idle' | 'running' | 'paused';
export type Config = { work: number; short: number; long: number; every: number };

export const PHASE_NAMES: Record<Phase, string> = {
	work: 'Fokuszeit',
	short: 'Kurzpause',
	long: 'Langpause'
};

const DEFAULT_CONFIG: Config = { work: 25, short: 5, long: 15, every: 4 };
const storageKey = (userId: string, name: 'config' | 'state' | 'module') =>
	`pomodoro:${userId}:${name}`;

function clamp(value: unknown, min: number, max: number, fallback: number) {
	const number = Math.round(Number(value));
	if (!Number.isFinite(number)) return fallback;
	return Math.min(max, Math.max(min, number));
}

// Makes sure every setting is a whole number in a sensible range.
function sanitize(config: Partial<Config>): Config {
	return {
		work: clamp(config.work, 1, 180, DEFAULT_CONFIG.work),
		short: clamp(config.short, 1, 60, DEFAULT_CONFIG.short),
		long: clamp(config.long, 1, 60, DEFAULT_CONFIG.long),
		every: clamp(config.every, 2, 10, DEFAULT_CONFIG.every)
	};
}

class Pomodoro {
	config = $state<Config>({ ...DEFAULT_CONFIG });
	phase = $state<Phase>('work');
	status = $state<Status>('idle');
	// Finished work intervals since the last long break.
	cycle = $state(0);
	// The interval that ended last, shown until the next one is started.
	finished = $state<Phase | null>(null);
	// The module the next (or running) work interval is credited to.
	moduleId = $state<string | null>(null);
	// Set when the server could not be reached.
	error = $state('');

	private endsAt = $state(0);
	// Milliseconds left while the timer is not running.
	private left = $state(DEFAULT_CONFIG.work * 60_000);
	private now = $state(0);
	private ticker: ReturnType<typeof setInterval> | undefined;
	private userId = '';

	// The server's record of the running work interval, as saved in the browser.
	private sessionId: string | null = null;
	// The same, but while the start request may still be on its way.
	private session: Promise<string | null> | null = null;

	get remaining() {
		return this.status === 'running' ? Math.max(0, this.endsAt - this.now) : this.left;
	}

	// Remaining time as mm:ss.
	get label() {
		const seconds = Math.ceil(this.remaining / 1000);
		const minutes = Math.floor(seconds / 60);
		return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
	}

	// Share of the current interval that is over, from 0 to 1.
	get progress() {
		const total = this.duration(this.phase);
		return total > 0 ? 1 - this.remaining / total : 0;
	}

	// The module cannot be changed while a work interval is in progress.
	get moduleLocked() {
		return this.phase === 'work' && this.status !== 'idle';
	}

	duration(phase: Phase) {
		return this.config[phase] * 60_000;
	}

	// Loads the saved settings and state. Call once in the browser.
	init(userId: string) {
		if (!browser) return;
		this.suspend();
		this.userId = userId;

		this.config = { ...DEFAULT_CONFIG };
		this.phase = 'work';
		this.status = 'idle';
		this.cycle = 0;
		this.finished = null;
		this.moduleId = null;
		this.error = '';
		this.sessionId = null;
		this.session = null;

		try {
			this.config = sanitize(
				JSON.parse(localStorage.getItem(storageKey(userId, 'config')) ?? '{}')
			);
			this.moduleId = localStorage.getItem(storageKey(userId, 'module'));
			const saved = JSON.parse(localStorage.getItem(storageKey(userId, 'state')) ?? 'null');
			if (saved) this.restore(saved);
		} catch {
			// broken storage: continue with the defaults
		}
		if (this.status === 'idle') this.left = this.duration(this.phase);
	}

	// Stops the clock without touching the saved state
	suspend() {
		this.stopTicker();
	}

	private restore(saved: {
		phase: Phase;
		status: Status;
		endsAt: number;
		left: number;
		cycle: number;
		sessionId?: string | null;
	}) {
		if (!(saved.phase in PHASE_NAMES)) return;
		this.phase = saved.phase;
		this.cycle = clamp(saved.cycle, 0, 100, 0);
		this.left = clamp(saved.left, 0, this.duration(saved.phase), this.duration(saved.phase));

		if (saved.phase === 'work' && typeof saved.sessionId === 'string') {
			this.sessionId = saved.sessionId;
			this.session = Promise.resolve(saved.sessionId);
		}

		if (saved.status === 'paused') {
			this.status = 'paused';
		} else if (saved.status === 'running' && Number.isFinite(saved.endsAt)) {
			this.endsAt = saved.endsAt;
			this.now = Date.now();
			this.status = 'running';
			// The interval may have ended while the page was closed.
			if (this.now >= this.endsAt) this.finish();
			else this.startTicker();
		}
	}

	// Starts the interval, or continues it after a pause.
	start() {
		if (this.status === 'running') return;
		const fresh = this.status === 'idle';

		this.finished = null;
		this.now = Date.now();
		this.endsAt = this.now + this.left;
		this.status = 'running';
		this.startTicker();
		this.save();

		if (fresh && this.phase === 'work') this.beginSession();
	}

	pause() {
		if (this.status !== 'running') return;
		this.left = Math.max(0, this.endsAt - Date.now());
		this.status = 'paused';
		this.stopTicker();
		this.save();
	}

	// Back to the start of the current interval. A work interval in progress is discarded.
	reset() {
		this.stopTicker();
		if (this.phase === 'work' && this.status !== 'idle') void this.endSession('cancel');
		this.status = 'idle';
		this.left = this.duration(this.phase);
		this.save();
	}

	// Leaves a break early and prepares the next work interval.
	skipBreak() {
		if (this.phase === 'work') return;
		this.stopTicker();
		if (this.phase === 'long') this.cycle = 0;
		this.phase = 'work';
		this.status = 'idle';
		this.finished = null;
		this.left = this.duration('work');
		this.save();
	}

	// Checks the settings after the user changed them and saves them.
	applyConfig() {
		this.config = sanitize(this.config);
		if (this.status === 'idle') this.left = this.duration(this.phase);
		try {
			localStorage.setItem(storageKey(this.userId, 'config'), JSON.stringify(this.config));
		} catch {
			// saving is optional
		}
	}

	// Remembers the chosen module.
	saveModule() {
		try {
			const key = storageKey(this.userId, 'module');
			if (this.moduleId) localStorage.setItem(key, this.moduleId);
			else localStorage.removeItem(key);
		} catch {
			// saving is optional
		}
	}

	// The interval is over: prepare the next one, but do not start it.
	private finish() {
		this.stopTicker();
		const done = this.phase;

		if (done === 'work') {
			void this.endSession('complete');
			this.cycle++;
			this.phase = this.cycle >= this.config.every ? 'long' : 'short';
		} else {
			if (done === 'long') this.cycle = 0;
			this.phase = 'work';
		}

		this.finished = done;
		this.status = 'idle';
		this.left = this.duration(this.phase);
		this.save();
	}

	// Tells the server that a work interval began.
	private beginSession() {
		const session = this.send({
			action: 'start',
			module_id: this.moduleId,
			minutes: this.config.work
		}).then((result) => result?.id ?? null);

		this.session = session;
		session.then((id) => {
			// Only if this interval is still the current one.
			if (this.session === session) {
				this.sessionId = id;
				this.save();
			}
		});
	}

	// Tells the server how the work interval ended. A completed one is credited.
	private async endSession(action: 'complete' | 'cancel') {
		const session = this.session;
		this.session = null;
		this.sessionId = null;

		const id = await session; // the start request may still be on its way
		if (!id) return;

		const result = await this.send({ action, id });
		if (result && action === 'complete') await refreshAll(); // refresh log and modules
	}

	// Calls the server and reports a problem on the page instead of throwing.
	private async send(body: Record<string, unknown>): Promise<{ id?: string } | null> {
		try {
			const response = await fetch('/pomodoro/session', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(body)
			});
			if (!response.ok) throw new Error(`Status ${response.status}`);
			const result = await response.json();
			this.error = '';
			return result;
		} catch {
			this.error = 'Die Fokuszeit konnte nicht auf dem Server gespeichert werden.';
			return null;
		}
	}

	private tick() {
		this.now = Date.now();
		if (this.now >= this.endsAt) this.finish();
	}

	private startTicker() {
		this.stopTicker();
		this.ticker = setInterval(() => this.tick(), 250);
	}

	private stopTicker() {
		clearInterval(this.ticker);
		this.ticker = undefined;
	}

	private save() {
		if (!browser || !this.userId) return;
		try {
			localStorage.setItem(
				storageKey(this.userId, 'state'),
				JSON.stringify({
					phase: this.phase,
					status: this.status,
					endsAt: this.endsAt,
					left: this.left,
					cycle: this.cycle,
					sessionId: this.sessionId
				})
			);
		} catch {
			// saving is optional
		}
	}
}

export const pomodoro = new Pomodoro();
