import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Cargar variables de entorno manualmente
const envPath = path.resolve(process.cwd(), '.env.local')
const result = dotenv.config({ path: envPath })

if (result.error) {
    console.error('❌ Error cargando .env.local:', result.error)
} else {
    console.log('✅ .env.local cargado')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Auditoría de Conexión Supabase')
console.log('--------------------------------')
console.log('URL:', supabaseUrl)
console.log('KEY:', supabaseKey ? (supabaseKey.substring(0, 10) + '...') : 'MISSING')

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Faltan credenciales en .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
    console.log('\n📡 Probando conexión a DB...')

    // Intento de lectura simple (no auth)
    const { data, error } = await supabase.from('profiles').select('count').limit(1)

    if (error) {
        if (error.code === 'PGRST116') {
            console.log('✅ Conexión establecida (La tabla existe, aunque puede estar vacía o restringida)')
        } else {
            console.error('❌ Error de conexión:', error.message, error.code)
            console.log('   -> Verifica si aplicaste el script SQL inicial en Supabase Dashboard.')
        }
    } else {
        console.log('✅ Conexión a Base de Datos EXITOSA')
    }

    console.log('\n🔐 Probando Auth Service...')
    const { data: authData, error: authError } = await supabase.auth.getSession()

    if (authError) {
        console.error('❌ Error en Auth Service:', authError.message)
    } else {
        console.log('✅ Auth Service Responde correctamente')
    }
}

testConnection()
