'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { startWipeNavigation } from '@/lib/view-transitions';

/** Router whose push() plays the film-wipe view transition. */
export function useTransitionRouter() {
  const router = useRouter();

  return useMemo(
    () => ({
      push: (href: string) =>
        startWipeNavigation(href, () => router.push(href)),
    }),
    [router],
  );
}
