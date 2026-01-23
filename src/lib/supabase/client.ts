import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        // Return a dummy client or handle it gracefully
        // For browser, we just log it
        console.warn('Supabase keys missing in client.ts');
    }

    return createBrowserClient(
        supabaseUrl || '',
        supabaseKey || ''
    )
}
