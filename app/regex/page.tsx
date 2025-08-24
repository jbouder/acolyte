'use client';

import { Badge } from '@/components/ui/badge';
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
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Match {
  match: string;
  index: number;
  groups: string[];
}

export default function RegexPage() {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [testString, setTestString] = useState('');
  const [replacement, setReplacement] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [replacedText, setReplacedText] = useState('');
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [isFullMatch, setIsFullMatch] = useState(false);

  // Common regex patterns for quick selection
  const commonPatterns = [
    {
      name: 'Email',
      pattern: '^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$',
      flags: 'i',
    },
    {
      name: 'URL',
      pattern:
        'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)',
      flags: 'gi',
    },
    {
      name: 'Phone (US)',
      pattern: '\\(?([0-9]{3})\\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})',
      flags: 'g',
    },
    {
      name: 'Date (MM/DD/YYYY)',
      pattern: '^(0[1-9]|1[0-2])\\/(0[1-9]|[12]\\d|3[01])\\/(19|20)\\d{2}$',
      flags: '',
    },
    {
      name: 'IP Address',
      pattern:
        '^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$',
      flags: '',
    },
    {
      name: 'Hex Color',
      pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$',
      flags: 'i',
    },
    {
      name: 'Credit Card',
      pattern:
        '^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})$',
      flags: '',
    },
    { name: 'HTML Tags', pattern: '<\\/?[a-z][\\s\\S]*>', flags: 'gi' },
    { name: 'Whitespace', pattern: '\\s+', flags: 'g' },
    { name: 'Numbers Only', pattern: '^[0-9]+$', flags: '' },
  ];

  // Test regex and find matches
  useEffect(() => {
    if (!pattern || !testString) {
      setMatches([]);
      setError('');
      setIsValid(false);
      setIsFullMatch(false);
      return;
    }

    try {
      const regex = new RegExp(pattern, flags);
      setIsValid(true);
      setError('');

      // Check if the entire string matches the pattern (validation mode)
      const fullMatchRegex = new RegExp(
        `^(?:${pattern})$`,
        flags.replace('g', ''),
      );
      const fullMatch = fullMatchRegex.test(testString);
      setIsFullMatch(fullMatch);

      const foundMatches: Match[] = [];
      let match;

      if (flags.includes('g')) {
        while ((match = regex.exec(testString)) !== null) {
          foundMatches.push({
            match: match[0],
            index: match.index,
            groups: match.slice(1),
          });
          // Prevent infinite loops with zero-length matches
          if (match[0].length === 0) {
            regex.lastIndex++;
          }
        }
      } else {
        match = regex.exec(testString);
        if (match) {
          foundMatches.push({
            match: match[0],
            index: match.index,
            groups: match.slice(1),
          });
        }
      }

      setMatches(foundMatches);
    } catch (err) {
      setError((err as Error).message);
      setIsValid(false);
      setMatches([]);
      setIsFullMatch(false);
    }
  }, [pattern, flags, testString]);

  // Update replaced text
  useEffect(() => {
    if (!pattern || !testString || !replacement) {
      setReplacedText('');
      return;
    }

    try {
      const regex = new RegExp(pattern, flags);
      const result = testString.replace(regex, replacement);
      setReplacedText(result);
    } catch {
      setReplacedText('');
    }
  }, [pattern, flags, testString, replacement]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const loadCommonPattern = (patternObj: (typeof commonPatterns)[0]) => {
    setPattern(patternObj.pattern);
    setFlags(patternObj.flags);
    toast.success(`Loaded ${patternObj.name} pattern`);
  };

  const clearAll = () => {
    setPattern('');
    setFlags('g');
    setTestString('');
    setReplacement('');
    setMatches([]);
    setReplacedText('');
    setError('');
    setIsValid(false);
    toast.success('All fields cleared!');
  };

  const highlightMatches = (text: string, matches: Match[]) => {
    if (matches.length === 0) return text;

    let highlightedText = text;
    let offset = 0;

    matches.forEach((match, index) => {
      const startTag = `<mark class="bg-yellow-200 dark:bg-yellow-800" data-match="${index}">`;
      const endTag = '</mark>';
      const insertPos = match.index + offset;

      highlightedText =
        highlightedText.slice(0, insertPos) +
        startTag +
        match.match +
        endTag +
        highlightedText.slice(insertPos + match.match.length);

      offset += startTag.length + endTag.length;
    });

    return highlightedText;
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Regex Tester</h1>
        <Button onClick={clearAll} variant="outline">
          Clear All
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Regular Expression</CardTitle>
            <CardDescription>
              Enter your regex pattern and flags
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Pattern</label>
              <div className="flex items-center gap-2">
                <span className="text-lg font-mono">/</span>
                <Input
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="Enter regex pattern..."
                  className="flex-1 font-mono"
                />
                <span className="text-lg font-mono">/</span>
                <Input
                  value={flags}
                  onChange={(e) => setFlags(e.target.value)}
                  placeholder="flags"
                  className="w-20 font-mono"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive mt-2">{error}</p>
              )}
              {isValid && pattern && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="default" className="bg-green-500">
                    Valid Regex
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(`/${pattern}/${flags}`, 'Regex')
                    }
                  >
                    Copy Regex
                  </Button>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Common Patterns
              </label>
              <Select
                onValueChange={(value) => {
                  const selected = commonPatterns.find((p) => p.name === value);
                  if (selected) loadCommonPattern(selected);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a common pattern..." />
                </SelectTrigger>
                <SelectContent>
                  {commonPatterns.map((pattern) => (
                    <SelectItem key={pattern.name} value={pattern.name}>
                      {pattern.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Flags Guide
              </label>
              <div className="text-xs space-y-1 text-muted-foreground">
                <div>
                  <code>g</code> - Global (find all matches)
                </div>
                <div>
                  <code>i</code> - Case insensitive
                </div>
                <div>
                  <code>m</code> - Multiline
                </div>
                <div>
                  <code>s</code> - Dotall (. matches newline)
                </div>
                <div>
                  <code>u</code> - Unicode
                </div>
                <div>
                  <code>y</code> - Sticky
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Test String</CardTitle>
                <CardDescription>
                  Enter text to test your regex against. The badge shows if the
                  entire string matches the pattern.
                </CardDescription>
              </div>
              {pattern && testString && (
                <Badge
                  variant={isFullMatch ? 'default' : 'secondary'}
                  className={
                    isFullMatch
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }
                >
                  {isFullMatch ? '✓ Valid' : '✗ Invalid'}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              placeholder="Enter test string here..."
              className="min-h-[200px] font-mono text-sm"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-muted-foreground">
                {testString.length} characters
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(testString, 'Test string')}
                disabled={!testString}
              >
                Copy Text
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Matches Section */}
      {matches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Matches
              <Badge variant="secondary">
                {matches.length} {matches.length === 1 ? 'match' : 'matches'}
              </Badge>
            </CardTitle>
            <CardDescription>
              All matches found in the test string
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {matches.map((match, index) => (
                <div key={index} className="border rounded-lg p-3 bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Match {index + 1}
                    </span>
                    <div className="flex gap-2">
                      <Badge variant="outline">Index: {match.index}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(match.match, `Match ${index + 1}`)
                        }
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                  <div className="font-mono text-sm bg-background p-2 rounded border">
                    &ldquo;{match.match}&rdquo;
                  </div>
                  {match.groups.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs font-medium">Groups:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {match.groups.map((group, groupIndex) => (
                          <Badge
                            key={groupIndex}
                            variant="secondary"
                            className="text-xs"
                          >
                            ${groupIndex + 1}: &ldquo;{group}&rdquo;
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visual Match Highlighting */}
      {matches.length > 0 && testString && (
        <Card>
          <CardHeader>
            <CardTitle>Visual Matches</CardTitle>
            <CardDescription>
              Test string with matches highlighted
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="p-3 bg-muted/50 rounded border font-mono text-sm whitespace-pre-wrap"
              dangerouslySetInnerHTML={{
                __html: highlightMatches(testString, matches),
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Replace Section */}
      <Card>
        <CardHeader>
          <CardTitle>Replace</CardTitle>
          <CardDescription>
            Test regex replacement functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Replacement String
            </label>
            <Input
              value={replacement}
              onChange={(e) => setReplacement(e.target.value)}
              placeholder="Enter replacement string (use $1, $2 for groups)..."
              className="font-mono"
            />
            <div className="text-xs text-muted-foreground mt-1">
              Use $1, $2, etc. to reference capture groups
            </div>
          </div>

          {replacedText && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Result</label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(replacedText, 'Replaced text')}
                >
                  Copy Result
                </Button>
              </div>
              <Textarea
                value={replacedText}
                readOnly
                className="min-h-[100px] font-mono text-sm bg-muted/50"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
