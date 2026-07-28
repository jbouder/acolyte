'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import { startWipeNavigation } from '@/lib/view-transitions';

/**
 * Drop-in next/link that routes same-tab left-clicks through the film-wipe
 * view transition. Prefetching is unchanged; modified clicks (cmd/ctrl/
 * shift/middle) keep the browser's default new-tab/window behavior.
 */
export function TransitionLink({
  href,
  onClick,
  ...rest
}: ComponentProps<typeof Link>) {
  const router = useRouter();

  return (
    <Link
      href={href}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
          return;
        const url = typeof href === 'string' ? href : (href.pathname ?? '/');
        e.preventDefault();
        startWipeNavigation(url, () => router.push(url));
      }}
    />
  );
}
