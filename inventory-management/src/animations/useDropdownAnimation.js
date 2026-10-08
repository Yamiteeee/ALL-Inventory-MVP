import { animate } from 'motion'

/**
 * Apple Soft-UI Spring Dropdown & Accordion Animation Composable
 * Handles fluid height, opacity, and scale spring expansion without layout shift.
 */
export function useDropdownAnimation(options = {}) {
  const stiffness = options.stiffness ?? 320
  const damping = options.damping ?? 26
  const mass = options.mass ?? 0.8

  /**
   * Vue Transition Enter Hook
   */
  const onEnter = async (el, done) => {
    el.style.overflow = 'hidden'
    el.style.height = '0px'
    el.style.opacity = '0'
    el.style.transform = 'translateY(-6px) scale(0.99)'

    // Dynamically measure full target scroll height
    const targetHeight = el.scrollHeight

    const anim = animate(
      el,
      {
        height: ['0px', `${targetHeight}px`],
        opacity: [0, 1],
        transform: ['translateY(-6px) scale(0.99)', 'translateY(0px) scale(1)'],
      },
      {
        type: 'spring',
        stiffness,
        damping,
        mass,
      },
    )

    await (anim.finished || anim)
    el.style.height = 'auto'
    el.style.overflow = 'visible'
    done?.()
  }

  /**
   * Vue Transition Leave Hook
   */
  const onLeave = async (el, done) => {
    el.style.overflow = 'hidden'
    const startHeight = el.scrollHeight

    const anim = animate(
      el,
      {
        height: [`${startHeight}px`, '0px'],
        opacity: [1, 0],
        transform: ['translateY(0px) scale(1)', 'translateY(-6px) scale(0.99)'],
      },
      {
        duration: 0.18,
        easing: [0.32, 0.72, 0, 1],
      },
    )

    await (anim.finished || anim)
    done?.()
  }

  return {
    onEnter,
    onLeave,
    dropdownTransition: {
      css: false,
      onEnter,
      onLeave,
    },
  }
}
