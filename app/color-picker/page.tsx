"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ColorPickerPage() {
  const [selectedColor, setSelectedColor] = useState("#3b82f6");
  const [hexInput, setHexInput] = useState("#3b82f6");
  const [rgbInput, setRgbInput] = useState("59, 130, 246");
  const [hslInput, setHslInput] = useState("217, 91%, 60%");
  const [colorHistory, setColorHistory] = useState<string[]>([]);

  // Convert hex to RGB
  const hexToRgb = (
    hex: string
  ): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  // Convert RGB to hex
  const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  // Convert RGB to HSL
  const rgbToHsl = (
    r: number,
    g: number,
    b: number
  ): { h: number; s: number; l: number } => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
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
  };

  // Convert HSL to RGB
  const hslToRgb = (
    h: number,
    s: number,
    l: number
  ): { r: number; g: number; b: number } => {
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

    let r, g, b;

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
  };

  // Update all formats when color changes
  const updateColor = (color: string) => {
    setSelectedColor(color);
    setHexInput(color);

    const rgb = hexToRgb(color);
    if (rgb) {
      setRgbInput(`${rgb.r}, ${rgb.g}, ${rgb.b}`);
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      setHslInput(`${hsl.h}, ${hsl.s}%, ${hsl.l}%`);
    }
  };

  // Handle hex input change
  const handleHexChange = (value: string) => {
    setHexInput(value);
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      updateColor(value);
    }
  };

  // Handle RGB input change
  const handleRgbChange = (value: string) => {
    setRgbInput(value);
    const match = value.match(/(\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      const r = Math.min(255, Math.max(0, parseInt(match[1])));
      const g = Math.min(255, Math.max(0, parseInt(match[2])));
      const b = Math.min(255, Math.max(0, parseInt(match[3])));
      const hex = rgbToHex(r, g, b);
      updateColor(hex);
    }
  };

  // Handle HSL input change
  const handleHslChange = (value: string) => {
    setHslInput(value);
    const match = value.match(/(\d+),\s*(\d+)%,\s*(\d+)%/);
    if (match) {
      const h = Math.min(360, Math.max(0, parseInt(match[1])));
      const s = Math.min(100, Math.max(0, parseInt(match[2])));
      const l = Math.min(100, Math.max(0, parseInt(match[3])));
      const rgb = hslToRgb(h, s, l);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      updateColor(hex);
    }
  };

  // Add color to history
  const addToHistory = () => {
    if (!colorHistory.includes(selectedColor)) {
      const newHistory = [selectedColor, ...colorHistory.slice(0, 9)];
      setColorHistory(newHistory);
      toast.success("Color added to history!");
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, format: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${format} copied to clipboard!`);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  // Generate random color
  const generateRandomColor = () => {
    const randomColor =
      "#" +
      Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0");
    updateColor(randomColor);
    toast.info("Random color generated!");
  };

  // Color contrast calculation
  const [contrastColor, setContrastColor] = useState("#ffffff");
  
  // Calculate relative luminance
  const getLuminance = (r: number, g: number, b: number): number => {
    const sRGB = [r, g, b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  };

  // Calculate contrast ratio
  const getContrastRatio = (color1: string, color2: string): number => {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return 0;
    
    const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  };

  // Get contrast rating
  const getContrastRating = (ratio: number): { rating: string; color: string } => {
    if (ratio >= 7) return { rating: "AAA", color: "text-green-600" };
    if (ratio >= 4.5) return { rating: "AA", color: "text-yellow-600" };
    if (ratio >= 3) return { rating: "AA Large", color: "text-orange-600" };
    return { rating: "Fail", color: "text-red-600" };
  };

  // Update contrast color
  const updateContrastColor = (color: string) => {
    setContrastColor(color);
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Color Picker</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Color Picker</CardTitle>
            <CardDescription>
              Pick a color and see its values in different formats
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Color Preview */}
            <div className="space-y-4">
              <div
                className="w-full h-32 rounded-lg border-2 border-border"
                style={{ backgroundColor: selectedColor }}
              />

              {/* Native Color Picker */}
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => updateColor(e.target.value)}
                className="w-full h-12 border-2 border-border rounded-lg cursor-pointer"
              />
            </div>

            {/* Format Inputs */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">HEX</label>
                <div className="flex gap-2">
                  <Input
                    value={hexInput}
                    onChange={(e) => handleHexChange(e.target.value)}
                    placeholder="#3b82f6"
                    className="font-mono"
                  />
                  <Button
                    onClick={() => copyToClipboard(hexInput, "HEX")}
                    variant="outline"
                    size="sm"
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">RGB</label>
                <div className="flex gap-2">
                  <Input
                    value={rgbInput}
                    onChange={(e) => handleRgbChange(e.target.value)}
                    placeholder="59, 130, 246"
                    className="font-mono"
                  />
                  <Button
                    onClick={() => copyToClipboard(`rgb(${rgbInput})`, "RGB")}
                    variant="outline"
                    size="sm"
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">HSL</label>
                <div className="flex gap-2">
                  <Input
                    value={hslInput}
                    onChange={(e) => handleHslChange(e.target.value)}
                    placeholder="217, 91%, 60%"
                    className="font-mono"
                  />
                  <Button
                    onClick={() => copyToClipboard(`hsl(${hslInput})`, "HSL")}
                    variant="outline"
                    size="sm"
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={generateRandomColor}
                variant="outline"
                className="flex-1"
              >
                Random
              </Button>
              <Button onClick={addToHistory} className="flex-1">
                Save Color
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Color Contrast Checker</CardTitle>
            <CardDescription>
              Check accessibility contrast ratios between two colors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contrast Color Picker */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Compare Against</h3>
              <div
                className="w-full h-16 rounded-lg border-2 border-border"
                style={{ backgroundColor: contrastColor }}
              />
              <input
                type="color"
                value={contrastColor}
                onChange={(e) => updateContrastColor(e.target.value)}
                className="w-full h-12 border-2 border-border rounded-lg cursor-pointer"
              />
            </div>

            {/* Contrast Results */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Contrast Analysis</h3>
              {(() => {
                const ratio = getContrastRatio(selectedColor, contrastColor);
                const rating = getContrastRating(ratio);
                return (
                  <div className="bg-muted p-4 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Contrast Ratio:</span>
                      <span className="font-mono text-lg">{ratio.toFixed(2)}:1</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">WCAG Rating:</span>
                      <span className={`font-bold ${rating.color}`}>{rating.rating}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Text Preview */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Text Preview</h3>
              <div className="space-y-3">
                <div
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: selectedColor,
                    color: contrastColor,
                  }}
                >
                  <div className="text-lg font-bold">Large Text (18pt+)</div>
                  <div className="text-sm">Normal text (under 18pt)</div>
                </div>
                <div
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: contrastColor,
                    color: selectedColor,
                  }}
                >
                  <div className="text-lg font-bold">Large Text (18pt+)</div>
                  <div className="text-sm">Normal text (under 18pt)</div>
                </div>
              </div>
            </div>

            {/* Quick Contrast Options */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Quick Contrast Tests</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => updateContrastColor("#ffffff")}
                  variant="outline"
                  size="sm"
                  className="bg-white text-black border-2"
                >
                  vs White
                </Button>
                <Button
                  onClick={() => updateContrastColor("#000000")}
                  variant="outline"
                  size="sm"
                  className="bg-black text-white border-2"
                >
                  vs Black
                </Button>
              </div>
            </div>

            {/* Color History */}
            {colorHistory.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">Recent Colors</h3>
                <div className="grid grid-cols-5 gap-2">
                  {colorHistory.map((color, index) => (
                    <button
                      key={`${color}-${index}`}
                      onClick={() => updateColor(color)}
                      className="w-12 h-12 rounded-lg border-2 border-border hover:scale-105 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <Button
                  onClick={() => {
                    setColorHistory([]);
                    toast.info("Color history cleared!");
                  }}
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                >
                  Clear History
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
