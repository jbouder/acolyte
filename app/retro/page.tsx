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
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';

type Mode = 'create' | 'join';

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

interface RetroJoinDetails {
  sessionId: string;
  config?: SupabaseConfig;
}

interface RetroRecord {
  id?: string;
  session_id: string;
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
const retroSelectFields = 'id,session_id,name,columns,created_at';
const shareTokenPrefix = 'r1_';

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

function normalizeSupabaseConfig(config: SupabaseConfig) {
  return {
    url: normalizeSupabaseUrl(config.url),
    anonKey: config.anonKey.trim(),
  };
}

function normalizeSessionId(sessionId: string) {
  return sessionId.trim().toUpperCase();
}

function parseColumns(value: string) {
  return value
    .split('\n')
    .map((column) => column.trim())
    .filter(Boolean);
}

export function getOwnerTokenKey(sessionId: string) {
  return `${ownerTokenPrefix}${sessionId}`;
}

function normalizeRouteSessionId(sessionId?: string) {
  return sessionId?.trim() ?? '';
}

function encodeBase64Url(value: string) {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeBase64Url(value: string) {
  const paddedValue = `${value.replace(/-/g, '+').replace(/_/g, '/')}${'='.repeat(
    (4 - (value.length % 4)) % 4,
  )}`;
  return atob(paddedValue);
}

export function createRetroShareToken(
  sessionId: string,
  config: SupabaseConfig,
) {
  return `${shareTokenPrefix}${encodeBase64Url(
    JSON.stringify({
      sessionId: normalizeSessionId(sessionId),
      config: normalizeSupabaseConfig(config),
    }),
  )}`;
}

function parseShareToken(value: string): RetroJoinDetails | null {
  if (!value.startsWith(shareTokenPrefix)) return null;

  try {
    const payload = JSON.parse(
      decodeBase64Url(value.slice(shareTokenPrefix.length)),
    ) as Partial<{
      sessionId: unknown;
      config: Partial<SupabaseConfig>;
    }>;
    const sessionId =
      typeof payload.sessionId === 'string'
        ? normalizeSessionId(payload.sessionId)
        : '';
    const config =
      typeof payload.config?.url === 'string' &&
      typeof payload.config?.anonKey === 'string'
        ? normalizeSupabaseConfig({
            url: payload.config.url,
            anonKey: payload.config.anonKey,
          })
        : undefined;

    if (!sessionId || !config?.url || !config.anonKey) return null;

    return { sessionId, config };
  } catch {
    return null;
  }
}

function getJoinValueFromInput(value: string) {
  const trimmedValue = value.trim();

  try {
    const url = new URL(trimmedValue);
    const retroPathMatch = url.pathname.match(/\/retro\/([^/]+)$/);
    return decodeURIComponent(retroPathMatch?.[1] ?? url.hash.slice(1));
  } catch {
    return trimmedValue;
  }
}

function parseRetroJoinInput(value: string): RetroJoinDetails {
  const joinValue = getJoinValueFromInput(value);
  const shareDetails = parseShareToken(joinValue);

  if (shareDetails) return shareDetails;

  return { sessionId: normalizeSessionId(joinValue) };
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
create index retro_items_session_id_idx on retro_items(session_id);

alter table retros enable row level security;

revoke all on retros from anon;
-- DELETE is constrained by the RLS policy below; do not disable RLS.
grant select (id, session_id, name, columns, created_at), insert, delete on retros to anon;

create function verify_retro_owner(retro_session_id text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from retros
    where session_id = retro_session_id
      and owner_token_hash = current_setting('request.headers', true)::json->>'x-owner-token-hash'
  );
$$;

grant execute on function verify_retro_owner(text) to anon;

create policy "Anyone can read retros"
on retros for select
using (true);

create policy "Anyone can create retros"
on retros for insert
with check (true);

create policy "Only retro creators can delete retros"
on retros for delete
using (
  -- Supabase-hosted PostgREST exposes REST request headers through request.headers.
  -- If you self-host PostgREST, ensure request headers are available to policies.
  owner_token_hash = current_setting('request.headers', true)::json->>'x-owner-token-hash'
);`;

interface RetroPageProps {
  /**
   * Optional route-provided session id used to prefill and auto-load a retro
   * when visiting /retro/[retroId].
   */
  initialSessionId?: string;
}

export default function RetroPage({ initialSessionId }: RetroPageProps) {
  const initialRouteSessionId = normalizeRouteSessionId(initialSessionId);
  const initialJoinDetails = initialRouteSessionId
    ? parseRetroJoinInput(initialRouteSessionId)
    : null;
  const [mode, setMode] = useState<Mode>('join');
  const [config, setConfig] = useState<SupabaseConfig>({
    url: '',
    anonKey: '',
  });
  const [retroName, setRetroName] = useState('');
  const [columnsInput, setColumnsInput] = useState(defaultColumns);
  const [sessionInput, setSessionInput] = useState(
    initialJoinDetails?.sessionId ?? '',
  );
  const [participantName, setParticipantName] = useState('');
  const [activeRetro, setActiveRetro] = useState<RetroRecord | null>(null);
  const [items, setItems] = useState<RetroItem[]>([]);
  const [newItems, setNewItems] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [ownerTokenHash, setOwnerTokenHash] = useState<string | null>(null);
  const [ownerVerified, setOwnerVerified] = useState(false);
  const [pendingJoinDetails, setPendingJoinDetails] =
    useState<RetroJoinDetails | null>(initialJoinDetails);
  const processedRouteSessionId = useRef(initialRouteSessionId);

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
    const routeSessionId = initialRouteSessionId;
    if (!routeSessionId || routeSessionId === processedRouteSessionId.current) {
      return;
    }

    processedRouteSessionId.current = routeSessionId;
    const nextJoinDetails = parseRetroJoinInput(routeSessionId);
    setMode('join');
    setSessionInput(nextJoinDetails.sessionId);
    setPendingJoinDetails(nextJoinDetails);
  }, [initialRouteSessionId]);

  const ownerToken = useMemo(() => {
    if (!activeRetro) return null;
    return localStorage.getItem(getOwnerTokenKey(activeRetro.session_id));
  }, [activeRetro]);

  const isOwner = Boolean(
    activeRetro && ownerToken && ownerTokenHash && ownerVerified,
  );

  const columns = activeRetro?.columns ?? parseColumns(columnsInput);

  const shareUrl = useMemo(() => {
    if (
      !activeRetro ||
      !config.url.trim() ||
      !config.anonKey.trim() ||
      typeof window === 'undefined'
    ) {
      return '';
    }

    return `${window.location.origin}/retro/${createRetroShareToken(
      activeRetro.session_id,
      config,
    )}`;
  }, [activeRetro, config]);

  const requestSupabase = useCallback(
    async <T,>(
      path: string,
      init: RequestInit = {},
      configOverride = config,
    ): Promise<T> => {
      const baseUrl = normalizeSupabaseUrl(configOverride.url);
      const anonKey = configOverride.anonKey.trim();

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

  const saveConfig = useCallback(
    (configToSave = config) => {
      const nextConfig = normalizeSupabaseConfig(configToSave);
      localStorage.setItem(configStorageKey, JSON.stringify(nextConfig));
      setConfig(nextConfig);
      return nextConfig;
    },
    [config],
  );

  const loadItems = useCallback(
    async (
      sessionId: string,
      showSpinner = true,
      configOverride?: SupabaseConfig,
    ) => {
      if (showSpinner) setRefreshing(true);
      try {
        const data = await requestSupabase<RetroItem[]>(
          `retro_items?session_id=eq.${encodeURIComponent(
            sessionId,
          )}&order=created_at.asc`,
          {},
          configOverride,
        );
        setItems(data);
      } finally {
        if (showSpinner) setRefreshing(false);
      }
    },
    [requestSupabase],
  );

  const loadRetro = useCallback(
    async (sessionId: string, configOverride?: SupabaseConfig) => {
      const data = await requestSupabase<RetroRecord[]>(
        `retros?session_id=eq.${encodeURIComponent(
          sessionId,
        )}&select=${retroSelectFields}`,
        {},
        configOverride,
      );

      if (!data.length) {
        throw new Error('No retro found for that session id.');
      }

      setActiveRetro(data[0]);
      await loadItems(data[0].session_id, true, configOverride);
    },
    [loadItems, requestSupabase],
  );

  useEffect(() => {
    let cancelled = false;
    setOwnerVerified(false);

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

  useEffect(() => {
    let cancelled = false;
    setOwnerVerified(false);

    if (!activeRetro || !ownerTokenHash) {
      return;
    }

    requestSupabase<boolean>('rpc/verify_retro_owner', {
      method: 'POST',
      headers: { 'x-owner-token-hash': ownerTokenHash },
      body: JSON.stringify({ retro_session_id: activeRetro.session_id }),
    })
      .then((verified) => {
        if (!cancelled) setOwnerVerified(verified);
      })
      .catch((error) => {
        console.warn('Failed to verify retro ownership:', error);
        if (!cancelled) setOwnerVerified(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeRetro, ownerTokenHash, requestSupabase]);

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

      const nextConfig = saveConfig();

      const sessionId = generateRandomId(16);
      const nextOwnerToken = generateRandomId(48);
      const nextOwnerTokenHash = await hashToken(nextOwnerToken);
      const data = await requestSupabase<RetroRecord[]>(
        `retros?select=${retroSelectFields}`,
        {
          method: 'POST',
          body: JSON.stringify({
            session_id: sessionId,
            owner_token_hash: nextOwnerTokenHash,
            name: retroName.trim(),
            columns: parsedColumns,
          }),
        },
        nextConfig,
      );

      localStorage.setItem(getOwnerTokenKey(sessionId), nextOwnerToken);
      setActiveRetro(data[0]);
      setItems([]);
      setSessionInput(createRetroShareToken(sessionId, nextConfig));
      toast.success(`Retro created. Share link ready for session ${sessionId}`);
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

      const joinDetails = parseRetroJoinInput(sessionInput);
      if (!joinDetails.sessionId) {
        throw new Error('Enter a session id.');
      }
      const configForJoin = joinDetails.config
        ? saveConfig(joinDetails.config)
        : saveConfig();
      await loadRetro(joinDetails.sessionId, configForJoin);
      setSessionInput(joinDetails.sessionId);
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
      !pendingJoinDetails ||
      activeRetro?.session_id === pendingJoinDetails.sessionId
    ) {
      return;
    }

    const configForJoin = pendingJoinDetails.config
      ? normalizeSupabaseConfig(pendingJoinDetails.config)
      : normalizeSupabaseConfig(config);

    if (!configForJoin.url || !configForJoin.anonKey) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setPendingJoinDetails(null);
    if (pendingJoinDetails.config) {
      localStorage.setItem(configStorageKey, JSON.stringify(configForJoin));
      setConfig(configForJoin);
    }

    loadRetro(pendingJoinDetails.sessionId, configForJoin)
      .then(() => {
        if (!cancelled) {
          toast.success('Joined retro session');
        }
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : 'Failed to join retro',
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    activeRetro?.session_id,
    config.anonKey,
    config.url,
    loadRetro,
    pendingJoinDetails,
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
        `retros?session_id=eq.${sessionFilter}`,
        {
          method: 'DELETE',
          headers: {
            Prefer: 'return=minimal',
            'x-owner-token-hash': ownerTokenHash,
          },
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
                    Paste a shared retro link to join without entering Supabase
                    settings.
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
                    Run this SQL in Supabase to create the tables and RLS policy
                    for creator-only retro deletion.
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
            {shareUrl ? (
              <div className="mt-4 space-y-2">
                <label className="text-sm font-medium" htmlFor="share-link">
                  Share link
                </label>
                <Input
                  id="share-link"
                  readOnly
                  value={shareUrl}
                  onFocus={(event) => event.target.select()}
                />
                <p className="text-xs text-muted-foreground">
                  Teammates can use this link to join without entering Supabase
                  project settings.
                </p>
              </div>
            ) : null}
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
