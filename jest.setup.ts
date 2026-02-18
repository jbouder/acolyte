import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// Polyfill for structuredClone for older Node.js versions
if (!global.structuredClone) {
  global.structuredClone = (val: any) => JSON.parse(JSON.stringify(val));
}

// Polyfill for TextEncoder and TextDecoder
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;
