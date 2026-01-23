"use client";

import { CrystalCard } from "@/components/crystal/CrystalCard";
import { CrystalButton } from "@/components/crystal/CrystalButton";
import { motion } from "framer-motion";
import { Lock, Mail, Dumbbell, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                // Si el error es credenciales inválidas, intenta registrar (por conveniencia en demo)
                // O muestra el error real.
                if (error.message.includes("Invalid login credentials")) {
                    throw new Error("Credenciales incorrectas. Si eres nuevo, regístrate o contacta al admin.");
                }
                throw error;
            }

            // Éxito
            router.push("/dashboard");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Ocurrió un error al iniciar sesión");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUp = async () => {
        // Simple signup helper for demo purposes
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: email.split("@")[0], // Default name from email
                        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}` // Auto avatar
                    }
                }
            });

            if (error) throw error;

            alert("Cuenta creada! Revisa tu email para confirmar o inicia sesión si el auto-confirm está activo (local).");
            // Try auto-login after signup just in case
            await supabase.auth.signInWithPassword({ email, password });
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message || "Error al registrarse");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background">
            {/* Background Image with heavy blur and overlay */}
            <div
                className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop')] bg-cover bg-center"
            >
                <div className="absolute inset-0 bg-deep-charcoal/80 backdrop-blur-md" />
            </div>

            {/* Login Card */}
            <div className="z-10 w-full max-w-md px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    <CrystalCard className="border-white/10 p-8 shadow-2xl">
                        <div className="mb-8 flex flex-col items-center text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan shadow-[0_0_15px_rgba(0,243,255,0.2)]">
                                <Dumbbell className="h-8 w-8" />
                            </div>
                            <h1 className="text-3xl font-bold text-white tracking-tight text-glow">
                                GYM PREMIUM
                            </h1>
                            <p className="mt-2 text-sm text-gray-400">
                                Acceso exclusivo para miembros
                            </p>
                        </div>

                        {error && (
                            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                                    <input
                                        type="email"
                                        placeholder="tucorreo@ejemplo.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white placeholder-gray-500 backdrop-blur-sm focus:border-neon-cyan/50 focus:outline-none focus:ring-1 focus:ring-neon-cyan/50 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white placeholder-gray-500 backdrop-blur-sm focus:border-neon-cyan/50 focus:outline-none focus:ring-1 focus:ring-neon-cyan/50 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <CrystalButton
                                    type="submit"
                                    className="w-full text-lg font-semibold tracking-wide"
                                    size="lg"
                                    isLoading={isLoading}
                                >
                                    INGRESAR
                                </CrystalButton>

                                <button
                                    type="button"
                                    onClick={handleSignUp}
                                    disabled={isLoading || !email || !password}
                                    className="text-xs text-gray-500 hover:text-white transition-colors"
                                >
                                    ¿Nuevo aquí? <span className="underline">Crear cuenta rápida</span>
                                </button>
                            </div>
                        </form>

                        <div className="mt-8 text-center text-xs text-gray-500">
                            ¿Olvidaste tu contraseña? <span className="cursor-pointer text-neon-cyan hover:underline">Recuperar</span>
                        </div>
                    </CrystalCard>
                </motion.div>
            </div>
        </div>
    );
}
