import { mountBlueFlutedGlass, type BlueFlutedGlassOptions } from "./BlueFlutedGlassEngine.js";
import type { MotionController } from "./motion-runtime";

/** Mount into any DOM node. Call update() for options and destroy() on removal. */
export function mount(target: HTMLElement, options: BlueFlutedGlassOptions = {}): MotionController {
  return mountBlueFlutedGlass(target, options);
}
export type { BlueFlutedGlassOptions };
