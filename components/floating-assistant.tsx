'use client';

import type { ChatCompletionMessageParam } from '@mlc-ai/web-llm';
import { Bot, Eraser, LoaderCircle, Send, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  type AssistantAction,
  assistantActionNames,
  detectAssistantAction,
  executeAssistantAction,
  isAssistantAction,
  resolveAppTool,
} from '@/lib/assistant-actions';
import { assistantContent } from '@/lib/assistant-content.generated';
import { assistantTools } from '@/lib/assistant-tools';

// Match the model to the device so phones don't have to download and hold the
// larger weights: desktops get the more capable 1.7B model, phones get the
// lightweight 0.6B model (~0.5 GB, far less memory) instead of no chat at all.
const DESKTOP_MODEL_ID = 'Qwen3-1.7B-q4f16_1-MLC';
const MOBILE_MODEL_ID = 'Qwen3-0.6B-q4f16_1-MLC';
const MAX_HISTORY = 6;
const MAX_TOOL_CALLS = 3;
const REPLY_SCHEMA = JSON.stringify({
  type: 'object',
  properties: {
    reply: { type: 'string' },
    action: {
      type: 'object',
      properties: {
        name: { type: 'string', enum: assistantActionNames },
        input: { type: 'string' },
      },
      required: ['name', 'input'],
    },
  },
  required: ['reply'],
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ModelReply {
  reply: string;
  action?: AssistantAction;
}

function extractJsonObject(content: string): string | undefined {
  // Small models often wrap their output in <think> blocks or markdown code
  // fences, and sometimes add prose around the JSON. Strip the noise and pull
  // out the first balanced { ... } object before parsing.
  const withoutThinking = content.replace(/<think>[\s\S]*?<\/think>/gi, '');
  const withoutFences = withoutThinking.replace(/```(?:json)?/gi, '');

  const start = withoutFences.indexOf('{');
  if (start === -1) return undefined;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < withoutFences.length; i++) {
    const char = withoutFences[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === '{') depth++;
    else if (char === '}') {
      depth--;
      if (depth === 0) return withoutFences.slice(start, i + 1);
    }
  }
  return undefined;
}

function parseModelReply(content: string): ModelReply {
  const json = extractJsonObject(content);
  if (json) {
    try {
      const parsed = JSON.parse(json) as ModelReply;
      if (typeof parsed.reply === 'string') {
        return {
          reply: parsed.reply,
          ...(isAssistantAction(parsed.action)
            ? { action: parsed.action }
            : {}),
        };
      }
    } catch {
      // Fall through to the plain-text fallback below.
    }
  }

  // The model returned prose instead of JSON; surface it as the reply rather
  // than failing the whole exchange.
  const fallback = content
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/```(?:json)?/gi, '')
    .trim();
  if (!fallback) throw new Error('The local model returned no response.');
  return { reply: fallback };
}

function getUnavailableReason() {
  const isMobileBrowser =
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (isMobileBrowser) {
    return 'The local assistant is unavailable on mobile browsers to prevent device memory exhaustion.';
  }

  if (!('gpu' in navigator)) {
    return 'WebGPU is unavailable in this browser.';
  }

  return '';
}

const systemPrompt = `You are Acolyte's local assistant. Answer concise questions about the app using this catalog:
${assistantContent}

You may use only these text-only actions: ${assistantTools
  .map((tool) => `${tool.name} (${tool.description})`)
  .join(', ')}.
Select an action only when it will help answer the user's request. When an action would help, respond with strict JSON: {"reply":"brief explanation","action":{"name":"action name","input":"exact text to process"}}.
Guidance for choosing an action:
- Use list_tools when the user asks what you (the chat/assistant) can do.
- Use list_app_tools when the user asks what tools or features the Acolyte app has.
- Use open_tool to navigate to a tool the user names; put the tool name in "input".
- Use decode_base64 to decode Base64 (e.g. input "SGVsbG8=") and encode_base64 to encode text.
- Use generate_password when the user wants a password; put the desired length in "input" (or "" for the default).
- Use decode_jwt when the user provides a JWT; put the whole token in "input".
- Use format_json to pretty-print JSON and minify_json to compact it; put the JSON in "input".
- Use convert_color to convert a color; put the color (hex, RGB, or HSL) in "input".
- Use test_regex to test a regular expression; set "input" to JSON like {"pattern":"\\\\d+","flags":"g","text":"a1 b2"}.
Put the exact value to process in "input" (for example the Base64 string, the JWT, or the JSON). The action result is shown to the user verbatim, so keep "reply" to a brief sentence and never invent the result yourself.
After receiving an action result, respond with strict JSON: {"reply":"brief answer"}, or select another action if one is still needed. Never claim an action ran unless you requested it.`;

export function FloatingAssistant() {
  const engine = useRef<import('@mlc-ai/web-llm').MLCEngineInterface | null>(
    null,
  );
  const engineLoad = useRef<
    Promise<import('@mlc-ai/web-llm').MLCEngineInterface> | undefined
  >(undefined);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadStatus, setLoadStatus] = useState('');
  const [loadError, setLoadError] = useState('');
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const isMobile = useIsMobile();
  const modelId = isMobile ? MOBILE_MODEL_ID : DESKTOP_MODEL_ID;
  const router = useRouter();

  // Run an action, handling the one action with a side effect (navigation)
  // here in the component and delegating the rest to the pure executor.
  const runAction = (action: AssistantAction): string => {
    if (action.name === 'open_tool') {
      const tool = resolveAppTool(action.input);
      if (!tool) return 'No matching Acolyte tool was found.';
      router.push(tool.url);
      return `Opening ${tool.title}…`;
    }
    return executeAssistantAction(action);
  };

  const loadEngine = async () => {
    if (engine.current) return engine.current;
    if (engineLoad.current) return engineLoad.current;
    const unavailableReason = getUnavailableReason();
    if (unavailableReason) throw new Error(unavailableReason);

    setIsLoading(true);
    setLoadStatus('Preparing the local model…');
    setLoadError('');
    engineLoad.current = (async () => {
      const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
      engine.current = await CreateMLCEngine(modelId, {
        initProgressCallback: (report) => setLoadStatus(report.text),
      });
      setLoadStatus('');
      return engine.current;
    })();

    try {
      return await engineLoad.current;
    } finally {
      engineLoad.current = undefined;
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || engine.current) return;

    void loadEngine().catch((error) => {
      setLoadError(
        error instanceof Error ? error.message : 'Unknown error occurred.',
      );
    });
  }, [isOpen]);

  const sendMessage = async () => {
    const input = prompt.trim();
    if (!input || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    const history = [...messages, userMessage].slice(-MAX_HISTORY);
    setMessages(history);
    setPrompt('');

    // Route high-confidence intents (a pasted JWT, "decode base64 …",
    // "generate a password") deterministically before the model, so they run
    // instantly and reliably without depending on the small model's routing.
    const detected = detectAssistantAction(input);
    if (detected) {
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: runAction(detected) },
      ]);
      return;
    }

    try {
      const localEngine = await loadEngine();
      setIsLoading(true);
      const agentMessages: ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...history.map(({ role, content }) => ({ role, content })),
      ];
      let lastReply = '';
      let lastActionResult = '';

      for (let toolCalls = 0; toolCalls <= MAX_TOOL_CALLS; toolCalls++) {
        const response = await localEngine.chat.completions.create({
          messages: agentMessages,
          temperature: 0.2,
          max_tokens: 256,
          extra_body: {
            enable_thinking: false,
          },
          response_format: {
            type: 'json_object',
            schema: REPLY_SCHEMA,
          },
        });
        const content = response.choices[0]?.message.content?.trim();
        if (!content) throw new Error('The local model returned no response.');

        const reply = parseModelReply(content);
        lastReply = reply.reply;
        if (!reply.action) break;

        if (toolCalls === MAX_TOOL_CALLS) break;

        lastActionResult = runAction(reply.action);
        agentMessages.push({ role: 'assistant', content });
        agentMessages.push({
          role: 'user',
          content: `The ${reply.action.name} action returned:\n${lastActionResult}\n\nUse this result to answer the original request. Select another action only if necessary.`,
        });
      }

      // Deterministic action results (decoded text, generated passwords, JWT
      // claims, etc.) are the real answer, so surface them verbatim rather than
      // trusting the small model to reproduce them. Skip the append only when
      // the model already echoed the result back in its reply.
      const finalContent =
        lastActionResult && !lastReply.includes(lastActionResult)
          ? `${lastReply}\n\n${lastActionResult}`.trim()
          : lastReply || lastActionResult;

      setMessages((current) => [
        ...current,
        { role: 'assistant', content: finalContent },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: `Unable to start the local assistant: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed right-4 bottom-4 z-50">
      {isOpen && (
        <section
          aria-label="Acolyte assistant"
          className="mb-3 flex h-[min(32rem,calc(100vh-8rem))] w-[min(24rem,calc(100vw-2rem))] flex-col rounded-lg border bg-background shadow-xl"
        >
          <header className="flex items-center justify-between border-b p-3">
            <div>
              <h2 className="font-semibold">Acolyte Assistant</h2>
              <p className="text-xs text-muted-foreground">
                Local and powered by WebLLM
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                aria-label="Clear conversation"
                disabled={messages.length === 0}
                onClick={() => setMessages([])}
                size="icon"
                variant="ghost"
              >
                <Eraser />
              </Button>
              <Button
                aria-label="Close assistant"
                onClick={() => setIsOpen(false)}
                size="icon"
                variant="ghost"
              >
                <X />
              </Button>
            </div>
          </header>
          <div
            aria-live="polite"
            className="flex-1 space-y-3 overflow-y-auto p-3"
          >
            {messages.length === 0 && (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Ask what I can do or what tools the app has. I can also format
                  JSON, encode or decode Base64, decode a JWT, and generate a
                  password.
                </p>
                <p>Try: “List your tools” or “Generate a password.”</p>
              </div>
            )}
            {messages.map((message, index) => (
              <p
                className={
                  message.role === 'user'
                    ? 'ml-8 rounded-md bg-primary p-2 text-sm whitespace-pre-wrap text-primary-foreground'
                    : 'mr-8 rounded-md bg-muted p-2 text-sm whitespace-pre-wrap'
                }
                key={`${message.role}-${index}`}
              >
                {message.content}
              </p>
            ))}
            {isLoading && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" />
                {loadStatus || 'Thinking…'}
              </p>
            )}
            {loadError && (
              <p className="text-sm text-destructive" role="alert">
                Unable to start the local assistant: {loadError}
              </p>
            )}
          </div>
          <form
            className="flex gap-2 border-t p-3"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage();
            }}
          >
            <Input
              aria-label="Ask the assistant"
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Ask about Acolyte…"
              value={prompt}
            />
            <Button aria-label="Send message" disabled={isLoading} size="icon">
              <Send />
            </Button>
          </form>
        </section>
      )}
      <Button
        aria-expanded={isOpen}
        aria-label="Open Acolyte assistant"
        className="size-14 rounded-full shadow-lg [&_svg:not([class*='size-'])]:size-6"
        onClick={() => setIsOpen((open) => !open)}
        size="icon"
      >
        <Bot />
      </Button>
    </div>
  );
}
