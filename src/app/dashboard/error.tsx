'use client'

import { useEffect } from 'react'
import { CrystalCard } from '@/components/crystal/CrystalCard'
import { CrystalButton } from '@/components/crystal/CrystalButton'
import { AlertTriangle, RefreshCcw } from 'lucide-react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Dashboard Error:', error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
            <CrystalCard className="w-full max-w-xl p-8 border-red-500/20 bg-black/40 backdrop-blur-xl">
                <div className="flex flex-col items-center text-center space-y-6">
                    <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/30">
                        <AlertTriangle className="h-8 w-8 text-red-500" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-white tracking-tight uppercase">Excepción de Sistema</h2>
                        <p className="text-gray-400">Se produjo un error inesperado al procesar los datos de tu dashboard.</p>
                    </div>

                    <div className="w-full bg-black/60 p-4 rounded-xl text-left font-mono text-xs border border-white/5 overflow-auto max-h-40">
                        <p className="text-red-400 mb-2 font-bold">{error.message || 'Error desconocido'}</p>
                        {error.digest && (
                            <p className="text-gray-500">Digest ID: {error.digest}</p>
                        )}
                        <p className="text-gray-600 mt-2 text-[10px] break-all">
                            Stack Trace: {error.stack?.substring(0, 500)}...
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full pt-4">
                        <CrystalButton
                            onClick={() => reset()}
                            className="flex-1 gap-2"
                        >
                            <RefreshCcw className="h-4 w-4" />
                            REINTENTAR
                        </CrystalButton>

                        <CrystalButton
                            variant="secondary"
                            onClick={() => window.location.href = '/'}
                            className="flex-1"
                        >
                            VOLVER AL INICIO
                        </CrystalButton>
                    </div>
                </div>
            </CrystalCard>
        </div>
    )
}
