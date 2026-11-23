import test from 'node:test'
import assert from 'node:assert/strict'
import 'dotenv/config'
import { supabase } from '../config/supabase.js'
import { getChekiUnitPrice } from '../utils/chekiPricing.js'

test('Integration Test: Server recalculates prices and creates order with mixed events', async () => {
  // 1. Setup test events
  const { data: regEvent, error: rErr } = await supabase
    .from('events')
    .insert({
      nama: 'Test Regular Event',
      tanggal: 20,
      bulan: 'Desember',
      tahun: 2026,
      lokasi: 'Test Venue A',
      is_past: false,
      is_special: false,
      type: 'regular',
      harga_cheki_po: null
    })
    .select()
    .single()
  assert.ok(!rErr, 'Insert regular event success')

  const { data: specEvent, error: sErr } = await supabase
    .from('events')
    .insert({
      nama: 'Test Special Event',
      tanggal: 25,
      bulan: 'Desember',
      tahun: 2026,
      lokasi: 'Test Venue B',
      is_past: false,
      is_special: true,
      type: 'special',
      theme_name: 'Winter Idol',
      theme_color: '#FF1CE3',
      harga_cheki_po: 40000
    })
    .select()
    .single()
  assert.ok(!sErr, 'Insert special event success')

  // Get active member
  const { data: members } = await supabase.from('members').select('*').limit(1)
  const testMember = members && members.length > 0 ? members[0] : null
  assert.ok(testMember, 'Member exists')

  // Get config
  const { data: dbConfig } = await supabase.from('config').select('*')
  const configMap = {}
  ;(dbConfig || []).forEach(c => { configMap[c.key] = c.value })
  const regMemberPrice = Number(configMap.harga_cheki_per_member) || 25000

  try {
    // 2. Client sends an order with mixed items, attempting to tamper price (e.g. sending 1000 for both)
    const clientItems = [
      {
        event_id: regEvent.id,
        member_id: testMember.id,
        name: `Cheki ${testMember.nama_panggung} - ${regEvent.nama}`,
        price: 1000, // Client tries to send manipulated price
        quantity: 1
      },
      {
        event_id: specEvent.id,
        member_id: testMember.id,
        name: `Cheki ${testMember.nama_panggung} - ${specEvent.nama}`,
        price: 1000, // Client tries to send manipulated price
        quantity: 1
      }
    ]

    // 3. Simulate Server-side order processing
    const eventIds = [...new Set(clientItems.map(i => i.event_id))]
    const { data: dbEvents } = await supabase.from('events').select('*').in('id', eventIds)
    const eventsMap = new Map((dbEvents || []).map(e => [e.id, e]))

    let calculatedTotal = 0
    const calculatedItems = []

    for (const it of clientItems) {
      const ev = eventsMap.get(it.event_id)
      const unitPrice = getChekiUnitPrice(ev, 'member', 'po', configMap)
      calculatedTotal += unitPrice * it.quantity
      calculatedItems.push({
        event_id: ev.id,
        member_id: it.member_id,
        item_name: it.name,
        price: unitPrice,
        quantity: it.quantity
      })
    }

    // Verify server recalculation rejected client price (1000)
    assert.equal(calculatedItems[0].price, regMemberPrice, 'Item 1 recalculated to regular price')
    assert.equal(calculatedItems[1].price, 40000, 'Item 2 recalculated to special price 40.000')
    assert.equal(calculatedTotal, regMemberPrice + 40000, 'Total recalculated to 25.000 + 40.000 = 65.000')

    // 4. Insert order & order_items into DB
    const orderNumber = `NZ-TEST-${Date.now()}`
    const { data: order, error: ordErr } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        event_id: regEvent.id,
        nama_lengkap: 'Tester Integration',
        whatsapp: '08123456789',
        email: 'test@noize.official',
        total_harga: calculatedTotal,
        status: 'pending',
        created_by: 'test'
      })
      .select()
      .single()
    assert.ok(!ordErr, 'Order created in database')

    const { error: oiErr } = await supabase
      .from('order_items')
      .insert(calculatedItems.map(it => ({
        order_id: order.id,
        event_id: it.event_id,
        member_id: it.member_id,
        item_name: it.item_name,
        price: it.price,
        quantity: it.quantity
      })))
    assert.ok(!oiErr, 'Order items created in database')

    // 5. Query back order and order_items from DB to verify persistence
    const { data: fetchedOrder } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', order.id)
      .single()

    assert.equal(fetchedOrder.total_harga, regMemberPrice + 40000)
    assert.equal(fetchedOrder.order_items.length, 2)

    const fetchedItem1 = fetchedOrder.order_items.find(i => i.event_id === regEvent.id)
    const fetchedItem2 = fetchedOrder.order_items.find(i => i.event_id === specEvent.id)

    assert.equal(fetchedItem1.price, regMemberPrice, 'Item regular stored with 25.000 snapshot')
    assert.equal(fetchedItem2.price, 40000, 'Item special stored with 40.000 snapshot')

    // 6. Cleanup test records
    await supabase.from('orders').delete().eq('id', order.id)
  } finally {
    await supabase.from('events').delete().eq('id', regEvent.id)
    await supabase.from('events').delete().eq('id', specEvent.id)
  }
})
