import { SvelteSet } from 'svelte/reactivity';
import type { SubmitFunction } from '$app/forms';

// Remembers which use:enhance forms are waiting for the server, one key per form.
export class Pending {
	#keys = new SvelteSet<string>();

	has(key: string) {
		return this.#keys.has(key);
	}

	// Use as `use:enhance={pending.submit('key')}`. With a message, asks for confirmation first.
	submit(key: string, confirmMessage?: string, onSuccess?: () => void): SubmitFunction {
		return ({ cancel }) => {
			if (confirmMessage && !confirm(confirmMessage)) {
				cancel();
				return;
			}
			this.#keys.add(key);
			return async ({ result, update }) => {
				try {
					await update();
					if (result.type === 'success') onSuccess?.();
				} finally {
					this.#keys.delete(key);
				}
			};
		};
	}
}
