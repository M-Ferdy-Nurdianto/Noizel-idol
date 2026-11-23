import { supabase } from '../config/supabase.js'

async function run() {
  const updates = [
    {
      member_id: 'yuna',
      tanggal_lahir: '9 Februari',
      hobi: 'Gaming',
      tagline: '5th Generation'
    },
    {
      member_id: 'shin',
      tanggal_lahir: '14 September',
      hobi: 'Singing, Dancing, Drawing, Editing',
      instagram: 'https://www.instagram.com/ss.shin_/',
      tagline: '3rd Generation',
      jikoshoukai: '3rd Generation of NOIZE. Singing, Dancing, Drawing, Editing.'
    },
    {
      member_id: 'iu',
      tanggal_lahir: '23 Juli',
      hobi: 'Modelling & Watching Korean dramas',
      instagram: 'https://www.instagram.com/ttreshy/',
      tagline: '1st Generation',
      jikoshoukai: 'Visual & Center of NOIZE (1st Generation).'
    },
    {
      member_id: 'chivy',
      tanggal_lahir: '25 Januari',
      hobi: 'Listening music, Wotagei, Watching Concert',
      instagram: 'https://www.instagram.com/catieffy/',
      tagline: '4th Generation',
      jikoshoukai: 'Lead Vocal of NOIZE (4th Generation).'
    }
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
      console.log(`Successfully updated ${member_id}:`, data)
    }
  }

  process.exit(0)
}

run()
