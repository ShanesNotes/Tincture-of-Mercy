import { expect, test } from '@playwright/test';

interface GamepadRunSummary {
  readonly simEdges: readonly string[];
  readonly allEdges: readonly string[];
  readonly inputCount: number;
  readonly ticks: number;
  readonly digestChanged: boolean;
  readonly connectedWhilePluggedIn: boolean;
  readonly connectedAfterUnplug: boolean;
  readonly cameraStickX: number;
  readonly moveStickX: number;
}

/** The slices of the real modules this test drives, typed for the page context. */
interface PageStick {
  readonly x: number;
  readonly y: number;
}

interface PageActionEdge {
  readonly action: string;
  readonly pressed: boolean;
}

interface PageGamepadSource {
  poll(): void;
  drainActionEdges(): readonly PageActionEdge[];
  readonly connected: boolean;
  readonly moveStick: PageStick;
  readonly cameraStick: PageStick;
}

interface PageSampledEdge {
  readonly action: string;
  readonly pressed: boolean;
}

interface PageTickQueue {
  drain(tick: number): readonly PageSampledEdge[];
}

interface PageSampler {
  sample(tick: number, edges: readonly PageSampledEdge[], queue: PageTickQueue): void;
}

interface PageSimState {
  readonly tick: number;
  readonly inputCount: number;
  readonly deterministicDigest: number;
}

interface PageGamepadModule {
  GamepadInputSource: new () => PageGamepadSource;
}

interface PageInputModule {
  TickInputQueue: new () => PageTickQueue;
  FrameInputSampler: new () => PageSampler;
}

interface PageStateModule {
  createSimState: (seed: number) => PageSimState;
}

interface PageTickModule {
  stepTick: (state: PageSimState, edges: readonly PageSampledEdge[]) => PageSimState;
}

/**
 * Page-level proof that the browser Gamepad API path reaches the sim tick
 * stream: a synthetic pad is installed on `navigator.getGamepads`, the real
 * modules are pulled from the dev server, and the latched edges are sampled
 * into the real tick queue and stepped by the real sim.
 */
test('scripted gamepad state reaches the sim tick stream', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      browserErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => {
    browserErrors.push(error.message);
  });

  await page.goto('/?renderer=webgl2');
  await expect(page.locator('body')).toHaveAttribute('data-boot-status', 'ready');

  const summary = await page.evaluate(async (): Promise<GamepadRunSummary> => {
    const load = async <T>(specifier: string): Promise<T> =>
      (await import(/* @vite-ignore */ specifier)) as T;

    const [gamepadModule, inputModule, stateModule, tickModule] = await Promise.all([
      load<PageGamepadModule>('/src/app/gamepad.ts'),
      load<PageInputModule>('/src/sim/input.ts'),
      load<PageStateModule>('/src/sim/state.ts'),
      load<PageTickModule>('/src/sim/tick.ts'),
    ]);

    const pad = {
      index: 0,
      connected: true,
      axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 16 }, () => ({ pressed: false, value: 0, touched: false })),
    };
    const setButton = (index: number, pressed: boolean): void => {
      const button = pad.buttons[index];
      if (button !== undefined) {
        button.pressed = pressed;
        button.value = pressed ? 1 : 0;
      }
    };
    const setAxis = (index: number, value: number): void => {
      pad.axes[index] = value;
    };

    let plugged = true;
    Object.defineProperty(navigator, 'getGamepads', {
      configurable: true,
      value: () => (plugged ? [pad] : [null]),
    });

    const source = new gamepadModule.GamepadInputSource();
    const queue = new inputModule.TickInputQueue();
    const sampler = new inputModule.FrameInputSampler();
    let state = stateModule.createSimState(0x544f_4d31);
    const startingDigest = state.deterministicDigest;

    const simEdges: string[] = [];
    const allEdges: string[] = [];
    const simActions = new Set(['attack', 'roll', 'flask']);

    const frame = (): void => {
      source.poll();
      for (const edge of source.drainActionEdges()) {
        const label = `${edge.action}:${edge.pressed ? 'down' : 'up'}`;
        allEdges.push(label);
        if (simActions.has(edge.action)) {
          simEdges.push(label);
          sampler.sample(state.tick, [{ action: edge.action, pressed: edge.pressed }], queue);
        }
      }
      state = tickModule.stepTick(state, queue.drain(state.tick));
    };

    frame();
    setButton(5, true); // right bumper -> attack
    frame();
    for (let held = 0; held < 10; held += 1) {
      frame(); // a held button must never repeat
    }
    setButton(5, false);
    frame();

    setButton(0, true); // south face -> roll
    setButton(2, true); // west face -> flask
    frame();
    setButton(0, false);
    setButton(2, false);
    frame();

    setAxis(0, -1); // move stick pushed left
    setAxis(2, 1); // camera stick flicked right -> Attend switch, not a sim action
    frame();
    const moveStickX = source.moveStick.x;
    const cameraStickX = source.cameraStick.x;
    const connectedWhilePluggedIn = source.connected;

    plugged = false;
    frame();
    const connectedAfterUnplug = source.connected;

    return {
      simEdges,
      allEdges,
      inputCount: state.inputCount,
      ticks: state.tick,
      digestChanged: state.deterministicDigest !== startingDigest,
      connectedWhilePluggedIn,
      connectedAfterUnplug,
      cameraStickX,
      moveStickX,
    };
  });

  expect(summary.simEdges).toEqual([
    'attack:down',
    'attack:up',
    'roll:down',
    'flask:down',
    'roll:up',
    'flask:up',
  ]);
  expect(summary.inputCount).toBe(summary.simEdges.length);
  expect(summary.ticks).toBeGreaterThan(summary.simEdges.length);
  expect(summary.digestChanged).toBe(true);

  // The Attend switch flick latches off the camera stick without entering the
  // sim action queue, and the move stick is read from its own axes (F1).
  expect(summary.allEdges).toContain('switchTarget:down');
  expect(summary.moveStickX).toBeLessThan(0);
  expect(summary.cameraStickX).toBeGreaterThan(0);

  // Unplugging releases what was held instead of stranding a pressed control.
  expect(summary.connectedWhilePluggedIn).toBe(true);
  expect(summary.connectedAfterUnplug).toBe(false);
  expect(summary.allEdges).toContain('switchTarget:up');

  expect(browserErrors).toEqual([]);
});
