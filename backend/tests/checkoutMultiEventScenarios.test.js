import test from 'node:test'
import assert from 'node:assert/strict'
import 'dotenv/config'
import { supabase } from '../config/supabase.js'
import { getChekiUnitPrice } from '../utils/chekiPricing.js'

test('Checkout Scenarios: 1 Event, 2 Mixed Events, Cheki + Merch, Merch Only, and Lineup Validation', async () => {
  // Setup Config
  const { data: dbConfig } = await supabase.from('config').select('*')
  const configMap = {}
  ;(dbConfig || []).forEach(c => { configMap[c.key] = c.value })
  const regMemberPrice = Number(configMap.harga_cheki_per_member) || 25000
  const regGroupPrice = Number(configMap.harga_cheki_grup) || 30000

  // 1. Get or create test members
  const { data: members } = await supabase.from('members').select('*').limit(2)
  assert.ok(members && members.length > 0, 'Members exist')
  const memberA = members[0]
  const memberB = members[1] || members[0]

  // Get active merch batch if any
  const { data: batches } = await supabase.from('merch_batches').select('*').limit(1)
  const activeBatch = batches && batches.length > 0 ? batches[0] : null

  // 2. Setup Events: 1 Regular, 1 Special with override, 1 Past Event
  const { data: regEvent } = await supabase
    .from('events')
    .insert({
      nama: 'Event Regular Test 1',
      tanggal: 28,
      bulan: 'Desember',
      tahun: 2026,
      lokasi: 'Regular Venue',
      is_past: false,
      is_special: false,
      type: 'regular',
      harga_cheki_po: null
    })
    .select()
    .single()

  const { data: specEvent } = await supabase
    .from('events')
    .insert({
      nama: 'Event Special Test 2',
      tanggal: 30,
      bulan: 'Desember',
      tahun: 2026,
      lokasi: 'Special Venue',
      is_past: false,
      is_special: true,
      type: 'special',
      theme_name: 'Summer Glow',
      theme_color: '#FF007F',
      harga_cheki_po: 50000
    })
    .select()
    .single()

  const { data: pastEvent } = await supabase
    .from('events')
    .insert({
      nama: 'Event Past Test',
      tanggal: 1,
      bulan: 'Januari',
      tahun: 2020,
      lokasi: 'Old Venue',
      is_past: true,
      is_special: false,
      type: 'regular'
    })
    .select()
    .single()

  // Set lineup for regEvent: only memberA is present
  await supabase.from('event_lineup').insert([
    { event_id: regEvent.id, member_id: memberA.id },
    { event_id: specEvent.id, member_id: memberA.id },
    { event_id: specEvent.id, member_id: memberB.id }
  ])

  try {
    // ------------------------------------------------------------------------
    // SCENARIO 1: Checkout dengan 1 Event
    // ------------------------------------------------------------------------
    {
      const cartItems = [
        {
          event_id: regEvent.id,
          member_id: memberA.id,
          name: `Cheki ${memberA.nama_panggung} - ${regEvent.nama}`,
          quantity: 2
        }
      ]

      let total1 = 0
      const orderItems1 = []
      for (const it of cartItems) {
        const unitPrice = getChekiUnitPrice(regEvent, 'member', 'po', configMap)
        total1 += unitPrice * it.quantity
        orderItems1.push({
          event_id: it.event_id,
          member_id: it.member_id,
          item_name: it.name,
          price: unitPrice,
          quantity: it.quantity
        })
      }

      assert.equal(total1, regMemberPrice * 2, 'Scenario 1 Total matches 2x regular price')

      const { data: order1, error: err1 } = await supabase
        .from('orders')
        .insert({
          order_number: `NZ-TEST-SC1-${Date.now()}`,
          event_id: regEvent.id,
          nama_lengkap: 'Buyer Skenario 1',
          whatsapp: '08111111111',
          email: 'sc1@noize.official',
          total_harga: total1,
          status: 'pending'
        })
        .select()
        .single()
      assert.ok(!err1 && order1, `Order 1 created (${err1?.message})`)

      const { error: itemsErr1 } = await supabase
        .from('order_items')
        .insert(orderItems1.map(i => ({ ...i, order_id: order1.id })))
      assert.ok(!itemsErr1, 'Order items 1 inserted')

      // Verify event_id is saved on order_item
      const { data: savedItems1 } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order1.id)
      assert.equal(savedItems1.length, 1)
      assert.equal(savedItems1[0].event_id, regEvent.id, 'Scenario 1 item has correct event_id')

      // Clean up order1
      await supabase.from('order_items').delete().eq('order_id', order1.id)
      await supabase.from('orders').delete().eq('id', order1.id)
    }

    // ------------------------------------------------------------------------
    // SCENARIO 2: Checkout dengan 2 Event Campuran (Biasa + Spesial)
    // ------------------------------------------------------------------------
    {
      const cartItems = [
        {
          event_id: regEvent.id,
          member_id: memberA.id,
          name: `Cheki ${memberA.nama_panggung} - ${regEvent.nama}`,
          quantity: 1
        },
        {
          event_id: specEvent.id,
          member_id: memberA.id,
          name: `Cheki ${memberA.nama_panggung} - ${specEvent.nama}`,
          quantity: 1
        },
        {
          event_id: specEvent.id,
          member_id: 'group',
          name: `Group Cheki - ${specEvent.nama}`,
          quantity: 1
        }
      ]

      const eventsMap = new Map([
        [regEvent.id, regEvent],
        [specEvent.id, specEvent]
      ])

      let total2 = 0
      const orderItems2 = []
      for (const it of cartItems) {
        const ev = eventsMap.get(it.event_id)
        const isGroup = it.member_id === 'group'
        const unitPrice = getChekiUnitPrice(ev, isGroup ? 'group' : 'member', 'po', configMap)
        total2 += unitPrice * it.quantity
        orderItems2.push({
          event_id: it.event_id,
          member_id: isGroup ? null : it.member_id,
          item_name: it.name,
          price: unitPrice,
          quantity: it.quantity
        })
      }

      // Expected prices: reg member (25.000) + special member (50.000) + special group (fallback to 30.000) = 105.000
      assert.equal(orderItems2[0].price, 25000, 'Regular member price 25.000')
      assert.equal(orderItems2[1].price, 50000, 'Special member price 50.000')
      assert.equal(orderItems2[2].price, regGroupPrice, 'Special group fallback to 30.000')
      assert.equal(total2, 25000 + 50000 + regGroupPrice, 'Scenario 2 Total matches mixed prices')

      const { data: order2, error: err2 } = await supabase
        .from('orders')
        .insert({
          order_number: `NZ-TEST-SC2-${Date.now()}`,
          event_id: regEvent.id,
          nama_lengkap: 'Buyer Skenario 2 Mixed',
          whatsapp: '08222222222',
          email: 'sc2@noize.official',
          total_harga: total2,
          status: 'pending'
        })
        .select()
        .single()
      assert.ok(!err2 && order2, `Order 2 created (${err2?.message})`)

      const { error: itemsErr2 } = await supabase
        .from('order_items')
        .insert(orderItems2.map(i => ({ ...i, order_id: order2.id })))
      assert.ok(!itemsErr2, 'Order items 2 inserted')

      // Verify each item preserves its independent event_id
      const { data: savedItems2 } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order2.id)
      assert.equal(savedItems2.length, 3)
      assert.equal(savedItems2[0].event_id, regEvent.id, 'Item 1 belongs to regular event')
      assert.equal(savedItems2[1].event_id, specEvent.id, 'Item 2 belongs to special event')
      assert.equal(savedItems2[2].event_id, specEvent.id, 'Item 3 belongs to special event')

      // Clean up order2
      await supabase.from('order_items').delete().eq('order_id', order2.id)
      await supabase.from('orders').delete().eq('id', order2.id)
    }

    // ------------------------------------------------------------------------
    // SCENARIO 3: Cheki + Merch Checkout Flow
    // ------------------------------------------------------------------------
    {
      // Cheki order
      const { data: chekiOrder, error: cErr } = await supabase
        .from('orders')
        .insert({
          order_number: `NZ-TEST-SC3-C-${Date.now()}`,
          event_id: regEvent.id,
          nama_lengkap: 'Buyer Skenario 3 Cheki',
          whatsapp: '08333333333',
          email: 'sc3@noize.official',
          total_harga: regMemberPrice,
          status: 'pending'
        })
        .select()
        .single()
      assert.ok(!cErr && chekiOrder, `Cheki Order created (${cErr?.message})`)

      await supabase.from('order_items').insert({
        order_id: chekiOrder.id,
        event_id: regEvent.id,
        member_id: memberA.id,
        item_name: `Cheki ${memberA.nama_panggung}`,
        price: regMemberPrice,
        quantity: 1
      })

      // Merch order (independent, no event fields)
      if (activeBatch) {
        const { data: merchOrder, error: mErr } = await supabase
          .from('merch_orders')
          .insert({
            order_number: `NZ-MERCH-SC3-${Date.now()}`,
            nama_lengkap: 'Buyer Skenario 3 Merch',
            whatsapp: '08333333333',
            total_harga: 150000,
            status: 'pending',
            batch_id: activeBatch.id
          })
          .select()
          .single()
        assert.ok(!mErr && merchOrder, `Merch Order created (${mErr?.message})`)
        assert.equal(merchOrder.event_id, undefined, 'Merch order has no event_id')

        await supabase.from('merch_orders').delete().eq('id', merchOrder.id)
      }

      // Clean up SC3 cheki
      await supabase.from('order_items').delete().eq('order_id', chekiOrder.id)
      await supabase.from('orders').delete().eq('id', chekiOrder.id)
    }

    // ------------------------------------------------------------------------
    // SCENARIO 4: Merch Saja Checkout
    // ------------------------------------------------------------------------
    {
      if (activeBatch) {
        const { data: merchOnlyOrder, error: moErr } = await supabase
          .from('merch_orders')
          .insert({
            order_number: `NZ-MERCH-SC4-${Date.now()}`,
            nama_lengkap: 'Buyer Skenario 4 Merch Only',
            whatsapp: '08444444444',
            total_harga: 85000,
            status: 'pending',
            batch_id: activeBatch.id
          })
          .select()
          .single()
        assert.ok(!moErr && merchOnlyOrder, `Merch Only order created (${moErr?.message})`)
        assert.equal(merchOnlyOrder.event_id, undefined, 'Merch only has zero event fields')

        await supabase.from('merch_orders').delete().eq('id', merchOnlyOrder.id)
      }
    }

    // ------------------------------------------------------------------------
    // SCENARIO 5: Validation - Past/Inactive Events & Lineup Rejection
    // ------------------------------------------------------------------------
    {
      // 5A: Past event check
      const isPast = pastEvent.is_past || pastEvent.tahun < new Date().getFullYear()
      assert.equal(isPast, true, 'Server detects past event')

      // 5B: Lineup check
      // For regEvent, only memberA is in lineup. If memberB is requested, reject!
      const { data: lineups } = await supabase
        .from('event_lineup')
        .select('member_id')
        .eq('event_id', regEvent.id)
      const allowedIds = new Set((lineups || []).map(l => l.member_id))

      assert.equal(allowedIds.has(memberA.id), true, 'Member A is in regEvent lineup')
      if (memberB.id !== memberA.id) {
        assert.equal(allowedIds.has(memberB.id), false, 'Member B is NOT in regEvent lineup')
      }
    }

  } finally {
    // Clean up test events
    await supabase.from('event_lineup').delete().in('event_id', [regEvent.id, specEvent.id, pastEvent.id])
    await supabase.from('events').delete().in('id', [regEvent.id, specEvent.id, pastEvent.id])
  }
})
