import { mountThinkingOrbs, type ThinkingOrbsOptions } from "./ThinkingOrbsEngine.js";
import type { MotionController } from "./motion-runtime";

/** Mount into any DOM node. Call update() for options and destroy() on removal. */
export function mount(target: HTMLElement, options: ThinkingOrbsOptions = {}): ReturnType<typeof mountThinkingOrbs> {
  return mountThinkingOrbs(target, options);
}
export type { ThinkingOrbsOptions };
