/**
 * Single source of truth for Cheki unit price calculation.
 * Used across Tab Cheki, Cart, Checkout, and Server Order Creation.
 *
 * Rules:
 * - Regular Event:
 *   - Member: uses `config.harga_cheki_per_member` (fallback: 25000)
 *   - Group: uses `config.harga_cheki_grup` (fallback: 30000)
 * - Special Event (is_special === true / type === 'special' / theme_name / theme_color):
 *   - Member: uses event.harga_cheki_po if set (> 0), fallback to regular member price
 *   - Group: uses regular group price
 * - OTS (On The Spot):
 *   - Member: event.harga_cheki_ots if set (> 0) on special event, fallback to config.harga_ots_per_member (fallback to regular member price)
 *   - Group: config.harga_ots_grup (fallback to config.harga_cheki_grup / 30000)
 *
 * @param {Object} event - Event record from database or state
 * @param {'member'|'group'} tipeCheki - 'member' or 'group'
 * @param {'po'|'ots'} channel - 'po' (online/shop) or 'ots' (on the spot)
 * @param {Object} config - Config key-value map from config table
 * @returns {number} unit price in IDR
 */
export function getChekiUnitPrice(event, tipeCheki = 'member', channel = 'po', config = {}) {
  const isGroup = tipeCheki === 'group'
  const isOts = channel === 'ots'
  const isSpecial = Boolean(
    event && (event.is_special || event.type === 'special' || event.theme_name || event.theme_color)
  )

  if (isOts) {
    if (isGroup) {
      const regularOtsGrup = Number(config?.harga_ots_grup)
      if (!isNaN(regularOtsGrup) && regularOtsGrup > 0) return regularOtsGrup
      const regularPoGrup = Number(config?.harga_cheki_grup)
      return (!isNaN(regularPoGrup) && regularPoGrup > 0) ? regularPoGrup : 30000
    }

    // Member OTS
    if (isSpecial && event?.harga_cheki_ots !== null && event?.harga_cheki_ots !== undefined && String(event.harga_cheki_ots).trim() !== '') {
      const override = Number(event.harga_cheki_ots)
      if (!isNaN(override) && override > 0) return override
    }

    const regularOtsMember = Number(config?.harga_ots_per_member)
    if (!isNaN(regularOtsMember) && regularOtsMember > 0) return regularOtsMember
    const regularPoMember = Number(config?.harga_cheki_per_member)
    return (!isNaN(regularPoMember) && regularPoMember > 0) ? regularPoMember : 25000
  }

  // Channel: PO (Online / Shop)
  if (isGroup) {
    const regularPoGrup = Number(config?.harga_cheki_grup)
    return (!isNaN(regularPoGrup) && regularPoGrup > 0) ? regularPoGrup : 30000
  }

  // Member PO
  if (isSpecial && event?.harga_cheki_po !== null && event?.harga_cheki_po !== undefined && String(event.harga_cheki_po).trim() !== '') {
    const override = Number(event.harga_cheki_po)
    if (!isNaN(override) && override > 0) return override
  }

  const regularPoMember = Number(config?.harga_cheki_per_member)
  return (!isNaN(regularPoMember) && regularPoMember > 0) ? regularPoMember : 25000
}

/**
 * Helper to get OTS price if configured in CMS.
 * Returns null if OTS price is not configured in CMS (empty/not set).
 *
 * @param {Object} event
 * @param {'member'|'group'} tipeCheki
 * @param {Object} config
 * @returns {number|null} OTS price or null if not set in CMS
 */
export function getChekiOtsPrice(event, tipeCheki = 'member', config = {}) {
  const isGroup = tipeCheki === 'group'
  const isSpecial = Boolean(
    event && (event.is_special || event.type === 'special' || event.theme_name || event.theme_color)
  )

  if (isGroup) {
    const regularOtsGrup = Number(config?.harga_ots_grup)
    if (!isNaN(regularOtsGrup) && regularOtsGrup > 0) return regularOtsGrup
    return null
  }

  // Member OTS: override on special event
  if (isSpecial && event?.harga_cheki_ots !== null && event?.harga_cheki_ots !== undefined && String(event.harga_cheki_ots).trim() !== '') {
    const override = Number(event.harga_cheki_ots)
    if (!isNaN(override) && override > 0) return override
  }

  // Fallback to regular OTS member price from CMS config
  const regularOtsMember = Number(config?.harga_ots_per_member)
  if (!isNaN(regularOtsMember) && regularOtsMember > 0) return regularOtsMember

  return null
}
