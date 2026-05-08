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
import { ClipboardList, Plus, RefreshCw, Trash2, Users } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type Mode = 'create' | 'join';

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

interface RetroRecord {
  id?: string;
  session_id: string;
  owner_token_hash: string;
  name: string;
  columns: string[];
  created_at?: string;
}

interface RetroItem {
  id: string;
  session_id: string;
  column_name: string;
  content: string;
  author: string;
  created_at?: string;
}

const defaultColumns = 'Went well\nCould improve\nAction items';
const configStorageKey = 'acolyte-retro-supabase-config';
const ownerTokenPrefix = 'acolyte-retro-owner-token:';

function generateRandomId(length = 8) {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const maxUnbiasedValue = Math.floor(256 / alphabet.length) * alphabet.length;
  let id = '';

  while (id.length < length) {
    const values = new Uint8Array(length - id.length);
    crypto.getRandomValues(values);

    for (const value of values) {
      if (value < maxUnbiasedValue) {
        id += alphabet[value % alphabet.length];
      }
      if (id.length === length) break;
    }
  }

  return id;
}

function normalizeSupabaseUrl(url: string) {
  return url.trim().replace(/\/+$/, '');
}

function parseColumns(value: string) {
  return value
    .split('\n')
    .map((column) => column.trim())
    .filter(Boolean);
}

function getOwnerTokenKey(sessionId: string) {
  return `${ownerTokenPrefix}${sessionId}`;
}

async function hashToken(token: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(token),
  );
  return Array.from(new Uint8Array(digest), (value) =>
    value.toString(16).padStart(2, '0'),
  ).join('');
}

const schemaSql = `create table retros (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  owner_token_hash text not null,
  name text not null,
  columns jsonb not null,
  created_at timestamptz not null default now()
);

create table retro_items (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references retros(session_id) on delete cascade,
  column_name text not null,
  content text not null,
  author text not null,
  created_at timestamptz not null default now()
);

create index retros_session_id_idx on retros(session_id);
create index retro_items_session_id_idx on retro_items(session_id);`;

interface RetroPageProps {
  initialSessionId?: string;
}

export default function RetroPage({ initialSessionId }: RetroPageProps = {}) {
  const [mode, setMode] = useState<Mode>('join');
  const [config, setConfig] = useState<SupabaseConfig>({
    url: '',
    anonKey: '',
  });
  const [retroName, setRetroName] = useState('');
  const [columnsInput, setColumnsInput] = useState(defaultColumns);
  const [sessionInput, setSessionInput] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [activeRetro, setActiveRetro] = useState<RetroRecord | null>(null);
  const [items, setItems] = useState<RetroItem[]>([]);
  const [newItems, setNewItems] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [ownerTokenHash, setOwnerTokenHash] = useState<string | null>(null);
  const [pendingRouteSessionId, setPendingRouteSessionId] = useState(
    initialSessionId?.trim().toUpperCase() ?? '',
  );

  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem(configStorageKey);
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig) as SupabaseConfig);
      }
    } catch {
      localStorage.removeItem(configStorageKey);
    }
  }, []);

  useEffect(() => {
    const routeSessionId = initialSessionId?.trim().toUpperCase() ?? '';
    if (!routeSessionId) return;

    setMode('join');
    setSessionInput(routeSessionId);
    setPendingRouteSessionId(routeSessionId);
  }, [initialSessionId]);

  const ownerToken = useMemo(() => {
    if (!activeRetro) return null;
    return localStorage.getItem(getOwnerTokenKey(activeRetro.session_id));
  }, [activeRetro]);

  const isOwner = Boolean(
    activeRetro &&
      ownerToken &&
      ownerTokenHash &&
      ownerTokenHash === activeRetro.owner_token_hash,
  );

  const columns = activeRetro?.columns ?? parseColumns(columnsInput);

  const requestSupabase = useCallback(
    async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
      const baseUrl = normalizeSupabaseUrl(config.url);
      const anonKey = config.anonKey.trim();

      if (!baseUrl || !anonKey) {
        throw new Error('Enter your Supabase project URL and anon key.');
      }

      const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
        ...init,
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
          ...(init.headers ?? {}),
        },
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Supabase returned ${response.status}`);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return (await response.json()) as T;
    },
    [config],
  );

  const saveConfig = useCallback(() => {
    const nextConfig = {
      url: normalizeSupabaseUrl(config.url),
      anonKey: config.anonKey.trim(),
    };
    localStorage.setItem(configStorageKey, JSON.stringify(nextConfig));
    setConfig(nextConfig);
  }, [config]);

  const loadItems = useCallback(
    async (sessionId: string, showSpinner = true) => {
      if (showSpinner) setRefreshing(true);
      try {
        const data = await requestSupabase<RetroItem[]>(
          `retro_items?session_id=eq.${encodeURIComponent(
            sessionId,
          )}&order=created_at.asc`,
        );
        setItems(data);
      } finally {
        if (showSpinner) setRefreshing(false);
      }
    },
    [requestSupabase],
  );

  const loadRetro = useCallback(
    async (sessionId: string) => {
      const data = await requestSupabase<RetroRecord[]>(
        `retros?session_id=eq.${encodeURIComponent(sessionId)}&select=*`,
      );

      if (!data.length) {
        throw new Error('No retro found for that session id.');
      }

      setActiveRetro(data[0]);
      await loadItems(data[0].session_id);
    },
    [loadItems, requestSupabase],
  );

  useEffect(() => {
    let cancelled = false;

    if (!ownerToken) {
      setOwnerTokenHash(null);
      return;
    }

    hashToken(ownerToken)
      .then((hash) => {
        if (!cancelled) setOwnerTokenHash(hash);
      })
      .catch((error) => {
        console.warn('Failed to verify retro ownership:', error);
        if (!cancelled) setOwnerTokenHash(null);
      });

    return () => {
      cancelled = true;
    };
  }, [ownerToken]);

  const createRetro = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const parsedColumns = parseColumns(columnsInput);
      if (!retroName.trim()) {
        throw new Error('Enter a retro name.');
      }
      if (!parsedColumns.length) {
        throw new Error('Add at least one retro column.');
      }

      saveConfig();

      const sessionId = generateRandomId(16);
      const nextOwnerToken = generateRandomId(48);
      const nextOwnerTokenHash = await hashToken(nextOwnerToken);
      const data = await requestSupabase<RetroRecord[]>('retros?select=*', {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId,
          owner_token_hash: nextOwnerTokenHash,
          name: retroName.trim(),
          columns: parsedColumns,
        }),
      });

      localStorage.setItem(getOwnerTokenKey(sessionId), nextOwnerToken);
      setActiveRetro(data[0]);
      setItems([]);
      setSessionInput(sessionId);
      toast.success(`Retro created. Session id: ${sessionId}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create retro',
      );
    } finally {
      setLoading(false);
    }
  };

  const joinRetro = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (!sessionInput.trim()) {
        throw new Error('Enter a session id.');
      }

      saveConfig();
      await loadRetro(sessionInput.trim().toUpperCase());
      toast.success('Joined retro session');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to join retro',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      !pendingRouteSessionId ||
      !config.url.trim() ||
      !config.anonKey.trim() ||
      activeRetro?.session_id === pendingRouteSessionId
    ) {
      return;
    }

    let cancelled = false;
    setLoading(true);

    loadRetro(pendingRouteSessionId)
      .then(() => {
        if (!cancelled) {
          toast.success('Joined retro session');
          setPendingRouteSessionId('');
        }
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : 'Failed to join retro',
          );
          setPendingRouteSessionId('');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    activeRetro?.session_id,
    config.anonKey,
    config.url,
    loadRetro,
    pendingRouteSessionId,
  ]);

  const addItem = async (column: string) => {
    const content = newItems[column]?.trim();
    if (!activeRetro || !content) return;

    setLoading(true);
    try {
      const data = await requestSupabase<RetroItem[]>('retro_items?select=*', {
        method: 'POST',
        body: JSON.stringify({
          session_id: activeRetro.session_id,
          column_name: column,
          content,
          author: participantName.trim() || 'Anonymous',
        }),
      });

      setItems((currentItems) => [...currentItems, data[0]]);
      setNewItems((currentItems) => ({ ...currentItems, [column]: '' }));
      toast.success('Added retro item');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to add item',
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteRetro = async () => {
    if (!activeRetro || !isOwner || !ownerTokenHash) return;
    if (!window.confirm('Delete this retro and all of its items?')) return;

    setLoading(true);
    try {
      const sessionFilter = encodeURIComponent(activeRetro.session_id);
      await requestSupabase<undefined>(
        `retros?session_id=eq.${sessionFilter}&owner_token_hash=eq.${encodeURIComponent(
          ownerTokenHash,
        )}`,
        {
          method: 'DELETE',
          headers: { Prefer: 'return=minimal' },
        },
      );

      localStorage.removeItem(getOwnerTokenKey(activeRetro.session_id));
      setActiveRetro(null);
      setItems([]);
      toast.success('Retro deleted');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete retro',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="rounded-xl bg-muted/50 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-7 w-7 text-primary" />
              <h1 className="text-3xl font-bold">Retro Board</h1>
            </div>
            <p className="mt-2 max-w-3xl text-muted-foreground">
              Create or join a lightweight retrospective backed by your own
              Supabase project. Share the session id with teammates so everyone
              can add board items.
            </p>
          </div>
          {activeRetro ? (
            <Badge variant="secondary" className="text-sm">
              Session {activeRetro.session_id}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Start</CardTitle>
              <CardDescription>
                Create a new retro or join an existing session.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={mode === 'join' ? 'default' : 'outline'}
                  onClick={() => setMode('join')}
                >
                  Join retro
                </Button>
                <Button
                  type="button"
                  variant={mode === 'create' ? 'default' : 'outline'}
                  onClick={() => setMode('create')}
                >
                  Create retro
                </Button>
              </div>

              {mode === 'create' ? (
                <form className="space-y-3" onSubmit={createRetro}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="retro-name">
                      Retro name
                    </label>
                    <Input
                      id="retro-name"
                      placeholder="Sprint 42 retro"
                      value={retroName}
                      onChange={(event) => setRetroName(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium"
                      htmlFor="retro-columns"
                    >
                      Columns
                    </label>
                    <Textarea
                      id="retro-columns"
                      value={columnsInput}
                      onChange={(event) => setColumnsInput(event.target.value)}
                      className="min-h-28"
                    />
                    <p className="text-xs text-muted-foreground">
                      Add one column per line.
                    </p>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    Create session
                  </Button>
                </form>
              ) : (
                <form className="space-y-3" onSubmit={joinRetro}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="session-id">
                      Session id
                    </label>
                    <Input
                      id="session-id"
                      placeholder="ABC123"
                      value={sessionInput}
                      onChange={(event) => setSessionInput(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium"
                      htmlFor="participant-name"
                    >
                      Your name
                    </label>
                    <Input
                      id="participant-name"
                      placeholder="Optional"
                      value={participantName}
                      onChange={(event) =>
                        setParticipantName(event.target.value)
                      }
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    Join session
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Joining uses the Supabase connection saved in this browser.
                    Switch to create to update project settings.
                  </p>
                </form>
              )}
            </CardContent>
          </Card>

          {mode === 'create' ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Supabase connection</CardTitle>
                  <CardDescription>
                    Use your project URL and anon key. The key stays in this
                    browser and is sent directly to Supabase.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium"
                      htmlFor="supabase-url"
                    >
                      Project URL
                    </label>
                    <Input
                      id="supabase-url"
                      placeholder="https://project-ref.supabase.co"
                      value={config.url}
                      onChange={(event) =>
                        setConfig((currentConfig) => ({
                          ...currentConfig,
                          url: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium"
                      htmlFor="supabase-key"
                    >
                      Anon key
                    </label>
                    <Input
                      id="supabase-key"
                      type="password"
                      placeholder="eyJhbGciOi..."
                      value={config.anonKey}
                      onChange={(event) =>
                        setConfig((currentConfig) => ({
                          ...currentConfig,
                          anonKey: event.target.value,
                        }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Required Supabase tables</CardTitle>
                  <CardDescription>
                    Run this SQL in Supabase, then add Row Level Security
                    policies that fit your project.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="max-h-72 overflow-auto rounded-lg bg-muted p-3 text-xs">
                    {schemaSql}
                  </pre>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle>{activeRetro?.name ?? 'Retro session'}</CardTitle>
                <CardDescription>
                  {activeRetro
                    ? 'Add items to the board and refresh to see teammate updates.'
                    : 'Create or join a retro to open the board.'}
                </CardDescription>
              </div>
              {activeRetro ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={refreshing}
                    onClick={() => loadItems(activeRetro.session_id)}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                  {isOwner ? (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={loading}
                      onClick={deleteRetro}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete retro
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            {activeRetro ? (
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${Math.max(
                    1,
                    columns.length,
                  )}, minmax(220px, 1fr))`,
                }}
              >
                {columns.map((column) => {
                  const columnItems = items.filter(
                    (item) => item.column_name === column,
                  );

                  return (
                    <div
                      key={column}
                      className="flex min-h-96 flex-col gap-3 rounded-xl border bg-muted/30 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <h2 className="font-semibold">{column}</h2>
                        <Badge variant="outline">{columnItems.length}</Badge>
                      </div>
                      <div className="flex flex-1 flex-col gap-2">
                        {columnItems.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-lg border bg-background p-3 shadow-sm"
                          >
                            <p className="text-sm">{item.content}</p>
                            <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                              <Users className="h-3 w-3" />
                              {item.author}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2">
                        <Textarea
                          aria-label={`New item for ${column}`}
                          placeholder={`Add to ${column}`}
                          value={newItems[column] ?? ''}
                          onChange={(event) =>
                            setNewItems((currentItems) => ({
                              ...currentItems,
                              [column]: event.target.value,
                            }))
                          }
                        />
                        <Button
                          type="button"
                          size="sm"
                          disabled={loading || !newItems[column]?.trim()}
                          onClick={() => addItem(column)}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4" />
                          Add item
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-96 items-center justify-center rounded-xl border border-dashed text-center text-muted-foreground">
                <div>
                  <ClipboardList className="mx-auto mb-3 h-10 w-10" />
                  <p>No retro loaded yet.</p>
                  <p className="text-sm">
                    Create one or join with a session id.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
