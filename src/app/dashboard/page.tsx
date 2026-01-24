import { createClient } from "@/lib/supabase/server";
import { QRCrystal } from "@/components/crystal/QRCrystal";
import { CrystalCard } from "@/components/crystal/CrystalCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { Dumbbell, Trophy, Activity, Clock, Timer, Sparkles, ChevronRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
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

    try {
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
                {/* Header with XP Progress */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight italic uppercase">
                            BIENVENIDO, <span className="text-neon-cyan text-glow">{safeProfile.full_name?.split(' ')[0] || 'ATLETA'}</span>
                        </h1>
                        <p className="text-gray-500 font-medium tracking-widest uppercase text-xs mt-1">Estatus: Premium • Nivel {safeProfile.level || 1}</p>
                    </div>

                    <div className="flex-1 max-w-md w-full">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-[10px] font-black text-neon-cyan uppercase tracking-widest">Progreso de Nivel</span>
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">{(safeProfile.xp || 0) % 1000} / 1000 XP</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                            <div
                                className="h-full bg-gradient-to-r from-neon-cyan to-blue-500 rounded-full shadow-[0_0_10px_rgba(0,243,255,0.5)] transition-all duration-1000"
                                style={{ width: `${((safeProfile.xp || 0) % 1000) / 10}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid gap-6 md:grid-cols-3">
                    {/* My Routines Shortcut (New) */}
                    <Link href="/dashboard/routines" className="md:col-span-2 group">
                        <CrystalCard className="p-8 flex flex-col justify-between h-full relative overflow-hidden group-hover:border-neon-cyan/50 transition-all" hoverEffect>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-2">
                                    <Dumbbell className="h-6 w-6 text-neon-cyan" />
                                    <h3 className="text-2xl font-black text-white uppercase italic">Mis Rutinas</h3>
                                </div>
                                <p className="text-sm text-gray-400 max-w-md">Accede a tus planes de entrenamiento asignados y comienza tu sesión de hoy.</p>

                                <div className="mt-8">
                                    <span className="inline-flex items-center gap-2 text-neon-cyan font-bold uppercase text-sm tracking-widest group-hover:translate-x-2 transition-transform">
                                        Ir a Entrenar <ChevronRight className="h-4 w-4" />
                                    </span>
                                </div>
                            </div>
                            <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Activity className="h-64 w-64 -mb-10 -mr-10 text-white" />
                            </div>
                        </CrystalCard>
                    </Link>

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
