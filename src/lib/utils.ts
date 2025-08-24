import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { v4 as uuidv4 } from 'uuid';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/** Generate a new UUID v4 */
export function generateId(): string {
	return uuidv4();
}

/** Generate a new UUID v4 in the format {xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx} */
export function generateFormattedId(): string {
	return `{${uuidv4()}}`;
}

/** Check if a string is a valid UUID */
export function isValidId(id: string): boolean {
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	return uuidRegex.test(id.replace(/[{}]/g, ''));
}
