import { useState, useEffect } from 'react'
import { nzToast } from '../components/ui/NzToast'
import { getChekiUnitPrice } from '../lib/chekiPricing'

export const getSizePriceIncrement = (size, item = null) => {
  if (!size) return 0;
  const s = size.toUpperCase().trim();

  // If item provides custom jumbo pricing configuration
  if (item && item.jumbo_start_size !== undefined && item.jumbo_start_size !== null) {
    const start = String(item.jumbo_start_size).toUpperCase().trim();
    if (start === 'NONE' || start === '') return 0;

    const inc = parseInt(item.jumbo_increment_price, 10) || 0;
    if (inc <= 0) return 0;

    const sizeLadder = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
    const normalize = (val) => {
      if (val === 'XXL') return '2XL';
      if (val === 'XXXL') return '3XL';
      if (val === 'XXXXL') return '4XL';
      if (val === 'XXXXXL') return '5XL';
      return val;
    };

    const normS = normalize(s);
    const normStart = normalize(start);
    const startIdx = sizeLadder.indexOf(normStart);
    const curIdx = sizeLadder.indexOf(normS);

    if (startIdx !== -1 && curIdx !== -1 && curIdx >= startIdx) {
      return (curIdx - startIdx + 1) * inc;
    }
    return 0;
  }

  // Fallback default if item doesn't have custom config
  if (s === 'XXL' || s === '2XL') return 5000;
  if (s === '3XL' || s === 'XXXL') return 10000;
  if (s === '4XL' || s === 'XXXXL') return 15000;
  return 0;
}

export const useShopCart = (config = {}, events = []) => {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('nz_cart')
      return saved ? JSON.parse(saved) : []
    } catch (e) { return [] }
  })
  
  const [merchCart, setMerchCart] = useState(() => {
    try {
      const saved = localStorage.getItem('nz_merch_cart')
      return saved ? JSON.parse(saved) : []
    } catch (e) { return [] }
  })

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('nz_cart', JSON.stringify(cart))
  }, [cart])

  // Recalculate cheki cart prices from events and config whenever they change / load
  useEffect(() => {
    if (!events || events.length === 0) return
    setCart(prev => {
      let changed = false
      const updated = prev.map(item => {
        // Find corresponding event
        let ev = events.find(e => e.id === item.event_id)
        if (!ev && events.length > 0) {
          // Fallback for legacy items without event_id
          ev = events[0]
        }
        if (!ev) return item

        const tipeCheki = item.type || (item.member_id === 'group' || item.id === 'group' ? 'group' : 'member')
        const channel = item.channel || 'po'
        const expectedPrice = getChekiUnitPrice(ev, tipeCheki, channel, config)
        const expectedKey = `${ev.id}_${item.member_id || (tipeCheki === 'group' ? 'group' : 'unknown')}_${channel}`

        const evDay = String(ev.tanggal || '01').padStart(2, '0')
        const evMonth = String(ev.bulan || '').slice(0, 3).toUpperCase() || 'DES'
        const evDateShort = `${evDay} ${evMonth}`
        const memberName = item.member_name || (tipeCheki === 'group' ? 'Group Cheki' : (item.baseName?.replace('Cheki ', '') || item.name?.split('·')[0]?.trim() || 'Cheki'))
        const displayName = `${memberName} · ${ev.nama} · ${evDateShort}`

        if (item.price !== expectedPrice || item.id !== expectedKey || !item.event_id || item.name !== displayName) {
          changed = true
          return {
            ...item,
            id: expectedKey,
            cartId: expectedKey,
            event_id: ev.id,
            event_name: ev.nama,
            event_date_short: evDateShort,
            member_name: memberName,
            displayName,
            name: displayName,
            is_special: Boolean(ev.is_special || ev.type === 'special' || ev.theme_name || ev.theme_color),
            theme_color: ev.theme_color || null,
            theme_name: ev.theme_name || null,
            price: expectedPrice
          }
        }
        return item
      })

      // Bersihkan item member di keranjang jika member tersebut tidak hadir di lineup event terpilih
      const validated = updated.filter(item => {
        if (item.type === 'group' || item.member_id === 'group') return true
        let ev = events.find(e => e.id === item.event_id) || events[0]
        if (!ev) return true
        const rawLineup = ev.event_lineup || ev.lineup || ev.lineup_member_ids
        if (Array.isArray(rawLineup) && rawLineup.length > 0) {
          const allowed = new Set(
            rawLineup.map(item => {
              if (!item) return null
              if (typeof item === 'string') return item.toLowerCase()
              return (item.member_id || item.id || item.members?.id || item.members?.member_id || '').toLowerCase()
            }).filter(Boolean)
          )
          const isAllowed = allowed.has(String(item.member_id).toLowerCase())
          if (!isAllowed) {
            changed = true
            return false
          }
        }
        return true
      })

      return changed ? validated : prev
    })
  }, [config, events])

  useEffect(() => {
    localStorage.setItem('nz_merch_cart', JSON.stringify(merchCart))
  }, [merchCart])

  // --- Cheki Cart Logic ---
  const addToCart = (type, member = null, event = null, getMemberImage = null) => {
    if (!event) {
      nzToast.info('Pilih jadwal event dulu')
      return
    }

    const isGroup = type === 'group'
    const memberId = isGroup ? 'group' : (member?.id || 'unknown')

    // Validasi lineup event: cegah menambahkan member yang tidak hadir pada event ini
    if (!isGroup && event) {
      const rawLineup = event.event_lineup || event.lineup || event.lineup_member_ids
      if (Array.isArray(rawLineup) && rawLineup.length > 0) {
        const allowed = new Set(
          rawLineup.map(item => {
            if (!item) return null
            if (typeof item === 'string') return item.toLowerCase()
            return (item.member_id || item.id || item.members?.id || item.members?.member_id || '').toLowerCase()
          }).filter(Boolean)
        )
        const isAllowed = (member?.id && allowed.has(String(member.id).toLowerCase())) || 
                          (member?.member_id && allowed.has(String(member.member_id).toLowerCase()))
        if (!isAllowed) {
          nzToast.info(`${member?.nama_panggung || 'Member'} tidak hadir pada event ini`)
          return
        }
      } else if (Array.isArray(rawLineup) && rawLineup.length === 0) {
        nzToast.info(`Tidak ada lineup idol pada event ini`)
        return
      }
    }
    const imageUrl = isGroup
      ? (member?.image_url || '/images/members/group.webp')
      : (getMemberImage ? getMemberImage(member) : member?.image_url)

    const baseName = isGroup 
      ? 'Cheki Group' 
      : (member?.is_secret ? 'Cheki Mystery (Secret Member)' : `Cheki ${member?.nama_panggung || ''}`)

    const eventName = event.nama || 'Event'
    const evDay = String(event.tanggal || '01').padStart(2, '0')
    const evMonth = String(event.bulan || '').slice(0, 3).toUpperCase() || 'DES'
    const eventDateShort = `${evDay} ${evMonth}`
    const memberName = isGroup ? 'Group Cheki' : (member?.is_secret ? 'Mystery' : (member?.nama_panggung || 'Member'))
    const displayName = `${memberName} · ${eventName} · ${eventDateShort}`

    const unitPrice = getChekiUnitPrice(event, type, 'po', config)
    const cartItemId = `${event.id}_${memberId}_po`

    const item = {
      id: cartItemId,
      cartId: cartItemId,
      event_id: event.id,
      event_name: eventName,
      event_date_short: eventDateShort,
      is_special: Boolean(event.is_special || event.type === 'special' || event.theme_name || event.theme_color),
      theme_color: event.theme_color || null,
      theme_name: event.theme_name || null,
      type: isGroup ? 'group' : 'member',
      member_id: memberId,
      member_name: memberName,
      displayName,
      name: displayName,
      baseName,
      is_secret: Boolean(member?.is_secret),
      price: unitPrice,
      quantity: 1,
      image: imageUrl,
      channel: 'po'
    }

    setCart(prev => {
      const existing = prev.find(i => (i.cartId || i.id) === item.id)
      if (existing) {
        return prev.map(i => (i.cartId || i.id) === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, item]
    })
  }

  const updateQuantity = (id, delta) => {
    const item = cart.find(i => (i.cartId || i.id) === id)
    if (item && item.quantity === 1 && delta === -1) {
      nzToast.error(`${item.name} dihapus dari keranjang`)
    }

    setCart(prev => {
      const itemInPrev = prev.find(i => (i.cartId || i.id) === id)
      if (itemInPrev && itemInPrev.quantity === 1 && delta === -1) {
        return prev.filter(i => (i.cartId || i.id) !== id)
      }
      return prev.map(item => {
        if ((item.cartId || item.id) === id) {
          return { ...item, quantity: Math.max(1, item.quantity + delta) }
        }
        return item
      })
    })
  }

  const removeFromCart = (id) => {
    const item = cart.find(i => (i.cartId || i.id) === id)
    if (item) {
      nzToast.error(`${item.name} dihapus dari keranjang`)
    }
    setCart(prev => prev.filter(item => (item.cartId || item.id) !== id))
  }

  // --- Merch Cart Logic ---

  const addToMerchCart = (item, size = '') => {
    const cartId = size ? `${item.id}-${size}` : item.id
    const existing = merchCart.find(i => i.cartId === cartId)
    const newQty = existing ? existing.quantity + 1 : 1
    // nzToast.merch(`${item.nama}${size ? ` (${size})` : ''}`, newQty)

    setMerchCart(prev => {
      const ex = prev.find(i => i.cartId === cartId)
      if (ex) return prev.map(i => i.cartId === cartId ? { ...i, quantity: i.quantity + 1 } : i)
      const baseHarga = item.baseHarga || item.harga;
      const finalHarga = baseHarga + getSizePriceIncrement(size, item);
      return [...prev, { ...item, baseHarga, harga: finalHarga, quantity: 1, cartId, size }]
    })
  }

  const updateMerchQuantity = (cartId, delta) => {
    setMerchCart(prev => {
      const item = prev.find(i => i.cartId === cartId)
      if (item && item.quantity === 1 && delta === -1) return prev.filter(i => i.cartId !== cartId)
      return prev.map(i => i.cartId === cartId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)
    })
  }

  const removeFromMerchCart = (cartId) => setMerchCart(prev => prev.filter(i => i.cartId !== cartId))
  
  const updateMerchSize = (cartId, newSize) => {
    setMerchCart(prev => {
      const existing = prev.find(i => i.cartId === cartId)
      if (!existing) return prev
      const newCartId = newSize ? `${existing.id}-${newSize}` : existing.id
      const duplicate = prev.find(i => i.cartId === newCartId && i.cartId !== cartId)
      if (duplicate) {
        return prev.map(i => {
          if (i.cartId === newCartId) return { ...i, quantity: i.quantity + existing.quantity }
          return i
        }).filter(i => i.cartId !== cartId)
      }
      const newHarga = existing.baseHarga + getSizePriceIncrement(newSize, existing);
      return prev.map(i => i.cartId === cartId ? { ...i, cartId: newCartId, size: newSize, harga: newHarga } : i)
    })
  }

  const clearCart = () => {
    setCart([])
    try {
      localStorage.removeItem('nz_cart')
    } catch (_) {}
  }

  const clearMerchCart = () => {
    setMerchCart([])
    try {
      localStorage.removeItem('nz_merch_cart')
    } catch (_) {}
  }

  const totalHarga = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const totalMerchHarga = merchCart.reduce((sum, i) => sum + (i.harga * i.quantity), 0)

  return {
    cart,
    setCart,
    clearCart,
    merchCart,
    setMerchCart,
    clearMerchCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    addToMerchCart,
    updateMerchQuantity,
    removeFromMerchCart,
    updateMerchSize,
    totalHarga,
    totalMerchHarga
  }
}
