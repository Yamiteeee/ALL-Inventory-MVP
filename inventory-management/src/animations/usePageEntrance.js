import { onMounted } from 'vue'
import { animate, stagger } from 'motion'

export function usePageEntrance() {
  onMounted(() => {
    // Helper to safely trigger animations only when elements exist in the DOM
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

    // 3. Sequential Elements (hero text, inputs, grid cards, buttons)
    safeAnimate(
      '.anim-stagger, .hero-stagger, .login-stagger, .feature-card',
      { opacity: [0, 1], y: [22, 0], scale: [0.98, 1] },
      {
        delay: stagger(0.06, { start: 0.12 }),
        type: 'spring',
        stiffness: 260,
        damping: 18,
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
}
