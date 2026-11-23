import { useState, useEffect } from 'react'
import api from '../lib/api'

export const DEFAULT_NOIZE_IG = 'https://www.instagram.com/info_noize/'

/**
 * Resolves a social link. If empty, missing, or '#',
 * falls back to the official Instagram: https://www.instagram.com/info_noize/
 */
export const resolveSocialLink = (url) => {
  if (!url || typeof url !== 'string' || !url.trim() || url.trim() === '#') {
    return DEFAULT_NOIZE_IG
  }
  const clean = url.trim()
  if (!/^https?:\/\//i.test(clean)) {
    return `https://${clean}`
  }
  return clean
}

let cachedSocialLinks = null
const listeners = new Set()

export const updateCachedSocialLinks = (newLinks) => {
  cachedSocialLinks = newLinks
  listeners.forEach(fn => fn(newLinks))
}

export const useSocialLinks = () => {
  const [links, setLinks] = useState(cachedSocialLinks || {
    instagram: '',
    tiktok: '',
    youtube: '',
    twitter: '',
    discord: '',
    whatsapp_channel: ''
  })

  useEffect(() => {
    const handleChange = (updated) => {
      if (updated) setLinks(updated)
    }
    listeners.add(handleChange)

    if (!cachedSocialLinks) {
      api.get(`/config?t=${Date.now()}`)
        .then(res => {
          if (res.data.success && res.data.data) {
            try {
              let parsed = {}
              if (res.data.data.social_links) {
                parsed = typeof res.data.data.social_links === 'string'
                  ? JSON.parse(res.data.data.social_links)
                  : res.data.data.social_links
              }
              if (res.data.data.whatsapp_channel && !parsed.whatsapp_channel) {
                parsed.whatsapp_channel = res.data.data.whatsapp_channel
              }
              if (parsed && typeof parsed === 'object') {
                cachedSocialLinks = parsed
                setLinks(parsed)
                listeners.forEach(fn => fn(parsed))
                return
              }
            } catch (_) {}
          }
          cachedSocialLinks = {}
        })
        .catch(() => {
          cachedSocialLinks = {}
        })
    }

    return () => {
      listeners.delete(handleChange)
    }
  }, [])

  const getLink = (platform) => {
    const val = links?.[platform]
    return resolveSocialLink(val)
  }

  return {
    links,
    getLink,
    resolveLink: resolveSocialLink
  }
}
