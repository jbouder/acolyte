'use client';

import { Copy, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.<>?/|~';
const SIMILAR = /[iIlL1oO0]/g;
const AMBIGUOUS = /[{}[\]()/\\'"`~,;:.<>]/g;

type Preset = 'strong' | 'easy' | 'pin' | 'custom';

interface Options {
  length: number;
  lowercase: boolean;
  uppercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeSimilar: boolean;
  excludeAmbiguous: boolean;
  requireEachType: boolean;
  count: number;
}

const PRESETS: Record<Exclude<Preset, 'custom'>, Options> = {
  strong: {
    length: 20,
    lowercase: true,
    uppercase: true,
    numbers: true,
    symbols: true,
    excludeSimilar: true,
    excludeAmbiguous: false,
    requireEachType: true,
    count: 1,
  },
  easy: {
    length: 16,
    lowercase: true,
    uppercase: true,
    numbers: true,
    symbols: false,
    excludeSimilar: true,
    excludeAmbiguous: true,
    requireEachType: true,
    count: 1,
  },
  pin: {
    length: 6,
    lowercase: false,
    uppercase: false,
    numbers: true,
    symbols: false,
    excludeSimilar: false,
    excludeAmbiguous: false,
    requireEachType: false,
    count: 1,
  },
};

function buildCharset(options: Options): {
  charset: string;
  required: string[];
} {
  const sets: string[] = [];
  if (options.lowercase) sets.push(LOWERCASE);
  if (options.uppercase) sets.push(UPPERCASE);
  if (options.numbers) sets.push(NUMBERS);
  if (options.symbols) sets.push(SYMBOLS);

  const filtered = sets.map((s) => {
    let result = s;
    if (options.excludeSimilar) result = result.replace(SIMILAR, '');
    if (options.excludeAmbiguous) result = result.replace(AMBIGUOUS, '');
    return result;
  });

  return {
    charset: filtered.join(''),
    required: filtered.filter((s) => s.length > 0),
  };
}

function randomInt(max: number): number {
  if (max <= 0) return 0;
  const limit = Math.floor(0xffffffff / max) * max;
  const buf = new Uint32Array(1);
  while (true) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % max;
  }
}

function pickChar(chars: string): string {
  return chars.charAt(randomInt(chars.length));
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = arr.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generatePassword(options: Options): string {
  const { charset, required } = buildCharset(options);
  if (!charset || options.length <= 0) return '';

  const chars: string[] = [];

  if (options.requireEachType) {
    const guaranteed = Math.min(required.length, options.length);
    for (let i = 0; i < guaranteed; i++) {
      chars.push(pickChar(required[i]));
    }
  }

  while (chars.length < options.length) {
    chars.push(pickChar(charset));
  }

  return shuffleArray(chars).join('');
}

function calculateStrength(password: string, charsetSize: number) {
  if (!password || charsetSize <= 1) {
    return { bits: 0, label: 'None', color: 'bg-gray-400', percent: 0 };
  }
  const bits = password.length * Math.log2(charsetSize);
  let label = 'Weak';
  let color = 'bg-red-500';
  if (bits >= 128) {
    label = 'Very Strong';
    color = 'bg-emerald-500';
  } else if (bits >= 80) {
    label = 'Strong';
    color = 'bg-green-500';
  } else if (bits >= 60) {
    label = 'Good';
    color = 'bg-yellow-500';
  } else if (bits >= 40) {
    label = 'Fair';
    color = 'bg-orange-500';
  }
  const percent = Math.min(100, (bits / 128) * 100);
  return { bits: Math.round(bits), label, color, percent };
}

export default function PasswordGeneratorPage() {
  const [options, setOptions] = useState<Options>(PRESETS.strong);
  const [preset, setPreset] = useState<Preset>('strong');
  const [passwords, setPasswords] = useState<string[]>([]);
  const [error, setError] = useState('');

  const updateOption = <K extends keyof Options>(key: K, value: Options[K]) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
    setPreset('custom');
  };

  const handlePresetChange = (value: string) => {
    const next = value as Preset;
    setPreset(next);
    if (next !== 'custom') {
      setOptions(PRESETS[next]);
    }
  };

  const { charset } = useMemo(() => buildCharset(options), [options]);

  const generate = useCallback(() => {
    if (!charset) {
      setError('Select at least one character type.');
      setPasswords([]);
      return;
    }
    if (options.length < 1) {
      setError('Length must be at least 1.');
      setPasswords([]);
      return;
    }
    setError('');
    const next: string[] = [];
    for (let i = 0; i < options.count; i++) {
      next.push(generatePassword(options));
    }
    setPasswords(next);
  }, [charset, options]);

  useEffect(() => {
    generate();
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const copyAll = async () => {
    if (passwords.length === 0) return;
    try {
      await navigator.clipboard.writeText(passwords.join('\n'));
      toast.success(`Copied ${passwords.length} password(s) to clipboard!`);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const primary = passwords[0] ?? '';
  const strength = calculateStrength(primary, charset.length);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Password Generator</h1>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Generated Password</CardTitle>
            <CardDescription>
              Cryptographically random passwords using your browser&apos;s
              secure random number generator
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 rounded-md border p-3 bg-muted font-mono text-base break-all min-h-[48px] flex items-center">
                  {primary || (
                    <span className="text-muted-foreground text-sm">
                      Click Generate to create a password...
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(primary)}
                  disabled={!primary}
                  aria-label="Copy password"
                  title="Copy"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  onClick={generate}
                  aria-label="Regenerate password"
                  title="Regenerate"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    Strength: {strength.label}
                  </span>
                  <span className="text-muted-foreground">
                    ~{strength.bits} bits of entropy
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full transition-all ${strength.color}`}
                    style={{ width: `${strength.percent}%` }}
                  />
                </div>
              </div>

              {passwords.length > 1 && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      Additional passwords ({passwords.length - 1})
                    </label>
                    <Button variant="outline" size="sm" onClick={copyAll}>
                      Copy all
                    </Button>
                  </div>
                  <div className="rounded-md border bg-muted p-3 font-mono text-sm space-y-1 max-h-[300px] overflow-auto">
                    {passwords.slice(1).map((pwd, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 group"
                      >
                        <span className="break-all">{pwd}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => copyToClipboard(pwd)}
                          aria-label="Copy password"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Options</CardTitle>
            <CardDescription>
              Configure how passwords are generated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Preset</label>
                <Select value={preset} onValueChange={handlePresetChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strong">Strong (default)</SelectItem>
                    <SelectItem value="easy">Easy to read</SelectItem>
                    <SelectItem value="pin">Numeric PIN</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="length" className="text-sm font-medium">
                    Length
                  </label>
                  <span className="text-sm text-muted-foreground">
                    {options.length}
                  </span>
                </div>
                <input
                  id="length"
                  type="range"
                  min={4}
                  max={128}
                  value={options.length}
                  onChange={(e) =>
                    updateOption('length', Number(e.target.value))
                  }
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="count" className="text-sm font-medium">
                  Number of passwords
                </label>
                <Input
                  id="count"
                  type="number"
                  min={1}
                  max={50}
                  value={options.count}
                  onChange={(e) =>
                    updateOption(
                      'count',
                      Math.max(1, Math.min(50, Number(e.target.value) || 1)),
                    )
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Character Sets</CardTitle>
            <CardDescription>
              Choose which characters can appear in your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="lowercase"
                  checked={options.lowercase}
                  onChange={(e) => updateOption('lowercase', e.target.checked)}
                />
                <label htmlFor="lowercase" className="text-sm">
                  Lowercase{' '}
                  <span className="font-mono text-muted-foreground">(a-z)</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="uppercase"
                  checked={options.uppercase}
                  onChange={(e) => updateOption('uppercase', e.target.checked)}
                />
                <label htmlFor="uppercase" className="text-sm">
                  Uppercase{' '}
                  <span className="font-mono text-muted-foreground">(A-Z)</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="numbers"
                  checked={options.numbers}
                  onChange={(e) => updateOption('numbers', e.target.checked)}
                />
                <label htmlFor="numbers" className="text-sm">
                  Numbers{' '}
                  <span className="font-mono text-muted-foreground">(0-9)</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="symbols"
                  checked={options.symbols}
                  onChange={(e) => updateOption('symbols', e.target.checked)}
                />
                <label htmlFor="symbols" className="text-sm">
                  Symbols{' '}
                  <span className="font-mono text-muted-foreground">
                    (!@#$...)
                  </span>
                </label>
              </div>

              <div className="pt-2 border-t space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="exclude-similar"
                    checked={options.excludeSimilar}
                    onChange={(e) =>
                      updateOption('excludeSimilar', e.target.checked)
                    }
                  />
                  <label htmlFor="exclude-similar" className="text-sm">
                    Exclude similar characters{' '}
                    <span className="font-mono text-muted-foreground">
                      (i, l, 1, L, o, 0, O)
                    </span>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="exclude-ambiguous"
                    checked={options.excludeAmbiguous}
                    onChange={(e) =>
                      updateOption('excludeAmbiguous', e.target.checked)
                    }
                  />
                  <label htmlFor="exclude-ambiguous" className="text-sm">
                    Exclude ambiguous symbols{' '}
                    <span className="font-mono text-muted-foreground">
                      ({'{}'} [] () /\&apos;&quot;`~,;:.&lt;&gt;)
                    </span>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="require-each"
                    checked={options.requireEachType}
                    onChange={(e) =>
                      updateOption('requireEachType', e.target.checked)
                    }
                  />
                  <label htmlFor="require-each" className="text-sm">
                    Require at least one of each selected type
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <Button onClick={generate} className="w-full" size="lg">
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
