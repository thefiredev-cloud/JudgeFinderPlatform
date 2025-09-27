// Animation configuration and helpers for consistent motion across the app
// Accessibility: respects prefers-reduced-motion

export type SpringPreset = {
  type: 'spring'
  stiffness: number
  damping: number
  mass?: number
  bounce?: number
  overshootClamping?: boolean
}

export type TransitionPreset = SpringPreset & {
  duration?: number
  delay?: number
}

export const motionPresets = {
  smooth: { type: 'spring', stiffness: 200, damping: 24 } as SpringPreset,
  bouncy: { type: 'spring', stiffness: 420, damping: 18 } as SpringPreset,
  gentle: { type: 'spring', stiffness: 120, damping: 26 } as SpringPreset,
  stiff: { type: 'spring', stiffness: 600, damping: 32 } as SpringPreset,
}

export const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function withReducedMotion<T extends Record<string, any>>(transition: T): T {
  if (typeof window === 'undefined') return transition
  return prefersReducedMotion()
    ? ({ duration: 0, delay: 0 } as unknown as T)
    : transition
}

export const defaultPageTransition: TransitionPreset = {
  type: 'spring',
  stiffness: 220,
  damping: 28,
}

export const defaultStagger = {
  container: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: withReducedMotion({
        staggerChildren: 0.06,
      }) as any,
    },
  },
  item: {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: motionPresets.smooth,
    },
  },
}


