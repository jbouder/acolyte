import {
  markRouteRendered,
  pickWipeVariant,
  startWipeNavigation,
} from '@/lib/view-transitions';

const ALL_WIPES = ['wipe-right', 'wipe-left', 'diagonal', 'iris', 'clock'];

type StartViewTransition = (update: () => Promise<void>) => {
  finished: Promise<void>;
};

// jsdom has no startViewTransition; tests install and remove their own.
const doc = document as Document & {
  startViewTransition?: StartViewTransition;
};

function drainWipeCycle() {
  // Realign the module-level round-robin counter to the start of the list.
  while (pickWipeVariant() !== 'clock') {
    // pickWipeVariant advances the counter as a side effect.
  }
}

afterEach(() => {
  delete doc.startViewTransition;
  delete document.documentElement.dataset.wipe;
  markRouteRendered();
  drainWipeCycle();
});

describe('pickWipeVariant', () => {
  it('cycles through all variants round-robin, then repeats', () => {
    const first = ALL_WIPES.map(() => pickWipeVariant());
    const second = ALL_WIPES.map(() => pickWipeVariant());

    expect(first).toEqual(ALL_WIPES);
    expect(second).toEqual(ALL_WIPES);
  });
});

describe('startWipeNavigation', () => {
  it('falls back to plain navigation when startViewTransition is missing', () => {
    const navigate = jest.fn();

    startWipeNavigation('/regex', navigate);

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(document.documentElement.dataset.wipe).toBeUndefined();
  });

  it('skips the transition for same-page navigation', () => {
    const startViewTransition = jest.fn();
    doc.startViewTransition = startViewTransition;
    const navigate = jest.fn();

    // jsdom default location is http://localhost/
    startWipeNavigation('/', navigate);

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(startViewTransition).not.toHaveBeenCalled();
  });

  it('skips the transition when the user prefers reduced motion', () => {
    const startViewTransition = jest.fn();
    doc.startViewTransition = startViewTransition;
    // jsdom has no matchMedia; install one reporting reduced motion.
    window.matchMedia = jest
      .fn()
      .mockReturnValue({ matches: true } as MediaQueryList);
    const navigate = jest.fn();

    startWipeNavigation('/regex', navigate);

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(startViewTransition).not.toHaveBeenCalled();
    // @ts-expect-error -- restore jsdom's matchMedia-less window
    delete window.matchMedia;
  });

  it('stamps data-wipe before the snapshot and clears it when finished', async () => {
    let wipeAtSnapshot: string | undefined;
    let update!: () => Promise<void>;
    let settleFinished!: () => void;
    const finished = new Promise<void>((resolve) => {
      settleFinished = resolve;
    });
    doc.startViewTransition = jest.fn((updateCallback) => {
      wipeAtSnapshot = document.documentElement.dataset.wipe;
      update = updateCallback;
      return { finished };
    });
    const navigate = jest.fn();

    startWipeNavigation('/regex', navigate);

    expect(wipeAtSnapshot).toBe('wipe-right');
    expect(navigate).not.toHaveBeenCalled();

    // The update promise resolves once the new route commits.
    const updateDone = update();
    expect(navigate).toHaveBeenCalledTimes(1);
    markRouteRendered();
    await updateDone;

    settleFinished();
    await finished;
    // finally() runs a microtask after the promise settles.
    await Promise.resolve();
    expect(document.documentElement.dataset.wipe).toBeUndefined();
  });

  it('cleans up data-wipe without an unhandled rejection when aborted', async () => {
    const finished = Promise.reject(
      new DOMException('Transition was aborted', 'InvalidStateError'),
    );
    doc.startViewTransition = jest.fn(() => ({ finished }));

    startWipeNavigation('/regex', jest.fn());
    expect(document.documentElement.dataset.wipe).toBe('wipe-right');

    await finished.catch(() => {});
    // catch() + finally() each take a microtask.
    await Promise.resolve();
    await Promise.resolve();
    expect(document.documentElement.dataset.wipe).toBeUndefined();
  });
});
