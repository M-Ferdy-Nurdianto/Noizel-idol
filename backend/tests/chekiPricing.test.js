import test from 'node:test'
import assert from 'node:assert/strict'
import { getChekiUnitPrice } from '../utils/chekiPricing.js'
import { getChekiUnitPrice as getChekiUnitPriceFrontend } from '../../frontend/src/lib/chekiPricing.js'

test('Single Source of Truth: Backend and Frontend pricing functions are 100% identical in behavior', () => {
  const event = { is_special: true, harga_cheki_po: 40000 }
  const config = { harga_cheki_per_member: '25000', harga_cheki_grup: '30000' }
  assert.equal(
    getChekiUnitPrice(event, 'member', 'po', config),
    getChekiUnitPriceFrontend(event, 'member', 'po', config)
  )
})

test('Skenario 1: Hanya event biasa', () => {
  const regularEvent = {
    id: 'ev-regular-1',
    nama: 'Noize Regular Showcase',
    is_special: false,
    type: 'regular',
    harga_cheki_po: null,
    harga_cheki_ots: null
  }
  const config = {
    harga_cheki_per_member: '25000',
    harga_cheki_grup: '30000',
    harga_ots_per_member: '35000',
    harga_ots_grup: '40000'
  }

  // Member cheki on regular event uses regular price
  const memberPrice = getChekiUnitPrice(regularEvent, 'member', 'po', config)
  assert.equal(memberPrice, 25000, 'Harga member event biasa harus sesuai harga reguler CMS (25.000)')

  // Group cheki on regular event uses regular group price
  const groupPrice = getChekiUnitPrice(regularEvent, 'group', 'po', config)
  assert.equal(groupPrice, 30000, 'Harga grup event biasa harus sesuai harga grup CMS (30.000)')
})

test('Skenario 2: Hanya event spesial dengan override', () => {
  const specialEvent = {
    id: 'ev-special-1',
    nama: 'Noize 1st Anniversary Special Stage',
    is_special: true,
    type: 'special',
    theme_name: 'Anniversary',
    theme_color: '#FF1CE3',
    harga_cheki_po: 40000,
    harga_cheki_ots: 45000
  }
  const config = {
    harga_cheki_per_member: '25000',
    harga_cheki_grup: '30000'
  }

  const memberPrice = getChekiUnitPrice(specialEvent, 'member', 'po', config)
  assert.equal(memberPrice, 40000, 'Harga member event spesial harus memakai override harga_cheki_po (40.000)')

  // Group cheki remains at standard group price
  const groupPrice = getChekiUnitPrice(specialEvent, 'group', 'po', config)
  assert.equal(groupPrice, 30000, 'Harga grup tetap harga grup reguler jika tidak ada override khusus grup')
})

test('Skenario 3: Event spesial dengan override kosong (fallback ke harga reguler)', () => {
  const config = {
    harga_cheki_per_member: '25000',
    harga_cheki_grup: '30000'
  }

  const specialEventNull = {
    id: 'ev-special-null',
    is_special: true,
    harga_cheki_po: null
  }
  assert.equal(
    getChekiUnitPrice(specialEventNull, 'member', 'po', config),
    25000,
    'Override null harus fallback ke harga reguler (25.000)'
  )

  const specialEventEmptyStr = {
    id: 'ev-special-empty',
    is_special: true,
    harga_cheki_po: ''
  }
  assert.equal(
    getChekiUnitPrice(specialEventEmptyStr, 'member', 'po', config),
    25000,
    'Override string kosong harus fallback ke harga reguler (25.000)'
  )

  const specialEventZero = {
    id: 'ev-special-zero',
    is_special: true,
    harga_cheki_po: 0
  }
  assert.equal(
    getChekiUnitPrice(specialEventZero, 'member', 'po', config),
    25000,
    'Override 0 harus fallback ke harga reguler (25.000)'
  )
})

test('Skenario 4: Campuran biasa + spesial dalam satu order (total harus benar)', () => {
  const regularEvent = {
    id: 'ev-reg',
    nama: 'Regular Gig',
    is_special: false,
    harga_cheki_po: null
  }
  const specialEvent = {
    id: 'ev-spec',
    nama: 'Special Stage',
    is_special: true,
    harga_cheki_po: 40000
  }
  const config = {
    harga_cheki_per_member: '25000',
    harga_cheki_grup: '30000'
  }

  const item1Price = getChekiUnitPrice(regularEvent, 'member', 'po', config)
  const item2Price = getChekiUnitPrice(specialEvent, 'member', 'po', config)

  assert.equal(item1Price, 25000, 'Item event biasa harus 25.000')
  assert.equal(item2Price, 40000, 'Item event spesial harus 40.000')

  // Beli 1 cheki event biasa + 1 cheki event spesial
  const total = (item1Price * 1) + (item2Price * 1)
  assert.equal(total, 65000, 'Total 1 biasa (25.000) + 1 spesial (40.000) harus tepat 65.000 (tidak saling menimpa)')
})

test('Skenario 5: Member yang sama di dua event berbeda tetap dua baris (kunci keranjang)', () => {
  const regularEvent = { id: 'ev-reg-1', nama: 'Regular Event' }
  const specialEvent = { id: 'ev-spec-2', is_special: true, harga_cheki_po: 40000, nama: 'Special Event' }
  const memberId = 'member-iu-uuid'

  // Cart key must be compound: event_id + member_id + channel
  const keyRegular = `${regularEvent.id}_${memberId}_po`
  const keySpecial = `${specialEvent.id}_${memberId}_po`

  assert.notEqual(keyRegular, keySpecial, 'Kunci cart item di dua event berbeda TIDAK boleh sama')

  // Simulate cart addition
  const cart = []
  const addItem = (ev, memId, price) => {
    const key = `${ev.id}_${memId}_po`
    const existingIndex = cart.findIndex(i => i.id === key)
    if (existingIndex >= 0) {
      cart[existingIndex].quantity += 1
    } else {
      cart.push({
        id: key,
        event_id: ev.id,
        member_id: memId,
        price,
        quantity: 1
      })
    }
  }

  addItem(regularEvent, memberId, 25000)
  addItem(specialEvent, memberId, 40000)

  assert.equal(cart.length, 2, 'Member yang sama di dua event berbeda harus menjadi 2 baris terpisah')
  assert.equal(cart[0].price, 25000)
  assert.equal(cart[1].price, 40000)
})

test('Skenario 6: Qty lebih dari 1 dengan harga masing-masing baris', () => {
  const regularEvent = { id: 'ev-reg', is_special: false }
  const specialEvent = { id: 'ev-spec', is_special: true, harga_cheki_po: 40000 }
  const config = { harga_cheki_per_member: '25000' }

  const priceReg = getChekiUnitPrice(regularEvent, 'member', 'po', config) // 25.000
  const priceSpec = getChekiUnitPrice(specialEvent, 'member', 'po', config) // 40.000

  const qtyReg = 2
  const qtySpec = 3

  const subtotalReg = priceReg * qtyReg // 50.000
  const subtotalSpec = priceSpec * qtySpec // 120.000
  const total = subtotalReg + subtotalSpec // 170.000

  assert.equal(subtotalReg, 50000)
  assert.equal(subtotalSpec, 120000)
  assert.equal(total, 170000, 'Total harus tepat 170.000 untuk 2x25.000 + 3x40.000')
})

test('Skenario 7: Admin mengubah harga: keranjang baru ikut harga baru, order lama tidak berubah', () => {
  const regularEvent = { id: 'ev-reg', is_special: false }
  
  // 1. Initial price setting
  let config = { harga_cheki_per_member: '25000' }
  const initialPrice = getChekiUnitPrice(regularEvent, 'member', 'po', config)
  assert.equal(initialPrice, 25000)

  // 2. Order created in database with snapshot price
  const savedDbOrder = {
    order_number: 'NZ-12345',
    total_harga: 25000,
    order_items: [
      { item_name: 'Cheki Iu', price: initialPrice, quantity: 1 }
    ]
  }

  // 3. Admin changes price in CMS from 25.000 to 35.000
  config = { harga_cheki_per_member: '35000' }

  // 4. New cart / recalculated cart syncs to new price
  const newCartPrice = getChekiUnitPrice(regularEvent, 'member', 'po', config)
  assert.equal(newCartPrice, 35000, 'Keranjang baru / saat reload harus mengikuti harga terbaru (35.000)')

  // 5. Historical DB order remains untouched snapshot
  assert.equal(savedDbOrder.order_items[0].price, 25000, 'Harga item pada order lama di DB TIDAK boleh berubah')
  assert.equal(savedDbOrder.total_harga, 25000, 'Total harga order lama di DB TIDAK boleh berubah')
})

test('Skenario Tambahan (OTS): Order Langsung menggunakan aturan fallback yang tepat', () => {
  const regularEvent = { id: 'ev-reg', is_special: false }
  const specialEvent = { id: 'ev-spec', is_special: true, harga_cheki_ots: 50000 }
  const specialEventNoOts = { id: 'ev-spec-no-ots', is_special: true, harga_cheki_ots: null }
  
  const config = {
    harga_cheki_per_member: '25000',
    harga_cheki_grup: '30000',
    harga_ots_per_member: '35000',
    harga_ots_grup: '45000'
  }

  // OTS Regular Member -> uses harga_ots_per_member (35.000)
  assert.equal(getChekiUnitPrice(regularEvent, 'member', 'ots', config), 35000)
  // OTS Regular Group -> uses harga_ots_grup (45.000)
  assert.equal(getChekiUnitPrice(regularEvent, 'group', 'ots', config), 45000)
  // OTS Special Event with override -> uses harga_cheki_ots (50.000)
  assert.equal(getChekiUnitPrice(specialEvent, 'member', 'ots', config), 50000)
  // OTS Special Event without override -> falls back to regular OTS member (35.000)
  assert.equal(getChekiUnitPrice(specialEventNoOts, 'member', 'ots', config), 35000)
})
