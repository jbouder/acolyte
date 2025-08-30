import '@testing-library/jest-dom';

// Polyfill for structuredClone for older Node.js versions
if (!global.structuredClone) {
  global.structuredClone = (val: any) => JSON.parse(JSON.stringify(val));
}
