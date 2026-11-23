import { supabase } from '../config/supabase.js'

async function run() {
  const updates = [
    { member_id: 'yuna', instagram: '@fyuninaa09' },
    { member_id: 'shin', instagram: '@ss.shin_' },
    { member_id: 'iu', instagram: '@ttreshy' },
    { member_id: 'chivy', instagram: '@catieffy' }
  ]

  for (const item of updates) {
    const { member_id, ...fields } = item
    const { data, error } = await supabase
      .from('members')
      .update(fields)
      .eq('member_id', member_id)
      .select()
    if (error) {
      console.error(`Error updating ${member_id}:`, error)
    } else {
      console.log(`Cleaned IG for ${member_id}:`, data[0]?.instagram)
    }
  }

  process.exit(0)
}

run()
