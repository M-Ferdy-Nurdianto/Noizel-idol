import { supabase } from './config/supabase.js';

async function check() {
  console.log('Checking merchandise table...');
  const { data: merch, error: merchErr } = await supabase
    .from('merchandise')
    .select('*');

  if (merchErr) {
    console.error('Merch error:', merchErr);
  } else {
    console.log('Merchandise count:', merch.length);
    if (merch.length > 0) {
      console.log('Sample merch keys:', Object.keys(merch[0]));
      console.log('Sample item:', merch[0]);
    }
  }

  console.log('\nChecking merch_batches table...');
  const { data: batches, error: batchErr } = await supabase
    .from('merch_batches')
    .select('*');

  if (batchErr) {
    console.error('Batch error:', batchErr);
  } else {
    console.log('Batches count:', batches.length);
    console.log('Batches:', JSON.stringify(batches, null, 2));
  }
}

check();
