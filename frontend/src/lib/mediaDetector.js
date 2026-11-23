// Spotify & YouTube Link Auto-Detection Helper for NOIZE CMS

/**
 * Parse YouTube Video ID from any YouTube URL format:
 * - https://www.youtube.com/watch?v=dQw4w9WgXcQ
 * - https://youtu.be/dQw4w9WgXcQ
 * - https://www.youtube.com/shorts/dQw4w9WgXcQ
 * - https://www.youtube.com/embed/dQw4w9WgXcQ
 */
export const parseYouTubeId = (url = '') => {
  if (!url) return null
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/
  const match = String(url).trim().match(regExp)
  return (match && match[2].length === 11) ? match[2] : null
}

/**
 * Fetch YouTube Video Details (Title & High-Res Thumbnail)
 */
export const fetchYouTubeDetails = async (url = '') => {
  const videoId = parseYouTubeId(url)
  if (!videoId) return null

  const result = {
    url,
    video_id: videoId,
    thumbnail_url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    embed_url: `https://www.youtube-nocookie.com/embed/${videoId}`,
    title: ''
  }

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`
    const res = await fetch(oembedUrl)
    if (res.ok) {
      const data = await res.json()
      result.title = data.title || ''
      if (data.thumbnail_url) {
        result.thumbnail_url = data.thumbnail_url
      }
    }
  } catch (err) {
    console.warn('YouTube oEmbed lookup warning:', err)
  }

  if (!result.title) {
    result.title = `NOIZE - Official Video (${videoId})`
  }

  return result
}

/**
 * Parse Spotify Track or Album ID & Type from URL:
 * - https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT
 * - https://open.spotify.com/album/4cOdK2wGLETKBW3PvgPWqT
 * - https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqT
 */
export const parseSpotifyInfo = (url = '') => {
  if (!url) return null
  const clean = String(url).trim()
  const match = clean.match(/open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/)
  if (match) {
    return {
      type: match[1],
      id: match[2],
      embed_url: `https://open.spotify.com/embed/${match[1]}/${match[2]}`
    }
  }
  return null
}

/**
 * Fetch Spotify Track / Album Details (Title, Cover Art, Embed URL) via Spotify oEmbed
 */
export const fetchSpotifyDetails = async (url = '') => {
  const info = parseSpotifyInfo(url)
  if (!info) return null

  const result = {
    url,
    spotify_id: info.id,
    type: info.type,
    embed_url: info.embed_url,
    title: '',
    artist: 'NOIZE',
    cover_url: ''
  }

  try {
    const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`
    const res = await fetch(oembedUrl)
    if (res.ok) {
      const data = await res.json()
      result.title = data.title || ''
      result.cover_url = data.thumbnail_url || ''
      if (data.iframe_url) {
        result.embed_url = data.iframe_url
      }
    }
  } catch (err) {
    console.warn('Spotify oEmbed lookup warning:', err)
  }

  if (!result.title) {
    result.title = `NOIZE Track (${info.id})`
  }

  return result
}
