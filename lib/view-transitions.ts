/**
 * Star Wars film-wipe page transitions, built on the View Transitions API.
 *
 * `startWipeNavigation` wraps a router navigation in
 * `document.startViewTransition` and stamps a `data-wipe` attribute on
 * `<html>` so the CSS in `app/globals.css` can pick the wipe variant.
 * Browsers without the API (and jsdom in tests) fall through to a plain
 * navigation. Browser back/forward gets no wipe: Next.js owns popstate
 * handling, and intercepting it would require patching the router.
 */

const WIPES = ['wipe-right', 'wipe-left', 'diagonal', 'iris', 'clock'] as const;

export type WipeVariant = (typeof WIPES)[number];

let wipeIndex = 0;
let pendingRender: (() => void) | null = null;

/** Round-robin so consecutive navigations never repeat a variant. */
export function pickWipeVariant(): WipeVariant {
  const variant = WIPES[wipeIndex];
  wipeIndex = (wipeIndex + 1) % WIPES.length;
  return variant;
}

/** Called by ViewTransitionController when the new route has committed. */
export function markRouteRendered(): void {
  pendingRender?.();
  pendingRender = null;
}

export function startWipeNavigation(href: string, navigate: () => void): void {
  if (typeof document === 'undefined') {
    navigate();
    return;
  }

  const target = new URL(href, window.location.href);
  const samePage = target.pathname === window.location.pathname;
  const reducedMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  if (
    samePage ||
    reducedMotion ||
    typeof document.startViewTransition !== 'function'
  ) {
    navigate();
    return;
  }

  const root = document.documentElement;
  // The old-page snapshot is captured synchronously inside
  // startViewTransition, so the variant attribute must already be set.
  root.dataset.wipe = pickWipeVariant();

  const transition = document.startViewTransition(
    () =>
      new Promise<void>((resolve) => {
        // Safety valve: never hold the old frame longer than this if a route
        // suspends; the wipe then reveals the live (still-loading) DOM.
        const timeout = setTimeout(resolve, 1500);
        pendingRender = () => {
          clearTimeout(timeout);
          resolve();
        };
        navigate();
      }),
  );
  // `ready` rejects when the browser skips the animation (e.g. the DOM
  // changed mid-capture); the navigation itself is unaffected.
  transition.ready?.catch?.(() => {});
  transition.finished
    // An aborted transition (tab hidden, rapid re-navigation, heavy DOM
    // churn) rejects `finished`; the page is already correct, so swallow it
    // rather than surfacing an unhandled rejection.
    .catch(() => {})
    .finally(() => {
      delete root.dataset.wipe;
    });
}
