'use client';

import type { ChatCompletionMessageParam } from '@mlc-ai/web-llm';
import { Bot, LoaderCircle, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  type AssistantAction,
  assistantActionNames,
  executeAssistantAction,
  isAssistantAction,
} from '@/lib/assistant-actions';
import { assistantContent } from '@/lib/assistant-content.generated';
import { assistantTools } from '@/lib/assistant-tools';

const MODEL_ID = 'Qwen3-0.6B-q4f16_1-MLC';
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

function parseModelReply(content: string): ModelReply {
  const parsed = JSON.parse(content) as ModelReply;
  return {
    reply: parsed.reply,
    ...(isAssistantAction(parsed.action) ? { action: parsed.action } : {}),
  };
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
After receiving an action result, use it to answer the user or select another action if needed. Otherwise respond with strict JSON: {"reply":"brief answer"}. Never claim an action ran unless you requested it.`;

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
      engine.current = await CreateMLCEngine(MODEL_ID, {
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
        if (!reply.action) {
          setMessages((current) => [
            ...current,
            { role: 'assistant', content: reply.reply },
          ]);
          return;
        }

        if (toolCalls === MAX_TOOL_CALLS) break;

        lastActionResult = executeAssistantAction(reply.action);
        agentMessages.push({ role: 'assistant', content });
        agentMessages.push({
          role: 'user',
          content: `The ${reply.action.name} action returned:\n${lastActionResult}\n\nUse this result to answer the original request. Select another action only if necessary.`,
        });
      }

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: `${lastReply}\n\n${lastActionResult}`.trim(),
        },
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
            <Button
              aria-label="Close assistant"
              onClick={() => setIsOpen(false)}
              size="icon"
              variant="ghost"
            >
              <X />
            </Button>
          </header>
          <div
            aria-live="polite"
            className="flex-1 space-y-3 overflow-y-auto p-3"
          >
            {messages.length === 0 && (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Ask about Acolyte&apos;s tools, or ask me to format JSON or
                  encode text as Base64.
                </p>
                <p>Try: “List available tools and switch to dark mode.”</p>
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
        className="rounded-full shadow-lg"
        onClick={() => setIsOpen((open) => !open)}
        size="icon"
      >
        <Bot />
      </Button>
    </div>
  );
}
