import { mountThinkingParticles, type ThinkingParticlesOptions } from "./ThinkingParticlesEngine.js";
import type { MotionController } from "./motion-runtime";

/** Mount into any DOM node. Call update() for options and destroy() on removal. */
export function mount(target: HTMLElement, options: ThinkingParticlesOptions = {}): MotionController {
  return mountThinkingParticles(target, options);
}
export type { ThinkingParticlesOptions };
