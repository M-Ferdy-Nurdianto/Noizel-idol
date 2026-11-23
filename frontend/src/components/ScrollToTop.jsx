import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * ScrollToTop component
 * Automatically resets viewport scroll position to top-left (0, 0)
 * whenever user navigates between routes. Supports anchor hash tags (#) if present.
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    // If navigation has an anchor hash (e.g. #faq or #schedule), scroll to that section smoothly
    if (hash) {
      const id = hash.replace('#', '')
      const element = document.getElementById(id) || document.querySelector(hash)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }

    // Immediate instant reset to top of page
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    })

    // Fallback for containers or document root
    if (document.documentElement) {
      document.documentElement.scrollTop = 0
    }
    if (document.body) {
      document.body.scrollTop = 0
    }
  }, [pathname, hash])

  return null
}

export default ScrollToTop
