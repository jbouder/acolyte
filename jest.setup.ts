import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'node:util';

// Polyfill for structuredClone for older Node.js versions
if (!global.structuredClone) {
  global.structuredClone = (val: any) => JSON.parse(JSON.stringify(val));
}

// Polyfill for TextEncoder and TextDecoder
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

// jsdom ships neither of these, and the command palette (cmdk) and Base UI
// popups both reach for them on mount.
if (!global.ResizeObserver) {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
}

// Guarded: route tests run in the node environment, where there is no DOM.
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}
