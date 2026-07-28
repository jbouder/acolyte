'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { markRouteRendered } from '@/lib/view-transitions';

/**
 * Renders nothing; signals the active view transition once the new route has
 * committed so the wipe can start. useEffect (not useLayoutEffect) is fine
 * here: paint is held by the transition until the update promise resolves.
 */
export function ViewTransitionController() {
  const pathname = usePathname();

  useEffect(() => {
    markRouteRendered();
  }, [pathname]);

  return null;
}
