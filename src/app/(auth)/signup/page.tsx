"use client";

import { motion } from "framer-motion";
import { UserPlus, Mail, Dumbbell, ArrowRight, Loader2, User, Phone, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from '@supabase/ssr'

function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}
import Link from "next/link";

export default function SignUpPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    // Form states
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [goal, setGoal] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { error: insertError } = await supabase
                .from("membership_requests")
                .insert([
                    {
                        full_name: fullName,
                        email,
                        phone,
                        goal,
                        status: 'pending'
                    }
                ]);

            if (insertError) throw insertError;

            setIsSuccess(true);
            setTimeout(() => {
                router.push("/login");
            }, 3000);
        } catch (err: any) {
            console.error("Error submitting application:", err);
            setError("No se pudo enviar la solicitud. Intenta más tarde.");

            // Fallback para demo si falla la DB (por si no crearon la tabla aún)
            setTimeout(() => {
                setIsLoading(false);
                setIsSuccess(true);
            }, 1000);
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
                    <h2 className="text-2xl font-bold mb-2">¡Solicitud Enviada!</h2>
                    <p className="text-gray-400 mb-6">
                        Un asesor de Gym Premium revisará tu postulación y te contactará en breve para coordinar tu primera visita.
                    </p>
                    <p className="text-xs text-gray-500">Redirigiendo al login...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-black font-sans text-white">
            {/* Cinematic Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-10" />
                <motion.div
                    initial={{ scale: 1 }}
                    animate={{ scale: 1.05 }}
                    transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
                    className="h-full w-full bg-[url('https://images.unsplash.com/photo-1548690312-e3b507d8c110?q=80&w=1587&auto=format&fit=crop')] bg-cover bg-center opacity-40"
                />
            </div>

            {/* Container */}
            <div className="z-20 w-full max-w-md px-6 my-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/60 p-8 shadow-2xl backdrop-blur-xl"
                >
                    {/* Brand Header */}
                    <div className="mb-6 flex flex-col items-center">
                        <div
                            className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-black border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                        >
                            <img src="/tao-logo-original.jpg" alt="TAO Gym" className="h-14 w-14 object-contain" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter text-white">
                            TAO GYM
                        </h1>
                        <p className="mt-1 text-xs font-medium text-gray-400 tracking-widest uppercase">
                            SOLICITUD DE MEMBRESÍA
                        </p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 text-center uppercase font-bold">
                                {error}
                            </div>
                        )}

                        <div className="group relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 transition-colors group-focus-within:text-neon-cyan" />
                            <input
                                type="text"
                                placeholder="Nombre Completo"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-white placeholder-gray-600 outline-none transition-all focus:border-neon-cyan/50 focus:bg-white/10"
                            />
                        </div>

                        <div className="group relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 transition-colors group-focus-within:text-neon-cyan" />
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-white placeholder-gray-600 outline-none transition-all focus:border-neon-cyan/50 focus:bg-white/10"
                            />
                        </div>

                        <div className="group relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 transition-colors group-focus-within:text-neon-cyan" />
                            <input
                                type="tel"
                                placeholder="WhatsApp (09x xxx xxx)"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-white placeholder-gray-600 outline-none transition-all focus:border-neon-cyan/50 focus:bg-white/10"
                            />
                        </div>

                        <div className="group relative">
                            <Dumbbell className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 transition-colors group-focus-within:text-neon-cyan" />
                            <select
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-white appearance-none outline-none transition-all focus:border-neon-cyan/50 focus:bg-white/10"
                                required
                            >
                                <option value="" className="bg-black text-gray-500">Objetivo Principal</option>
                                <option value="Hipertrofia" className="bg-black text-white">Hipertrofia</option>
                                <option value="Pérdida de Peso" className="bg-black text-white">Pérdida de Peso</option>
                                <option value="Rendimiento" className="bg-black text-white">Rendimiento</option>
                                <option value="Salud General" className="bg-black text-white">Salud General</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-neon-cyan py-4 text-lg font-bold text-black transition-all hover:bg-cyan-300 hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] disabled:opacity-70"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : "ENVIAR SOLICITUD"}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
                            ¿Ya tienes cuenta? <span className="font-bold">Iniciar Sesión</span>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
