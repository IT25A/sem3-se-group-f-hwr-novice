import { browser } from '$app/env';

export type Phase = 'work' | 'short' | 'long';
type Status = 'idle' | 'running' | 'paused';
export type Config = { work: number; short: number; long: number; every: number };

export const PHASE_NAMES: Record<Phase, string> = {
	work: 'Fokuszeit',
	short: 'Kurzpause',
	long: 'Langpause'
};

const DEFAULT_CONFIG: Config = { work: 25, short: 5, long: 15, every: 4 };
const CONFIG_KEY = 'pomodoro:config';
const STATE_KEY = 'pomodoro:state';

function clamp(value: unknown, min: number, max: number, fallback: number) {
	const number = Math.round(Number(value));
	if (!Number.isFinite(number)) return fallback;
	return Math.min(max, Math.max(min, number));
}

// Make sure every setting is within the allowed range
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

	private endsAt = $state(0);
	// Milliseconds left while the timer is not running.
	private left = $state(DEFAULT_CONFIG.work * 60_000);
	private now = $state(0);
	private ticker: ReturnType<typeof setInterval> | undefined;
	private ready = false;

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

	duration(phase: Phase) {
		return this.config[phase] * 60_000;
	}

	// Loads the saved settings and state. Call once in the browser.
	init() {
		if (!browser || this.ready) return;
		this.ready = true;

		try {
			this.config = sanitize(JSON.parse(localStorage.getItem(CONFIG_KEY) ?? '{}'));
			const saved = JSON.parse(localStorage.getItem(STATE_KEY) ?? 'null');
			if (saved) this.restore(saved);
		} catch {
			// broken storage: continue with the defaults
		}
		if (this.status === 'idle') this.left = this.duration(this.phase);
	}

	private restore(saved: {
		phase: Phase;
		status: Status;
		endsAt: number;
		left: number;
		cycle: number;
	}) {
		if (!(saved.phase in PHASE_NAMES)) return;
		this.phase = saved.phase;
		this.cycle = clamp(saved.cycle, 0, 100, 0);
		this.left = clamp(saved.left, 0, this.duration(saved.phase), this.duration(saved.phase));

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
		this.finished = null;
		this.now = Date.now();
		this.endsAt = this.now + this.left;
		this.status = 'running';
		this.startTicker();
		this.save();
	}

	pause() {
		if (this.status !== 'running') return;
		this.left = Math.max(0, this.endsAt - Date.now());
		this.status = 'paused';
		this.stopTicker();
		this.save();
	}

	// Back to the start of the current interval.
	reset() {
		this.stopTicker();
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
			localStorage.setItem(CONFIG_KEY, JSON.stringify(this.config));
		} catch {
			// saving is optional
		}
	}

	// The interval is over: prepare the next one, but do not start it.
	private finish() {
		this.stopTicker();
		const done = this.phase;

		if (done === 'work') {
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
		if (!browser) return;
		try {
			localStorage.setItem(
				STATE_KEY,
				JSON.stringify({
					phase: this.phase,
					status: this.status,
					endsAt: this.endsAt,
					left: this.left,
					cycle: this.cycle
				})
			);
		} catch {
			// saving is optional
		}
	}
}

export const pomodoro = new Pomodoro();
