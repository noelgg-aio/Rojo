import { supabase } from './supabase'

export const setupAdminAccount = async (): Promise<void> => {
  try {
    console.log('[v0] Setting up admin account...')

    const adminEmail = 'admin@robloxstudio.dev'
    const adminPassword = 'Rb!0x$tud10#2024@Adm1n!Secur3'

    // Check if admin auth user already exists
    const { data: existingAuthUsers } = await supabase.auth.admin.listUsers()
    const adminAuthUser = existingAuthUsers.users.find(user => user.email === adminEmail)

    if (adminAuthUser) {
      console.log('[v0] Admin auth user already exists')
      return
    }

    // Create Supabase auth user for admin
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        data: {
          username: 'Owner Noel',
          nickname: 'Owner Noel',
          is_admin: true,
          role: 'user'
        }
      }
    })

    if (authError) {
      console.error('[v0] Failed to create admin auth user:', authError.message)
      return
    }

    if (authData.user) {
      console.log('[v0] Admin auth user created successfully')

      // Update the user profile in our custom table
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: authData.user.id,
          email: adminEmail,
          username: 'Owner Noel',
          nickname: 'Owner Noel',
          password_hash: '$2a$10$rQZ8J8zKJ8zKJ8zKJ8zKJ8zKJ8zKJ8zKJ8zKJ8zKJ8zKJ8zKJ8zKJ',
          is_admin: true,
          role: 'user',
          created_at: authData.user.created_at,
          last_ip: 'system'
        })

      if (profileError) {
        console.error('[v0] Failed to update admin profile:', profileError.message)
      } else {
        console.log('[v0] Admin account setup complete')
      }
    }
  } catch (error) {
    console.error('[v0] Error setting up admin account:', error)
  }
}
