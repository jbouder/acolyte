'use client';

import { useParams } from 'next/navigation';

import RetroPage from '../page';

export default function RetroSessionPage() {
  const params = useParams<{ retroId?: string }>();
  const retroId = params.retroId;

  return <RetroPage initialSessionId={retroId} />;
}
