import { mountThinkingOrb, type ThinkingOrbOptions } from "./ThinkingOrbEngine.js";
import type { MotionController } from "./motion-runtime";

/** Mount into any DOM node. Call update() for options and destroy() on removal. */
export function mount(target: HTMLElement, options: ThinkingOrbOptions = {}): MotionController {
  return mountThinkingOrb(target, options);
}
export type { ThinkingOrbOptions };
