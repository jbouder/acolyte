'use client';

import { Bot, LoaderCircle, Send, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  type AssistantAction,
  executeAssistantAction,
} from '@/lib/assistant-actions';
import { assistantContent } from '@/lib/assistant-content.generated';
import { assistantTools } from '@/lib/assistant-tools';

const MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';
const MAX_HISTORY = 6;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ModelReply {
  reply: string;
  action?: AssistantAction;
}

function parseModelReply(content: string): ModelReply {
  try {
    const parsed = JSON.parse(content) as ModelReply;
    if (
      typeof parsed.reply === 'string' &&
      (!parsed.action ||
        (typeof parsed.action.name === 'string' &&
          typeof parsed.action.input === 'string'))
    ) {
      return parsed;
    }
  } catch {
    // Plain-text answers remain useful when a small local model does not follow JSON.
  }

  return { reply: content };
}

const systemPrompt = `You are Acolyte's local assistant. Answer concise questions about the app using this catalog:
${assistantContent}

You may use only these text-only actions: ${assistantTools
  .map((tool) => tool.name)
  .join(', ')}.
When an action would help, respond with strict JSON: {"reply":"brief explanation","action":{"name":"action name","input":"exact text to process"}}.
Otherwise respond with strict JSON: {"reply":"brief answer"}. Never claim an action ran unless you requested it.`;

export function FloatingAssistant() {
  const engine = useRef<import('@mlc-ai/web-llm').MLCEngineInterface | null>(
    null,
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadStatus, setLoadStatus] = useState('');
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  const loadEngine = async () => {
    if (engine.current) return engine.current;
    if (!('gpu' in navigator)) {
      throw new Error('WebGPU is unavailable in this browser.');
    }

    setIsLoading(true);
    setLoadStatus('Preparing the local model…');
    try {
      const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
      engine.current = await CreateMLCEngine(MODEL_ID, {
        initProgressCallback: (report) => setLoadStatus(report.text),
      });
      setLoadStatus('');
      return engine.current;
    } finally {
      setIsLoading(false);
    }
  };

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
      const response = await localEngine.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.map(({ role, content }) => ({ role, content })),
        ],
        temperature: 0.2,
        max_tokens: 256,
      });
      const content = response.choices[0]?.message.content?.trim();
      if (!content) throw new Error('The local model returned no response.');

      const reply = parseModelReply(content);
      const actionResult = reply.action
        ? `\n\n${executeAssistantAction(reply.action)}`
        : '';
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: `${reply.reply}${actionResult}` },
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
              <p className="text-sm text-muted-foreground">
                Ask about Acolyte&apos;s tools, or ask me to format JSON or
                encode text as Base64.
              </p>
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
