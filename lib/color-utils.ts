export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export function hexToRgb(hex: string): RGB | null {
  let value = hex.trim().replace(/^#/, '');
  // Expand shorthand (e.g. "abc" -> "aabbcc").
  if (/^[a-f\d]{3}$/i.test(value)) {
    value = value
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(value);
  return result
    ? {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16),
      }
    : null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToRgb(h: number, s: number, l: number): RGB {
  h /= 360;
  s /= 100;
  l /= 100;

  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r: number;
  let g: number;
  let b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

// Parse a color written as hex, "r, g, b"/"rgb(...)", or "h, s%, l%"/"hsl(...)"
// into RGB, returning null when the text isn't a recognizable color.
function parseColor(input: string): RGB | null {
  const value = input.trim().toLowerCase();

  const rgbMatch = value.match(
    /^rgba?\(?\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/,
  );
  if (rgbMatch) {
    const [r, g, b] = [rgbMatch[1], rgbMatch[2], rgbMatch[3]].map(Number);
    if ([r, g, b].every((n) => n >= 0 && n <= 255)) return { r, g, b };
    return null;
  }

  const hslMatch = value.match(
    /^hsla?\(?\s*(\d{1,3})\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?/,
  );
  if (hslMatch) {
    const [h, s, l] = [hslMatch[1], hslMatch[2], hslMatch[3]].map(Number);
    if (h <= 360 && s <= 100 && l <= 100) return hslToRgb(h, s, l);
    return null;
  }

  return hexToRgb(value);
}

// Produce a human-readable summary of a color in all three formats.
export function formatColor(input: string): string {
  const rgb = parseColor(input);
  if (!rgb) {
    throw new Error(
      'Enter a color as hex (#3b82f6), RGB (59, 130, 246), or HSL (217, 91%, 60%).',
    );
  }
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return [
    `HEX: ${rgbToHex(rgb.r, rgb.g, rgb.b)}`,
    `RGB: ${rgb.r}, ${rgb.g}, ${rgb.b}`,
    `HSL: ${hsl.h}, ${hsl.s}%, ${hsl.l}%`,
  ].join('\n');
}
