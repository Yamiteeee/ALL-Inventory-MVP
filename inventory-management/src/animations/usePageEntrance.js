import { onMounted } from 'vue'
import { animate, stagger } from 'motion'

/**
 * Reusable Spring Cascade for Dynamic Table Rows & Lists
 */
export function animateTableTransition(selector = '.anim-row') {
  if (typeof document === 'undefined') return

  const elements = document.querySelectorAll(selector)
  if (!elements || elements.length === 0) return

  return animate(
    elements,
    { opacity: [0, 1], y: [14, 0], scale: [0.99, 1] },
    {
      delay: stagger(0.025, { start: 0.02 }),
      type: 'spring',
      stiffness: 280,
      damping: 22,
      mass: 0.85,
    },
  )
}

/**
 * Universal Page Entrance Hook
 */
export function usePageEntrance() {
  onMounted(() => {
    const safeAnimate = (selector, keyframes, options) => {
      if (document.querySelector(selector)) {
        animate(selector, keyframes, options)
      }
    }

    // 1. Top Bars & Navbars (soft drop from above)
    safeAnimate(
      '.anim-top, .top-nav',
      { opacity: [0, 1], y: [-16, 0] },
      {
        type: 'spring',
        stiffness: 240,
        damping: 22,
        delay: 0.05,
      },
    )

    // 2. Main Windows / Cards (spring scale pop)
    safeAnimate(
      '.anim-card, .login-card',
      { opacity: [0, 1], y: [22, 0], scale: [0.97, 1] },
      {
        type: 'spring',
        stiffness: 260,
        damping: 20,
        mass: 0.9,
      },
    )

    // 3. Sequential Elements (hero text, inputs, grid cards, buttons, table rows)
    safeAnimate(
      '.anim-stagger, .hero-stagger, .login-stagger, .feature-card, .anim-row',
      { opacity: [0, 1], y: [16, 0], scale: [0.99, 1] },
      {
        delay: stagger(0.03, { start: 0.12 }),
        type: 'spring',
        stiffness: 260,
        damping: 20,
        mass: 0.85,
      },
    )

    // 4. Footers & Bottom Bars (subtle settle from bottom)
    safeAnimate(
      '.anim-footer, .landing-footer, .login-footer',
      { opacity: [0, 1], y: [14, 0] },
      {
        type: 'spring',
        stiffness: 200,
        damping: 24,
        delay: 0.45,
      },
    )
  })

  return {
    animateTableTransition,
  }
}
