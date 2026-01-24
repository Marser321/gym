import { createClient } from "@/lib/supabase/server";
import { QRCrystal } from "@/components/crystal/QRCrystal";
import { CrystalCard } from "@/components/crystal/CrystalCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { Dumbbell, Trophy, Activity, Clock, Timer, Sparkles, ChevronRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    try {
        const supabase = await createClient();

        if (!supabase) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 glass-card rounded-3xl border border-red-500/20 my-10 max-w-2xl mx-auto">
                    <Activity className="h-12 w-12 text-red-500 mb-6" />
                    <h2 className="text-2xl font-bold text-white mb-2">Error de Configuración</h2>
                    <p className="text-gray-400">Faltan las variables de entorno de Supabase en Vercel.</p>
                </div>
            );
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            redirect("/login");
        }

        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        // Fail gracefully if profile doesn't exist yet (unlikely but possible)
        const safeProfile = profile || {
            full_name: user.email?.split('@')[0] || 'Atleta',
            level: 1,
            rank_name: 'Bronce',
            qr_code_token: user.id
        };

        if (profileError && profileError.code !== 'PGRST116') {
            console.error("Dashboard Profile Error:", profileError);
        }

        // Continue with the rest of the component...
        // I need to return the JSX here, so I will reconstruct the return statement inside the try block 
        // or assign variables to use outside.
        // To make this cleaner with the tool's limitations, I'll rewrite the component start to capture variables.

        return (
            <div className="space-y-8 pb-24">
                {/* Header */}
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight italic uppercase">
                        BIENVENIDO, <span className="text-neon-cyan text-glow">{safeProfile.full_name?.split(' ')[0] || 'ATLETA'}</span>
                    </h1>
                    <p className="text-gray-500 font-medium tracking-widest uppercase text-xs mt-1">Estatus: Premium • Nivel {safeProfile.level || 1}</p>
                </div>

                {/* Main Grid */}
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Evolution Summary (Replacement for Chart to test stability) */}
                    <CrystalCard className="md:col-span-2 p-8 flex flex-col justify-between overflow-hidden relative" hoverEffect>
                        <div className="relative z-10">
                            <h3 className="text-xl font-bold text-white mb-1">Tu Evolución</h3>
                            <p className="text-sm text-gray-400">Has superado el 85% de tus objetivos este mes.</p>

                            <div className="mt-8 flex gap-8">
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Carga Total</p>
                                    <p className="text-2xl font-black text-white">12,450 <span className="text-xs text-gray-500 font-normal">KG</span></p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Frecuencia</p>
                                    <p className="text-2xl font-black text-white">4.2 <span className="text-xs text-gray-500 font-normal">D/S</span></p>
                                </div>
                            </div>
                        </div>
                        <div className="absolute right-0 bottom-0 opacity-10">
                            <Activity className="h-64 w-64 -mb-10 -mr-10 text-neon-cyan" />
                        </div>
                    </CrystalCard>

                    {/* QR Section */}
                    <div className="md:col-span-1">
                        <CrystalCard className="p-6 flex flex-col items-center justify-center h-full" tilt>
                            <QRCrystal
                                token={safeProfile.qr_code_token || user.id}
                                userName={safeProfile.full_name || "Miembro"}
                            />
                        </CrystalCard>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Entrenamientos" value="18" icon={Dumbbell} trend="+3" trendUp />
                    <StatCard title="Calorías" value="4.2k" icon={Activity} trend="12%" trendUp />
                    <StatCard title="Tiempo" value="24h" icon={Clock} />
                    <StatCard title="Rango" value={safeProfile.rank_name || "BRONCE"} icon={Trophy} />
                </div>

                {/* Actions */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Link href="/dashboard/nexus">
                        <CrystalCard className="p-6 border-neon-cyan/30 bg-neon-cyan/5 group hover:bg-neon-cyan/10 transition-all">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-neon-cyan text-black flex items-center justify-center shadow-[0_0_15px_rgba(0,243,255,0.4)]">
                                        <Sparkles className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white uppercase tracking-tight">Nexus AI Coach</h4>
                                        <p className="text-xs text-gray-400">Recalibrar rutina biomecánica</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-neon-cyan group-hover:translate-x-1 transition-transform" />
                            </div>
                        </CrystalCard>
                    </Link>

                    <Link href="/dashboard/routines">
                        <CrystalCard className="p-6 group hover:bg-white/5 transition-all">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                                        <Timer className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white uppercase tracking-tight">Ver Rutinas</h4>
                                        <p className="text-xs text-gray-400">Tu plan de entrenamiento semanal</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-500 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </CrystalCard>
                    </Link>
                </div>
            </div>
        );

    } catch (e: any) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="max-w-xl w-full bg-red-900/20 border border-red-500/50 rounded-2xl p-8">
                    <h2 className="text-xl font-bold text-red-500 mb-4">Error Crítico del Sistema</h2>
                    <p className="text-white mb-4">Ocurrió un error al cargar el dashboard.</p>
                    <div className="bg-black/50 p-4 rounded-lg overflow-auto max-h-64">
                        <pre className="text-xs text-red-300 font-mono whitespace-pre-wrap">
                            {e?.message || JSON.stringify(e, null, 2)}
                        </pre>
                    </div>
                </div>
            </div>
        );
    }
}
