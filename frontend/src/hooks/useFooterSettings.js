import { useState, useEffect } from 'react'
import api from '../lib/api'

export const DEFAULT_FOOTER_SETTINGS = {
  description: 'Situs resmi NOIZE. Musik, merchandise resmi, dan sesi Cheki.',
  small_text: 'ノイズ • NOIZE',
  location: 'Jakarta Selatan, Indonesia',
  email: 'contact@noize.official',
  copyright: '© 2026 NOIZE. ALL RIGHTS RESERVED.'
}

let cachedFooterSettings = null
const listeners = new Set()

export const updateCachedFooterSettings = (newSettings) => {
  cachedFooterSettings = { ...DEFAULT_FOOTER_SETTINGS, ...newSettings }
  listeners.forEach(fn => fn(cachedFooterSettings))
}

export const useFooterSettings = () => {
  const [footerSettings, setFooterSettings] = useState(cachedFooterSettings || DEFAULT_FOOTER_SETTINGS)

  useEffect(() => {
    const handleChange = (updated) => {
      if (updated) setFooterSettings(updated)
    }
    listeners.add(handleChange)

    if (!cachedFooterSettings) {
      api.get('/config')
        .then(res => {
          if (res.data.success && res.data.data?.footer_settings) {
            try {
              const parsed = typeof res.data.data.footer_settings === 'string'
                ? JSON.parse(res.data.data.footer_settings)
                : res.data.data.footer_settings
              if (parsed && typeof parsed === 'object') {
                updateCachedFooterSettings(parsed)
                return
              }
            } catch (_) {}
          }
          updateCachedFooterSettings(DEFAULT_FOOTER_SETTINGS)
        })
        .catch(() => {
          setFooterSettings(DEFAULT_FOOTER_SETTINGS)
        })
    }

    return () => {
      listeners.delete(handleChange)
    }
  }, [])

  return { footerSettings }
}
