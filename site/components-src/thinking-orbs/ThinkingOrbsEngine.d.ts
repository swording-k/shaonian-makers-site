import type { MotionOptions, MotionController } from "./motion-runtime";
export type ThinkingOrbsOptions = MotionOptions & { locale?: "en" | "zh"; showControls?: boolean; state?: "working" | "searching" | "solving" | "listening" | "connecting" | "weaving" | "composing" | "breathing" | "shaping"; size?: 20 | 32 | 64; speed?: number };
export function mountThinkingOrbs(target: HTMLElement, options?: ThinkingOrbsOptions): Omit<MotionController, "update"> & { update(options: ThinkingOrbsOptions): void };
