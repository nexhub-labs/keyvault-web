// changeCase.ts

/**
 * Converts a string to camel case.
 * @param input - The string to convert.
 * @returns The camel-cased string.
 */
export function toCamelCase(input: string): string {
    return input
        .replace(/([-_\s]+\w)/g, match => match[match.length - 1].toUpperCase())
        .replace(/^\w/, match => match.toLowerCase());
}

/**
 * Converts a string to snake case.
 * @param input - The string to convert.
 * @returns The snake-cased string.
 */
export function toSnakeCase(input: string): string {
    return input
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[-\s]+/g, '_')
        .toLowerCase();
}

/**
 * Converts a string to kebab case.
 * @param input - The string to convert.
 * @returns The kebab-cased string.
 */
export function toKebabCase(input: string): string {
    return input
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[_\s]+/g, '-')
        .toLowerCase();
}

/**
 * Converts a string to Pascal case.
 * @param input - The string to convert.
 * @returns The Pascal-cased string.
 */
export function toPascalCase(input: string): string {
    return input
        .replace(/([-_\s]+\w|^\w)/g, match => match[match.length - 1].toUpperCase())
        .replace(/[-_\s]/g, '');
}

/**
 * Converts a string to title case.
 * @param input - The string to convert.
 * @returns The title-cased string.
 */
export function toTitleCase(input: string): string {
    return input
        .toLowerCase()
        .replace(/(^|[-_\s])\w/g, match => match.toUpperCase());
}

/**
 * Converts a string to upper case.
 * @param input - The string to convert.
 * @returns The upper-cased string.
 */
export function toUpperCase(input: string): string {
    return input.toUpperCase();
}

/**
 * Converts a string to lower case.
 * @param input - The string to convert.
 * @returns The lower-cased string.
 */
export function toLowerCase(input: string): string {
    return input.toLowerCase();
}

/**
 * Converts a string to sentence case.
 * @param input - The string to convert.
 * @returns The sentence-cased string.
 */
export function toSentenceCase(input: string): string {
    return input
        .toLowerCase()
        .replace(/^\w/, match => match.toUpperCase());
}

/**
 * Capitalizes the first letter of each word in the string.
 * @param input - The string to convert.
 * @returns The capitalized string.
 */
export function capitalize(input: string): string {
    return input
        .toLowerCase()
        .replace(/\b\w/g, match => match.toUpperCase());
}

/**
 * Reverses the case of each letter in the string.
 * @param input - The string to convert.
 * @returns The string with reversed cases.
 */
export function toToggleCase(input: string): string {
    return Array.from(input)
        .map(char => (char === char.toLowerCase() ? char.toUpperCase() : char.toLowerCase()))
        .join('');
}

// Export all functions as a single object for convenience
export default {
    toCamelCase,
    toSnakeCase,
    toKebabCase,
    toPascalCase,
    toTitleCase,
    toUpperCase,
    toLowerCase,
    toSentenceCase,
    capitalize,
    toToggleCase
};
