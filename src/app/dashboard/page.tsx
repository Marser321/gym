import { createClient } from "@/lib/supabase/server";
import { QRCrystal } from "@/components/crystal/QRCrystal";
import { CrystalCard } from "@/components/crystal/CrystalCard";
import { ProgressRing } from "@/components/crystal/ProgressRing";
import { LevelProgress } from "@/components/gamification/LevelProgress";
import { StatCard } from "@/components/dashboard/StatCard";
import { CrystalAreaChart } from "@/components/admin/CrystalAreaChart";
import { HealthRadar } from "@/components/dashboard/HealthRadar";
import { Dumbbell, Trophy, Users, Activity, Clock, Calendar, MapPin, Timer, Sparkles } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-gray-400">Debes iniciar sesión para ver tu progreso.</p>
            </div>
        );
    }

    // Fetch user profile securely
    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (profileError && profileError.code !== 'PGRST116') {
        console.error("Error fetching profile:", profileError);
    }

    return (
        <div className="space-y-8">
            {/* Header & Welcome */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        Hola, <span className="text-neon-cyan text-glow">{profile?.full_name?.split(' ')[0] || 'Atleta'}</span>
                    </h1>
                    <p className="text-gray-400">Tu progreso de esta semana</p>
                </div>
            </div>

            {/* Evolution & Health Grid */}
            <div className="grid gap-6 md:grid-cols-3 h-[300px]">
                {/* Line Chart - Evolution */}
                <div className="md:col-span-2">
                    <CrystalCard className="p-6 h-full flex flex-col justify-between" hoverEffect>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-white">Consistencia Mensual</h3>
                                <p className="text-sm text-gray-400">Volumen de entrenamiento (kg totales)</p>
                            </div>
                            <div className="text-neon-cyan font-mono text-xs bg-neon-cyan/10 px-2 py-1 rounded border border-neon-cyan/20">
                                +12.5% vs Mes Anterior
                            </div>
                        </div>
                        <div className="flex-1 w-full">
                            <CrystalAreaChart
                                height={200}
                                color="#00f3ff"
                                data={[
                                    { label: 'Sem 1', value: 4500 },
                                    { label: 'Sem 2', value: 5200 },
                                    { label: 'Sem 3', value: 4800 },
                                    { label: 'Sem 4', value: 6100 },
                                    { label: 'Actual', value: 7500 },
                                ]}
                            />
                        </div>
                    </CrystalCard>
                </div>

                {/* Radar Chart - Health */}
                <div className="md:col-span-1">
                    <HealthRadar />
                </div>
            </div>

            {/* Key Stats Row */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatCard
                    title="Entrenamientos"
                    value="4"
                    icon={Dumbbell}
                    trend="+1"
                    trendUp={true}
                />
                <StatCard
                    title="Calorías"
                    value="2,450"
                    icon={Activity}
                    trend="12%"
                    trendUp={true}
                />
                <StatCard
                    title="Minutos"
                    value="180"
                    icon={Clock}
                />
                <StatCard
                    title="Nivel"
                    value="Oro"
                    icon={Trophy}
                    className="border-yellow-500/30 text-yellow-400"
                />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Column (2/3) */}
                <div className="space-y-6 md:col-span-2">
                    {/* Next Class / Session */}
                    <CrystalCard className="relative overflow-hidden p-6" hoverEffect>
                        <div className="flex items-start justify-between relative z-10">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-1">Próxima Sesión</h3>
                                <p className="text-2xl font-bold text-neon-cyan">CrossFit Avanzado</p>
                                <div className="mt-4 flex items-center gap-4 text-sm text-gray-300">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4 text-neon-cyan" />
                                        <span>Hoy, 18:00</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4 text-neon-cyan" />
                                        <span>Zona Funcional</span>
                                    </div>
                                </div>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-neon-cyan/20 flex items-center justify-center border border-neon-cyan/30">
                                <Timer className="h-6 w-6 text-neon-cyan" />
                            </div>
                        </div>
                        {/* Background Decor */}
                        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-neon-cyan/5 to-transparent skew-x-12" />
                    </CrystalCard>

                    {/* Quick Actions Grid */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Link href="/dashboard/nexus">
                            <CrystalCard className="flex items-center space-x-4 p-4 hover:bg-neon-cyan/5 cursor-pointer border-neon-cyan/30 shadow-[0_0_15px_rgba(0,243,255,0.1)] relative overflow-hidden" tilt>
                                <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/10 via-transparent to-transparent opacity-20" />
                                <div className="bg-deep-charcoal p-3 rounded-xl border border-neon-cyan h-12 w-12 flex items-center justify-center relative z-10">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-cyan opacity-20"></span>
                                    <Sparkles className="h-6 w-6 text-neon-cyan" />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="font-bold text-white tracking-wide italic uppercase">Nexus AI Coach</h3>
                                    <p className="text-xs text-neon-cyan">Calibrar Rutina Diaria &gt;&gt;</p>
                                </div>
                            </CrystalCard>
                        </Link>

                        <Link href="/dashboard/routines">
                            <CrystalCard className="flex items-center space-x-4 p-4 hover:bg-white/5 cursor-pointer h-full" tilt>
                                <div className="bg-neon-cyan/10 p-3 rounded-xl border border-neon-cyan/20">
                                    <Dumbbell className="h-6 w-6 text-neon-cyan" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Ir a Rutinas</h3>
                                    <p className="text-xs text-gray-400">Ver tu plan semanal</p>
                                </div>
                            </CrystalCard>
                        </Link>

                        <Link href="/dashboard/gym-match">
                            <CrystalCard className="flex items-center space-x-4 p-4 hover:bg-white/5 cursor-pointer h-full" tilt>
                                <div className="bg-pink-500/10 p-3 rounded-xl border border-pink-500/20">
                                    <Users className="h-6 w-6 text-pink-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Gym Match</h3>
                                    <p className="text-xs text-gray-400">Encuentra spotter</p>
                                </div>
                            </CrystalCard>
                        </Link>
                    </div>
                </div>

                {/* Sidebar Column (1/3) - QR & Levels */}
                <div className="space-y-6">
                    <div className="flex flex-col items-center justify-center p-4">
                        <QRCrystal
                            token={profile?.qr_code_token || user?.id || "demo-token"}
                            userName={profile?.full_name || "Miembro"}
                        />
                        <p className="mt-4 text-xs text-gray-500 text-center">Escanea para ingresar</p>
                    </div>

                    <LevelProgress
                        level={12}
                        xp={2450}
                        nextLevelXp={3000}
                        rankName="Oro"
                    />
                </div>
            </div>
        </div>
    );
}
