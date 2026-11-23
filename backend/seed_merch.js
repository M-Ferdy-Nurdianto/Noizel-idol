import { supabase } from './config/supabase.js';

async function seed() {
  console.log('--- Checking and Seeding Merchandise ---');

  // 1. Check or create active batch
  let { data: activeBatch } = await supabase
    .from('merch_batches')
    .select('*')
    .eq('is_active', true)
    .maybeSingle();

  if (!activeBatch) {
    console.log('No active batch found, creating Batch 01...');
    const { data: newBatch, error: batchErr } = await supabase
      .from('merch_batches')
      .insert({
        nama: 'Batch 01 - First Frequency',
        slug: 'batch-01',
        is_active: true,
        open_at: new Date().toISOString()
      })
      .select()
      .single();

    if (batchErr) {
      console.error('Failed to create batch:', batchErr);
      return;
    }
    activeBatch = newBatch;
    console.log('Created batch:', activeBatch.id, activeBatch.nama);
  } else {
    console.log('Using existing active batch:', activeBatch.id, activeBatch.nama);
  }

  // 2. Check existing merchandise count
  const { data: existingMerch, error: countErr } = await supabase
    .from('merchandise')
    .select('id, nama')
    .eq('available', true);

  if (countErr) {
    console.error('Failed to check merchandise:', countErr);
    return;
  }

  if (existingMerch && existingMerch.length >= 4) {
    console.log(`Database already has ${existingMerch.length} active products. Skipping seed as requested.`);
    return;
  }

  // 3. Seed the 4 official products idempotently
  const productsToSeed = [
    {
      nama: 'NOIZE Oversized Tee',
      deskripsi: 'Bahan Cotton Combed 24s Heavyweight, sablon high-density neon.',
      harga: 185000,
      stok: 50,
      badge: 'NEW',
      category: 't-shirt',
      urutan: 1,
      available: true,
      gambar_url: '/images/merch/tee.png',
      images: ['/images/merch/tee.png'],
      batch_id: activeBatch.id,
      sizes: ['S', 'M', 'L', 'XL', 'XXL']
    },
    {
      nama: 'NOIZE Pullover Hoodie',
      deskripsi: 'Fleece tebal premium, logo bordir dada & sablon tipografi punggung.',
      harga: 350000,
      stok: 30,
      badge: 'BEST SELLER',
      category: 'hoodie',
      urutan: 2,
      available: true,
      gambar_url: '/images/merch/hoodie.png',
      images: ['/images/merch/hoodie.png'],
      batch_id: activeBatch.id,
      sizes: ['M', 'L', 'XL', 'XXL']
    },
    {
      nama: 'Stage Tour Tote Bag',
      deskripsi: 'Kanvas tebal 14oz beresleting, muat laptop & lightstick panggung.',
      harga: 120000,
      stok: 25,
      badge: 'LIMITED',
      category: 'bag',
      urutan: 3,
      available: true,
      gambar_url: '/images/merch/tote.png',
      images: ['/images/merch/tote.png'],
      batch_id: activeBatch.id,
      sizes: []
    },
    {
      nama: 'Logo Rubber Keychain',
      deskripsi: 'Gantungan kunci silikon embossed logo NOIZE anti-pudar.',
      harga: 55000,
      stok: 100,
      badge: null,
      category: 'accessory',
      urutan: 4,
      available: true,
      gambar_url: '/images/merch/keychain.png',
      images: ['/images/merch/keychain.png'],
      batch_id: activeBatch.id,
      sizes: []
    }
  ];

  for (const item of productsToSeed) {
    // Check if item exists by name
    const { data: found } = await supabase
      .from('merchandise')
      .select('id')
      .eq('nama', item.nama)
      .maybeSingle();

    if (found) {
      console.log(`Updating existing: ${item.nama}`);
      await supabase
        .from('merchandise')
        .update(item)
        .eq('id', found.id);
    } else {
      console.log(`Inserting: ${item.nama}`);
      await supabase
        .from('merchandise')
        .insert(item);
    }
  }

  console.log('Merchandise seed complete!');
}

seed();
