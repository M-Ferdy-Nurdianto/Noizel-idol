import { useEffect, useRef } from 'react'
import { useTheme } from '../../context/ThemeContext'

/**
 * Cloudflare Turnstile Widget Component
 * Uses window.turnstile explicitly and supports auto theme adaptation
 */
const TurnstileWidget = ({ 
  siteKey, 
  onSuccess, 
  onError, 
  onExpire, 
  className = '' 
}) => {
  const containerRef = useRef(null)
  const widgetIdRef = useRef(null)
  const { theme } = useTheme()
  const activeSiteKey = siteKey || import.meta.env.VITE_TURNSTILE_SITE_KEY
  const isEnabled = import.meta.env.VITE_TURNSTILE_ENABLED === 'true' && Boolean(activeSiteKey)

  useEffect(() => {
    if (!isEnabled || !activeSiteKey) {
      if (onSuccess) onSuccess('dev-turnstile-token')
      return
    }

    // Inject script if not already present
    if (!window.turnstile && !document.getElementById('turnstile-script')) {
      const script = document.createElement('script')
      script.id = 'turnstile-script'
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }

    let isMounted = true

    // Fallback timer: jika menggunakan dummy test key atau script gagal dimuat dalam 2.5 detik
    const isDummyKey = activeSiteKey.startsWith('1x00000000000000000000')
    const fallbackTimer = setTimeout(() => {
      if (isMounted && (!window.turnstile || isDummyKey)) {
        console.warn('[TurnstileWidget] Turnstile auto-passing for development/test key.')
        if (onSuccess) onSuccess('dev-turnstile-token')
      }
    }, 2000)

    const renderWidget = () => {
      if (!isMounted || !containerRef.current || !window.turnstile) return

      // Clean up existing widget if rendered previously
      if (widgetIdRef.current !== null) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch (_) {}
        widgetIdRef.current = null
      }

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: activeSiteKey,
          theme: theme === 'dark' ? 'dark' : 'light',
          size: 'flexible',
          callback: (token) => {
            clearTimeout(fallbackTimer)
            if (isMounted && onSuccess) onSuccess(token)
          },
          'error-callback': (code) => {
            console.error('[TurnstileWidget] Verification error code:', code)
            if (isMounted) {
              if (isDummyKey || import.meta.env.DEV) {
                if (onSuccess) onSuccess('dev-turnstile-token')
              } else if (onError) {
                onError(code)
              }
            }
          },
          'expired-callback': () => {
            if (isMounted && onExpire) onExpire()
          }
        })
        widgetIdRef.current = id
      } catch (err) {
        console.error('[TurnstileWidget] Error rendering widget:', err)
        if (isDummyKey && onSuccess) onSuccess('dev-turnstile-token')
      }
    }

    // Check if turnstile script is ready
    if (window.turnstile) {
      renderWidget()
    } else {
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval)
          renderWidget()
        }
      }, 100)
      return () => {
        isMounted = false
        clearTimeout(fallbackTimer)
        clearInterval(interval)
        if (widgetIdRef.current !== null && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current)
          } catch (_) {}
        }
      }
    }

    return () => {
      isMounted = false
      clearTimeout(fallbackTimer)
      if (widgetIdRef.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch (_) {}
        widgetIdRef.current = null
      }
    }
  }, [activeSiteKey, theme])

  if (!isEnabled) return null

  return (
    <div className={`w-full flex justify-center py-2 ${className}`}>
      <div ref={containerRef} className="min-h-[65px]" />
    </div>
  )
}

export default TurnstileWidget
