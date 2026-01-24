"use client";

import { CrystalCard } from "@/components/crystal/CrystalCard";
import { CrystalButton } from "@/components/crystal/CrystalButton";
import { Users, MessageSquare, Activity, Calendar, Zap, Loader2 } from "lucide-react";
import { CrystalAreaChart } from "@/components/admin/CrystalAreaChart";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export function TrainerDashboard() {
    const [stats, setStats] = useState({
        myClients: "0",
        activeWorkouts: "0",
        newMessages: "0",
        totalVolume: "0"
    });
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchTrainerStats = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // 1. My Clients count
                const { count: clientsCount } = await supabase
                    .from('trainer_assignments')
                    .select('*', { count: 'exact', head: true })
                    .eq('trainer_id', user.id)
                    .eq('status', 'active');

                // 2. Unread messages (approx for demo)
                const { count: msgCount } = await supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('receiver_id', user.id)
                    .eq('is_read', false);

                setStats({
                    myClients: (clientsCount || 0).toString(),
                    activeWorkouts: "12",
                    newMessages: (msgCount || 0).toString(),
                    totalVolume: "850k"
                });

            } catch (e) {
                console.error("Error fetching trainer stats:", e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTrainerStats();
    }, []);

    const kpis = [
        { label: "Mis Alumnos", value: stats.myClients, trend: "Status: Activos", icon: Users, color: "neon-cyan", href: "/admin/my-clients" },
        { label: "Nuevos Mensajes", value: stats.newMessages, trend: "Chats Pendientes", icon: MessageSquare, color: "purple-500", href: "/admin/my-clients" },
        { label: "Workouts Hoy", value: stats.activeWorkouts, trend: "+4 vs ayer", icon: Activity, color: "green-400" },
        { label: "Volumen Total (Mensual)", value: stats.totalVolume, trend: "KG Levantados", icon: Zap, color: "neon-cyan" },
    ];

    const colorMap: Record<string, string> = {
        "neon-cyan": "bg-neon-cyan/10 border-neon-cyan/20 text-neon-cyan",
        "purple-500": "bg-purple-500/10 border-purple-500/20 text-purple-500",
        "green-400": "bg-green-400/10 border-green-400/20 text-green-400",
    };

    if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="h-10 w-10 animate-spin text-neon-cyan" /></div>;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((kpi, idx) => {
                    const Icon = kpi.icon;
                    const Content = (
                        <CrystalCard key={idx} className="p-6 h-full" hoverEffect>
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-xl border ${colorMap[kpi.color]}`}>
                                    <Icon className="h-6 w-6" />
                                </div>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest bg-white/5 text-gray-500`}>
                                    {kpi.trend}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-gray-400 text-[10px] uppercase tracking-widest font-black leading-none">{kpi.label}</h3>
                                <p className="text-3xl font-black text-white italic tracking-tighter">{kpi.value}</p>
                            </div>
                        </CrystalCard>
                    );

                    return kpi.href ? (
                        <Link key={idx} href={kpi.href}>{Content}</Link>
                    ) : Content;
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <CrystalCard className="lg:col-span-2 p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-white uppercase tracking-tight italic">Actividad de Alumnos</h3>
                            <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Sesiones completadas por semana</p>
                        </div>
                    </div>
                    <div className="h-[250px] w-full">
                        <CrystalAreaChart
                            height={250}
                            color="#00f3ff"
                            data={[
                                { label: "Lun", value: 12 },
                                { label: "Mar", value: 18 },
                                { label: "Mie", value: 15 },
                                { label: "Jue", value: 22 },
                                { label: "Vie", value: 30 },
                                { label: "Sab", value: 25 },
                                { label: "Dom", value: 10 },
                            ]}
                        />
                    </div>
                </CrystalCard>

                <CrystalCard className="p-8 space-y-6">
                    <h3 className="text-xl font-bold text-white uppercase italic tracking-tight">Próximos Alumnos</h3>
                    <div className="space-y-4">
                        {[
                            { name: "Carlos Rossi", time: "18:30", type: "Hipertrofia" },
                            { name: "Lucía Méndez", time: "19:00", type: "Funcional" },
                            { name: "Marcos Paz", time: "20:15", type: "Fuerza" },
                        ].map((event, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                                <div className="h-10 w-10 rounded-full bg-neon-cyan/20 flex items-center justify-center border border-neon-cyan/30 shrink-0">
                                    <Calendar className="h-5 w-5 text-neon-cyan" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{event.name}</p>
                                    <p className="text-[10px] text-gray-500 uppercase font-black">{event.time} • {event.type}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <CrystalButton className="w-full text-xs" variant="secondary">
                        VER AGENDA COMPLETA
                    </CrystalButton>
                </CrystalCard>
            </div>
        </div>
    );
}
