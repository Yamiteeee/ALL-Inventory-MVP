import { ref, onMounted, onUnmounted } from 'vue'

export function useTypewriter(sourceText, options = {}) {
  const { speed = 35, delay = 150 } = options

  const displayedText = ref('')
  const isComplete = ref(false)
  let charTimer = null
  let delayTimer = null

  onMounted(() => {
    // Resolve string if a ref or function was passed
    const rawText = typeof sourceText === 'function' ? sourceText() : sourceText

    delayTimer = setTimeout(() => {
      let index = 0
      charTimer = setInterval(() => {
        if (index < rawText.length) {
          displayedText.value += rawText.charAt(index)
          index++
        } else {
          isComplete.value = true
          clearInterval(charTimer)
        }
      }, speed)
    }, delay)
  })

  onUnmounted(() => {
    if (delayTimer) clearTimeout(delayTimer)
    if (charTimer) clearInterval(charTimer)
  })

  return {
    displayedText,
    isComplete,
  }
}
