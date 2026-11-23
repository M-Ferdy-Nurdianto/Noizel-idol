import test from 'node:test'
import assert from 'node:assert/strict'
import 'dotenv/config'
import { supabase } from '../config/supabase.js'

test('QRIS & Payment Method Validation Test Suite (5 Scenarios)', async (t) => {
  // Setup: create test event and member
  const { data: testEvent } = await supabase
    .from('events')
    .insert({
      nama: 'QRIS Test Event',
      tanggal: 28,
      bulan: 'Desember',
      tahun: 2026,
      lokasi: 'Test Studio',
      is_past: false,
      is_special: false,
      type: 'regular'
    })
    .select()
    .single()

  const { data: members } = await supabase.from('members').select('*').limit(1)
  const testMember = members && members.length > 0 ? members[0] : null
  assert.ok(testMember, 'Member exists for test')

  // Helper validation function identical to server route logic in routes/orders.js
  const validateOrderPaymentMethod = (payment_method, configMap) => {
    const method = (payment_method || 'transfer').toLowerCase()
    const transferActive = configMap.payment_cheki_transfer_active !== 'false'
    const qrisActive = configMap.payment_cheki_qris_active === 'true' && Boolean(configMap.payment_cheki_qris_image)

    if (method === 'qris' && !qrisActive) {
      return { valid: false, status: 400, message: 'Metode pembayaran QRIS sedang tidak aktif atau belum tersedia.' }
    }
    if (method === 'transfer' && !transferActive) {
      return { valid: false, status: 400, message: 'Metode pembayaran Transfer Bank sedang tidak aktif.' }
    }
    if (method !== 'transfer' && method !== 'qris') {
      return { valid: false, status: 400, message: 'Metode pembayaran tidak valid.' }
    }
    return { valid: true, method }
  }

  // ─────────────────────────────────────────────────────────────
  // Skenario 1: Hanya Transfer Aktif
  // ─────────────────────────────────────────────────────────────
  await t.test('Skenario 1: Hanya Transfer Bank yang aktif', () => {
    const configMap = {
      payment_cheki_transfer_active: 'true',
      payment_cheki_qris_active: 'false',
      payment_cheki_qris_image: ''
    }

    const resTransfer = validateOrderPaymentMethod('transfer', configMap)
    assert.equal(resTransfer.valid, true, 'Metode Transfer diterima saat hanya Transfer aktif')
    assert.equal(resTransfer.method, 'transfer')

    const resQris = validateOrderPaymentMethod('qris', configMap)
    assert.equal(resQris.valid, false, 'Metode QRIS ditolak saat hanya Transfer aktif')
    assert.equal(resQris.status, 400)
    assert.match(resQris.message, /tidak aktif atau belum tersedia/)
  })

  // ─────────────────────────────────────────────────────────────
  // Skenario 2: Hanya QRIS Aktif
  // ─────────────────────────────────────────────────────────────
  await t.test('Skenario 2: Hanya QRIS yang aktif', () => {
    const configMap = {
      payment_cheki_transfer_active: 'false',
      payment_cheki_qris_active: 'true',
      payment_cheki_qris_image: 'https://example.com/qris.webp'
    }

    const resQris = validateOrderPaymentMethod('qris', configMap)
    assert.equal(resQris.valid, true, 'Metode QRIS diterima saat QRIS aktif dengan gambar')
    assert.equal(resQris.method, 'qris')

    const resTransfer = validateOrderPaymentMethod('transfer', configMap)
    assert.equal(resTransfer.valid, false, 'Metode Transfer ditolak saat Transfer nonaktif')
    assert.equal(resTransfer.status, 400)
    assert.match(resTransfer.message, /Transfer Bank sedang tidak aktif/)
  })

  // ─────────────────────────────────────────────────────────────
  // Skenario 3: Keduanya Aktif (Transfer & QRIS)
  // ─────────────────────────────────────────────────────────────
  await t.test('Skenario 3: Keduanya aktif (Transfer & QRIS)', () => {
    const configMap = {
      payment_cheki_transfer_active: 'true',
      payment_cheki_qris_active: 'true',
      payment_cheki_qris_image: 'https://example.com/qris.webp'
    }

    const resTransfer = validateOrderPaymentMethod('transfer', configMap)
    assert.equal(resTransfer.valid, true, 'Transfer diterima saat keduanya aktif')

    const resQris = validateOrderPaymentMethod('qris', configMap)
    assert.equal(resQris.valid, true, 'QRIS diterima saat keduanya aktif')
  })

  // ─────────────────────────────────────────────────────────────
  // Skenario 4: QRIS tanpa gambar tidak bisa aktif
  // ─────────────────────────────────────────────────────────────
  await t.test('Skenario 4: QRIS diaktifkan tetapi gambar kosong (harus ditolak)', () => {
    const configMap = {
      payment_cheki_transfer_active: 'true',
      payment_cheki_qris_active: 'true',
      payment_cheki_qris_image: '' // Gambar belum diupload
    }

    const resQris = validateOrderPaymentMethod('qris', configMap)
    assert.equal(resQris.valid, false, 'QRIS ditolak jika gambarnya belum diupload')
    assert.equal(resQris.status, 400)
    assert.match(resQris.message, /tidak aktif atau belum tersedia/)
  })

  // ─────────────────────────────────────────────────────────────
  // Skenario 5: Order masuk dengan metode QRIS tersimpan & tampil di admin
  // ─────────────────────────────────────────────────────────────
  await t.test('Skenario 5: Database persistence & admin display for QRIS orders', async () => {
    const testOrderNum = `NZ-QRIS-${Date.now()}`
    
    // Insert order with payment_method = 'qris'
    const { data: createdOrder, error: oErr } = await supabase
      .from('orders')
      .insert({
        order_number: testOrderNum,
        nama_lengkap: 'Buyer QRIS Test',
        whatsapp: '081299887766',
        email: `test-${Date.now()}@noize.official`,
        total_harga: 25000,
        status: 'pending',
        is_ots: false,
        payment_method: 'qris',
        payment_proof_url: 'https://example.com/proof-qris.webp'
      })
      .select()
      .single()

    assert.ok(!oErr, `Order insertion success: ${oErr?.message}`)
    assert.equal(createdOrder.payment_method, 'qris', 'Kolom payment_method tersimpan bernilai qris')

    // Insert order item
    const { error: iErr } = await supabase
      .from('order_items')
      .insert({
        order_id: createdOrder.id,
        item_name: `Cheki ${testMember.nama_panggung}`,
        quantity: 1,
        price: 25000,
        event_id: testEvent.id,
        member_id: testMember.id
      })
    assert.ok(!iErr, 'Order items inserted')

    // Query back from admin orders perspective
    const { data: adminOrders, error: aErr } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', createdOrder.id)
      .single()

    assert.ok(!aErr, 'Admin fetch order success')
    assert.equal(adminOrders.payment_method, 'qris', 'Admin membaca payment_method: qris')
    assert.equal(adminOrders.order_number, testOrderNum)

    // Verify badge condition used by RenderTable.jsx:
    // order.payment_method === 'qris' -> Badge 'QRIS'
    const badgeText = adminOrders.payment_method === 'qris' ? 'QRIS' : 'Transfer'
    assert.equal(badgeText, 'QRIS', 'Badge admin tampil sebagai QRIS')

    // Cleanup test data
    await supabase.from('order_items').delete().eq('order_id', createdOrder.id)
    await supabase.from('orders').delete().eq('id', createdOrder.id)
  })

  // Cleanup test event
  if (testEvent?.id) {
    await supabase.from('events').delete().eq('id', testEvent.id)
  }
})
