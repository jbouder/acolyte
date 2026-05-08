'use client';

import { useParams } from 'next/navigation';

import RetroPage from '../page';

export default function RetroSessionPage() {
  const params = useParams<{ retroId?: string | string[] }>();
  const retroId = Array.isArray(params.retroId)
    ? params.retroId[0]
    : params.retroId;

  return <RetroPage initialSessionId={retroId} />;
}
