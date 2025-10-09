// Prevent any console output in production-like environments
// Importing this module will override console methods with no-ops.

const noop = () => {};

// Preserve original types but no-op implementations
console.log = noop;
console.info = noop;
console.warn = noop;
console.error = noop;
console.debug = noop;

export {};


