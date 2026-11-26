import type { MotionOptions, MotionController } from "./motion-runtime";
export type ThinkingOrbOptions = MotionOptions & { state?: "idle" | "thinking" | "searching" | "listening" | "done" | "error"; size?: number; level?: number | { value: number }; interactive?: boolean; color?: string; dots?: number; dotSize?: number; haptics?: boolean; showControls?: boolean; locale?: "en" | "zh" };
export function mountThinkingOrb(target: HTMLElement, options?: ThinkingOrbOptions): MotionController;
