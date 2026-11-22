const LOCAL_PATH = /^\/(?![/\\])[^\\\r\n]*$/;

// Pages that must never be a login target (/logout would log the user out right away)
const BLOCKED = ['/logout'];

export function redirectTarget(value: string | null) {
	if (!value || !LOCAL_PATH.test(value)) return '/dashboard';

	const path = value.split(/[?#]/)[0].replace(/\/+$/, '').toLowerCase();
	return BLOCKED.includes(path) ? '/dashboard' : value;
}
