import type { MotionOptions, MotionController } from "./motion-runtime";
export type CardSwapOptions = MotionOptions & { auto?: boolean; every?: number; cards?: { title: string; src: string }[] };
export function mountCardSwap(target: HTMLElement, options?: CardSwapOptions): Omit<MotionController, "update"> & { update(options: CardSwapOptions): void };
