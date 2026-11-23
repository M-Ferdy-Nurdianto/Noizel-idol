import { supabase } from '../config/supabase.js'
import bcrypt from 'bcrypt'

const resetAdmin = async () => {
    console.log('[Admin Reset] Starting Noize admin user reset...')

    const username = 'admin'
    const password = 'admin'
    const fullName = 'Admin Noize'

    try {
        const saltRounds = 10
        const passwordHash = await bcrypt.hash(password, saltRounds)
        console.log('[Admin Reset] Password hash generated for admin.')

        const { data, error } = await supabase
            .from('admin_users')
            .upsert({
                username,
                password_hash: passwordHash,
                full_name: fullName
            }, { onConflict: 'username' })
            .select()
            .single()

        if (error) {
            throw error
        }

        console.log('[Admin Reset] Admin user reset successfully!')
        console.log('Credentials: username=admin, password=admin')
        console.log('Details:', {
            id: data.id,
            username: data.username,
            full_name: data.full_name
        })

    } catch (err) {
        console.error('[Admin Reset] Error resetting admin user:', err.message)
        process.exit(1)
    }
}

resetAdmin()
