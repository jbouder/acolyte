import RetroPage from '../page';

interface RetroSessionPageProps {
  params: Promise<{
    retroId: string;
  }>;
}

export default async function RetroSessionPage({
  params,
}: RetroSessionPageProps) {
  const { retroId } = await params;

  return <RetroPage initialSessionId={retroId} />;
}
