"use client";

import { motion } from "framer-motion";
import { Lock, Mail, Dumbbell, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
                if (error.message.includes("Invalid login credentials")) {
                    throw new Error("Credenciales inválidas.");
                }
                throw error;
            }

            router.push("/dashboard");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Error al iniciar sesión");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-black font-sans text-white">
            {/* Cinematic Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
                <motion.div
                    initial={{ scale: 1 }}
                    animate={{ scale: 1.1 }}
                    transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
                    className="h-full w-full bg-[url('/gym-background-dark.png')] bg-cover bg-center opacity-60"
                />
            </div>

            {/* Login Container */}
            <div className="z-20 w-full max-w-md px-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative"
                >
                    {/* Decorative Elements */}
                    <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-neon-cyan/20 blur-[100px]" />
                    <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-purple-500/20 blur-[100px]" />

                    {/* Glass Card */}
                    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-2xl">
                        {/* Scanline Effect */}
                        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[1] bg-[length:100%_2px,3px_100%] opacity-20" />

                        {/* Brand Header */}
                        <div className="relative z-10 mb-8 flex flex-col items-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                                className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-neon-cyan/20 to-blue-600/20 border border-white/10 shadow-[0_0_30px_rgba(0,243,255,0.3)]"
                            >
                                <Dumbbell className="h-10 w-10 text-neon-cyan drop-shadow-[0_0_10px_rgba(0,243,255,0.8)]" />
                            </motion.div>
                            <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
                                GYM PREMIUM
                            </h1>
                            <p className="mt-2 text-sm font-medium text-neon-cyan/80 tracking-widest uppercase">
                                Acceso Exclusivo
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleLogin} className="relative z-10 space-y-5">
                            {error && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-center text-xs font-bold text-red-400"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <div className="group relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 transition-colors group-focus-within:text-neon-cyan" />
                                <input
                                    type="email"
                                    placeholder="tucorreo@ejemplo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full rounded-xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 text-white placeholder-gray-600 outline-none transition-all focus:border-neon-cyan/50 focus:bg-white/10 focus:ring-1 focus:ring-neon-cyan/50"
                                />
                            </div>

                            <div className="group relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 transition-colors group-focus-within:text-neon-cyan" />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full rounded-xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 text-white placeholder-gray-600 outline-none transition-all focus:border-neon-cyan/50 focus:bg-white/10 focus:ring-1 focus:ring-neon-cyan/50"
                                />
                            </div>

                            <div className="flex justify-between w-full text-xs text-gray-400 mb-6">
                                <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                                    <input type="checkbox" className="rounded border-white/10 bg-white/5 text-neon-cyan focus:ring-neon-cyan/50" />
                                    Recordarme
                                </label>
                                <Link href="/forgot-password" className="hover:text-neon-cyan transition-colors">
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-neon-cyan py-4 text-lg font-bold text-black transition-all hover:bg-cyan-300 hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <>
                                        INGRESAR
                                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="relative z-[100] mt-8 flex flex-col items-center gap-4 text-xs pointer-events-auto">
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">¿No tienes cuenta?</p>
                            <button
                                type="button"
                                onClick={() => {
                                    console.log("Navigating to signup (v2)");
                                    router.push("/signup");
                                }}
                                /* BUILD_VERSION: 1.0.8 */
                                className="w-full py-5 rounded-xl border border-neon-cyan/50 text-neon-cyan font-bold uppercase tracking-widest text-center transition-all hover:bg-neon-cyan hover:text-black hover:shadow-[0_0_40px_rgba(0,243,255,0.6)] bg-transparent active:scale-[0.98] cursor-pointer relative z-[200]"
                            >
                                SOLICITAR MEMBRESÍA
                            </button>

                            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-2" />

                            <Link href="/admin" className="flex items-center gap-1 text-gray-500 hover:text-white transition-all p-2 relative z-[100]">
                                <Lock className="h-3 w-3" /> Acceso Staff
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
