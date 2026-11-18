const LOCAL_PATH = /^\/(?![/\\])[^\\\r\n]*$/;

export function redirectTarget(value: string | null) {
	return value && LOCAL_PATH.test(value) ? value : '/dashboard';
}
