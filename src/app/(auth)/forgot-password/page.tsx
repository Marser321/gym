"use client";

import { motion } from "framer-motion";
import { Mail, ArrowRight, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
            });

            if (error) throw error;
            setIsSuccess(true);
        } catch (err: any) {
            setError(err.message || "Error al enviar el correo");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full bg-deep-charcoal border border-neon-cyan/30 rounded-3xl p-8 text-center"
                >
                    <div className="mx-auto h-20 w-20 bg-neon-cyan/20 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle className="h-10 w-10 text-neon-cyan" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">¡Correo Enviado!</h2>
                    <p className="text-gray-400 mb-6">
                        Si el correo {email} está registrado, recibirás un enlace para recuperar tu contraseña.
                    </p>
                    <Link href="/login">
                        <button className="w-full rounded-xl bg-white/10 hover:bg-white/20 py-3 text-white transition-colors">
                            Volver al Login
                        </button>
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-black font-sans text-white">
            {/* Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-black via-deep-charcoal to-black z-10" />
            </div>

            <div className="z-20 w-full max-w-md px-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/60 p-8 shadow-2xl backdrop-blur-xl"
                >
                    <Link href="/login" className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Volver
                    </Link>

                    <h1 className="text-2xl font-bold mb-2 text-white">Recuperar Acceso</h1>
                    <p className="text-sm text-gray-400 mb-6">Ingresa tu email para recibir instrucciones.</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
                                {error}
                            </div>
                        )}

                        <div className="group relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 transition-colors group-focus-within:text-neon-cyan" />
                            <input
                                type="email"
                                placeholder="tucorreo@ejemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full rounded-xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 text-white placeholder-gray-600 outline-none transition-all focus:border-neon-cyan/50 focus:bg-white/10"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-neon-cyan py-4 text-lg font-bold text-black transition-all hover:bg-cyan-300 disabled:opacity-70"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : "ENVIAR INSTRUCCIONES"}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
