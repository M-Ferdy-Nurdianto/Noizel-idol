import { createClient } from '@supabase/supabase-js'

const localUrl = 'http://127.0.0.1:54421'
const localKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const cloudUrl = 'https://gyrzipnfnxvccakeejky.supabase.co'
const cloudKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5cnppcG5mbnh2Y2Nha2Vlamt5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NTQwNzU0NSwiZXhwIjoyMTEwOTgzNTQ1fQ.OjyLu9_watyRsu3sP-CsBf_OhMpWRHpWVFQry44iH_Q'

const localClient = createClient(localUrl, localKey, { auth: { persistSession: false } })
const cloudClient = createClient(cloudUrl, cloudKey, { auth: { persistSession: false } })

function replaceUrls(obj) {
  if (!obj) return obj
  if (typeof obj === 'string') {
    return obj.replaceAll(localUrl, cloudUrl)
  }
  if (Array.isArray(obj)) {
    return obj.map(replaceUrls)
  }
  if (typeof obj === 'object') {
    const updated = {}
    for (const [k, v] of Object.entries(obj)) {
      updated[k] = replaceUrls(v)
    }
    return updated
  }
  return obj
}

async function migrateStorageBucket(bucketName) {
  console.log(`\n--- Migrating Storage Bucket: ${bucketName} ---`)
  
  // Ensure bucket exists in cloud
  const { data: buckets } = await cloudClient.storage.listBuckets()
  const exists = buckets?.some(b => b.id === bucketName)
  if (!exists) {
    console.log(`Creating bucket ${bucketName} in cloud...`)
    await cloudClient.storage.createBucket(bucketName, { public: true })
  }

  async function listAllFiles(folder = '') {
    const { data, error } = await localClient.storage.from(bucketName).list(folder, { limit: 100 })
    if (error || !data) return []
    let files = []
    for (const item of data) {
      const fullPath = folder ? `${folder}/${item.name}` : item.name
      if (!item.id) {
        // It's a folder
        const subFiles = await listAllFiles(fullPath)
        files = files.concat(subFiles)
      } else {
        files.push(fullPath)
      }
    }
    return files
  }

  const allFiles = await listAllFiles()
  console.log(`Found ${allFiles.length} file(s) in local '${bucketName}'`)

  let uploadedCount = 0
  for (const filePath of allFiles) {
    try {
      const { data: fileData, error: downloadError } = await localClient.storage.from(bucketName).download(filePath)
      if (downloadError || !fileData) {
        console.error(`Failed to download local ${filePath}:`, downloadError)
        continue
      }

      const buffer = Buffer.from(await fileData.arrayBuffer())
      const contentType = fileData.type || 'application/octet-stream'

      const { error: uploadError } = await cloudClient.storage.from(bucketName).upload(filePath, buffer, {
        contentType,
        upsert: true
      })

      if (uploadError) {
        console.error(`Failed to upload to cloud ${filePath}:`, uploadError.message)
      } else {
        uploadedCount++
        console.log(`  ✓ Uploaded: ${filePath}`)
      }
    } catch (err) {
      console.error(`Error migrating file ${filePath}:`, err.message)
    }
  }

  console.log(`Bucket '${bucketName}' migration complete: ${uploadedCount}/${allFiles.length} uploaded.`)
}

async function migrateTable(tableName, conflictKey = 'id') {
  console.log(`\n--- Migrating Table: ${tableName} ---`)
  const { data: localRows, error: localErr } = await localClient
    .from(tableName)
    .select('*')

  if (localErr) {
    console.error(`Error reading local ${tableName}:`, localErr.message)
    return
  }

  if (!localRows || localRows.length === 0) {
    console.log(`Local table '${tableName}' is empty. Skipping.`)
    return
  }

  console.log(`Read ${localRows.length} row(s) from local '${tableName}'`)

  const transformedRows = replaceUrls(localRows)

  const { error: upsertErr } = await cloudClient
    .from(tableName)
    .upsert(transformedRows, { onConflict: conflictKey })

  if (upsertErr) {
    console.error(`Error inserting into cloud ${tableName}:`, upsertErr.message)
  } else {
    console.log(`  ✓ Successfully migrated ${transformedRows.length} row(s) to cloud '${tableName}'.`)
  }
}

async function run() {
  console.log('=============================================')
  console.log('STARTING LOCAL -> CLOUD SUPABASE MIGRATION')
  console.log('Local URL:', localUrl)
  console.log('Cloud URL:', cloudUrl)
  console.log('=============================================')

  // 1. Storage Buckets
  const buckets = ['members', 'products', 'receipts', 'payment-proofs', 'payments']
  for (const b of buckets) {
    try {
      await migrateStorageBucket(b)
    } catch (e) {
      console.error(`Error migrating bucket ${b}:`, e.message)
    }
  }

  // 2. Database Tables (in foreign key dependency order)
  await migrateTable('admin_users', 'username')
  await migrateTable('config', 'key')
  await migrateTable('members', 'member_id')
  await migrateTable('member_gallery', 'id')
  await migrateTable('events', 'id')
  await migrateTable('event_lineup', 'id')
  await migrateTable('event_gallery', 'id')
  await migrateTable('merch_batches', 'slug')
  await migrateTable('merchandise', 'id')
  await migrateTable('faqs', 'id')
  await migrateTable('orders', 'order_number')
  await migrateTable('order_items', 'id')
  await migrateTable('merch_orders', 'order_number')
  await migrateTable('merch_order_items', 'id')

  console.log('\n=============================================')
  console.log('MIGRATION FINISHED SUCCESSFULLY!')
  console.log('=============================================')
}

run().catch(err => {
  console.error('Fatal migration error:', err)
  process.exit(1)
})
