import { randomInt } from 'node:crypto';

// 51 characters without look-alikes (0 O o, 1 I l i) and very narrow letters (j f r t)
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdeghkmnpqsuvwxyz';

// 23 of 51 characters are about 130 bits, enough to be impossible to guess
const LENGTH = 23;

export function createToken() {
	return Array.from({ length: LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
}
