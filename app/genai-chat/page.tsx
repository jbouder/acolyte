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
import { Textarea } from '@/components/ui/textarea';
import { genAIChatStorage } from '@/lib/genai-chat-storage';
import { Bot, Send, Trash2, User } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type ChatRole = 'user' | 'assistant';
type ProviderId = 'llama-cpp' | 'ollama' | 'docker-model-runner' | 'custom';

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

interface ProviderPreset {
  id: ProviderId;
  name: string;
  description: string;
  baseUrl: string;
  defaultModel: string;
  requiresApiKey: boolean;
}

const STORAGE_KEY = 'acolyte:genai-chat-settings';

const PROVIDERS: ProviderPreset[] = [
  {
    id: 'llama-cpp',
    name: 'llama.cpp',
    description: 'OpenAI-compatible llama.cpp server on localhost',
    baseUrl: 'http://localhost:8080/v1',
    defaultModel: 'local-model',
    requiresApiKey: false,
  },
  {
    id: 'ollama',
    name: 'Ollama',
    description: 'Ollama OpenAI-compatible endpoint',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3.2',
    requiresApiKey: false,
  },
  {
    id: 'docker-model-runner',
    name: 'Docker Model Runner',
    description: 'Docker Model Runner OpenAI-compatible engine endpoint',
    baseUrl: 'http://localhost:12434/engines/v1',
    defaultModel: 'ai/smollm2',
    requiresApiKey: false,
  },
  {
    id: 'custom',
    name: 'Custom / External',
    description: 'Manually enter any OpenAI v1-compatible URL and API key',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4.1-mini',
    requiresApiKey: true,
  },
];

const providerById = new Map(
  PROVIDERS.map((provider) => [provider.id, provider]),
);

function buildChatCompletionUrl(baseUrl: string) {
  const url = new URL(baseUrl.trim());
  const path = url.pathname.replace(/\/+$/, '');

  if (path.endsWith('/chat/completions')) {
    url.pathname = path;
    return url.toString();
  }

  url.pathname = `${path || ''}/chat/completions`;
  return url.toString();
}

function parseAssistantMessage(payload: unknown) {
  if (
    payload &&
    typeof payload === 'object' &&
    'choices' in payload &&
    Array.isArray(payload.choices)
  ) {
    const [choice] = payload.choices;

    if (
      choice &&
      typeof choice === 'object' &&
      'message' in choice &&
      choice.message &&
      typeof choice.message === 'object' &&
      'content' in choice.message &&
      typeof choice.message.content === 'string'
    ) {
      return choice.message.content;
    }
  }

  return '';
}

export default function GenAIChatPage() {
  const [selectedProvider, setSelectedProvider] =
    useState<ProviderId>('llama-cpp');
  const [baseUrl, setBaseUrl] = useState(PROVIDERS[0].baseUrl);
  const [apiKey, setApiKey] = useState('');
  const [saveCredential, setSaveCredential] = useState(false);
  const [model, setModel] = useState(PROVIDERS[0].defaultModel);
  const [systemPrompt, setSystemPrompt] = useState(
    'You are a helpful developer assistant.',
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [hasLoadedSettings, setHasLoadedSettings] = useState(false);

  const currentProvider = useMemo(
    () => providerById.get(selectedProvider) ?? PROVIDERS[0],
    [selectedProvider],
  );

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = window.localStorage.getItem(STORAGE_KEY);

        if (savedSettings) {
          const parsed = JSON.parse(savedSettings) as Partial<{
            selectedProvider: ProviderId;
            baseUrl: string;
            saveCredential: boolean;
            model: string;
            systemPrompt: string;
          }>;

          if (
            parsed.selectedProvider &&
            providerById.has(parsed.selectedProvider)
          ) {
            setSelectedProvider(parsed.selectedProvider);
          }
          if (parsed.baseUrl) setBaseUrl(parsed.baseUrl);
          if (parsed.saveCredential) {
            const savedApiKey = await genAIChatStorage.getApiKey();
            setApiKey(savedApiKey);
            setSaveCredential(true);
          }
          if (parsed.model) setModel(parsed.model);
          if (parsed.systemPrompt) setSystemPrompt(parsed.systemPrompt);
        }
      } catch (loadError) {
        console.warn('Failed to load GenAI chat settings:', loadError);
      } finally {
        setHasLoadedSettings(true);
      }
    };

    void loadSettings();
  }, []);

  useEffect(() => {
    if (!hasLoadedSettings) return;

    const settings = {
      selectedProvider,
      baseUrl,
      saveCredential,
      model,
      systemPrompt,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

    if (saveCredential && apiKey.trim()) {
      void genAIChatStorage.saveApiKey(apiKey);
    } else {
      void genAIChatStorage.deleteApiKey();
    }
  }, [
    apiKey,
    baseUrl,
    hasLoadedSettings,
    model,
    saveCredential,
    selectedProvider,
    systemPrompt,
  ]);

  const selectProvider = (provider: ProviderPreset) => {
    setSelectedProvider(provider.id);
    setBaseUrl(provider.baseUrl);
    setModel(provider.defaultModel);
    setError('');
  };

  const clearConversation = () => {
    setMessages([]);
    setError('');
    toast.info('Conversation cleared');
  };

  const sendMessage = async () => {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      toast.error('Enter a message to send');
      return;
    }

    if (!baseUrl.trim()) {
      toast.error('Enter a provider URL');
      return;
    }

    if (!model.trim()) {
      toast.error('Enter a model name');
      return;
    }

    setIsSending(true);
    setError('');

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmedPrompt,
    };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setPrompt('');

    try {
      const chatUrl = buildChatCompletionUrl(baseUrl);
      const requestMessages = [
        ...(systemPrompt.trim()
          ? [{ role: 'system', content: systemPrompt.trim() }]
          : []),
        ...nextMessages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ];
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (apiKey.trim()) {
        headers.Authorization = `Bearer ${apiKey.trim()}`;
      }

      const response = await fetch(chatUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: model.trim(),
          messages: requestMessages,
          stream: false,
        }),
      });

      const responseText = await response.text();
      const payload = responseText ? JSON.parse(responseText) : {};

      if (!response.ok) {
        const message =
          payload &&
          typeof payload === 'object' &&
          'error' in payload &&
          payload.error &&
          typeof payload.error === 'object' &&
          'message' in payload.error &&
          typeof payload.error.message === 'string'
            ? payload.error.message
            : `Request failed with status ${response.status}`;

        throw new Error(message);
      }

      const assistantContent = parseAssistantMessage(payload);

      if (!assistantContent) {
        throw new Error('No assistant message returned by the provider');
      }

      setMessages([
        ...nextMessages,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: assistantContent,
        },
      ]);
      toast.success('Message sent');
    } catch (sendError) {
      const message =
        sendError instanceof Error
          ? sendError.message
          : 'Failed to send message';

      setError(message);
      setMessages(messages);
      setPrompt(trimmedPrompt);
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">GenAI Chat</h1>
        <p className="text-muted-foreground">
          Chat with local or external OpenAI v1-compatible model providers.
          Provider URL and API key can be stored in local browser storage.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Provider</CardTitle>
              <CardDescription>
                Choose a local preset or configure an external endpoint.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {PROVIDERS.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => selectProvider(provider)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent ${
                    selectedProvider === provider.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{provider.name}</span>
                    {selectedProvider === provider.id && (
                      <Badge variant="secondary">Selected</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {provider.description}
                  </p>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connection</CardTitle>
              <CardDescription>
                Requests are sent to the /chat/completions endpoint.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="genai-url" className="text-sm font-medium">
                  Provider URL
                </label>
                <Input
                  id="genai-url"
                  value={baseUrl}
                  onChange={(event) => setBaseUrl(event.target.value)}
                  placeholder="http://localhost:11434/v1"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="genai-api-key" className="text-sm font-medium">
                  API Key
                  {!currentProvider.requiresApiKey && (
                    <span className="ml-1 text-muted-foreground">
                      (optional)
                    </span>
                  )}
                </label>
                <Input
                  id="genai-api-key"
                  type="password"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder="Only stored when you opt in below"
                />
              </div>

              <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-3">
                <input
                  id="genai-remember-api-key"
                  type="checkbox"
                  checked={saveCredential}
                  onChange={(event) => setSaveCredential(event.target.checked)}
                  className="mt-1 rounded"
                />
                <label
                  htmlFor="genai-remember-api-key"
                  className="text-sm leading-5"
                >
                  Remember API key in local storage
                  <span className="block text-xs text-muted-foreground">
                    Only enable this on a trusted device. Local provider presets
                    usually do not need a key.
                  </span>
                </label>
              </div>

              <div className="space-y-2">
                <label htmlFor="genai-model" className="text-sm font-medium">
                  Model
                </label>
                <Input
                  id="genai-model"
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  placeholder="llama3.2"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="genai-system" className="text-sm font-medium">
                  System Prompt
                </label>
                <Textarea
                  id="genai-system"
                  value={systemPrompt}
                  onChange={(event) => setSystemPrompt(event.target.value)}
                  className="min-h-24"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="min-h-[640px]">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Chat</CardTitle>
                <CardDescription>
                  Send non-streaming OpenAI v1-compatible chat completions.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearConversation}
                disabled={!messages.length}
              >
                <Trash2 />
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex min-h-[520px] flex-col gap-4">
            <div className="flex-1 space-y-3 rounded-lg border bg-muted/30 p-4">
              {messages.length === 0 ? (
                <div className="flex h-full min-h-72 items-center justify-center text-center text-muted-foreground">
                  Start a conversation with {currentProvider.name}.
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background border'
                      }`}
                    >
                      {message.content}
                    </div>
                    {message.role === 'user' && (
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {error && (
              <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="genai-message" className="text-sm font-medium">
                Message
              </label>
              <Textarea
                id="genai-message"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Ask your model a question..."
                className="min-h-28"
                onKeyDown={(event) => {
                  if (
                    event.key === 'Enter' &&
                    (event.metaKey || event.ctrlKey)
                  ) {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
              />
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  Press Ctrl+Enter or Cmd+Enter to send.
                </span>
                <Button
                  type="button"
                  onClick={sendMessage}
                  disabled={isSending}
                >
                  <Send />
                  {isSending ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
