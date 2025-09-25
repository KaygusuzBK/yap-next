// Prevent any console output in production-like environments
// Importing this module will override console methods with no-ops.

const noop = () => {};

// Preserve original types but no-op implementations
/* eslint-disable no-console */
console.log = noop;
console.info = noop;
console.warn = noop;
console.error = noop;
console.debug = noop;
/* eslint-enable no-console */

export {};


