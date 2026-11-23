/**
 * Utility functions for handling and detecting Instagram links and handles.
 * Supports:
 * - Full URLs: https://www.instagram.com/username/, http://instagram.com/username?igsh=xxx
 * - Handles with @: @username
 * - Plain handles: username
 */

export const extractInstagramHandle = (input) => {
  if (!input || typeof input !== 'string') return ''
  let trimmed = input.trim()
  if (!trimmed || trimmed === '-') return ''

  // If it's a URL
  try {
    const urlMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)/i)
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1]
    }
  } catch (_) {}

  // Plain handle or with @
  let clean = trimmed.replace(/^@+/, '').replace(/\/+$/, '').trim()
  clean = clean.split('?')[0].split('#')[0].split('/')[0]

  // Valid Instagram username character check
  if (/^[a-zA-Z0-9._]+$/.test(clean)) {
    return clean
  }

  return clean
}

export const formatInstagramUrl = (input) => {
  const handle = extractInstagramHandle(input)
  if (!handle) return '#'
  return `https://www.instagram.com/${handle}/`
}

export const formatInstagramDisplay = (input) => {
  const handle = extractInstagramHandle(input)
  if (!handle) return '-'
  return `@${handle}`
}

export const parseInstagram = (input) => {
  const handle = extractInstagramHandle(input)
  return {
    handle,
    url: handle ? `https://www.instagram.com/${handle}/` : '#',
    display: handle ? `@${handle}` : '-',
    isValid: Boolean(handle)
  }
}
