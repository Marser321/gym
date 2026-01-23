"use client";

import { CrystalCard } from "@/components/crystal/CrystalCard";
import { DollarSign, Users, UserPlus, TrendingUp, Loader2 } from "lucide-react";
import { CrystalAreaChart } from "@/components/admin/CrystalAreaChart";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({
        revenue: "$42,500",
        activeMembers: "342",
        pendingApplications: "0",
        checkins: "115"
    });
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Count pending applications
                const { count, error } = await supabase
                    .from('membership_requests')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'pending');

                if (!error && count !== null) {
                    setStats(prev => ({ ...prev, pendingApplications: count.toString() }));
                }
            } catch (e) {
                console.error("Error fetching admin stats:", e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    const kpis = [
        { label: "Ingresos Mensuales", value: stats.revenue, trend: "+12%", icon: DollarSign, color: "neon-cyan" },
        { label: "Socios Activos", value: stats.activeMembers, trend: "+5%", icon: Users, color: "purple-500" },
        {
            label: "Solicitudes Pendientes",
            value: stats.pendingApplications,
            trend: "Ver todas",
            href: "/admin/applications",
            icon: UserPlus,
            color: stats.pendingApplications !== "0" ? "orange-400" : "green-400"
        },
        { label: "Check-ins Hoy", value: stats.checkins, trend: "+18%", icon: TrendingUp, color: "neon-cyan" },
    ];

    const colorMap: Record<string, string> = {
        "neon-cyan": "bg-neon-cyan/10 border-neon-cyan/20 text-neon-cyan",
        "purple-500": "bg-purple-500/10 border-purple-500/20 text-purple-500",
        "green-400": "bg-green-400/10 border-green-400/20 text-green-400",
        "orange-400": "bg-orange-400/10 border-orange-400/20 text-orange-400",
    };

    return (
        <div className="space-y-8">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((kpi, idx) => {
                    const Icon = kpi.icon;
                    const Content = (
                        <CrystalCard key={idx} className="p-6 h-full" hoverEffect>
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-xl border ${colorMap[kpi.color]}`}>
                                    <Icon className="h-6 w-6" />
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest ${kpi.trend.startsWith('+') ? 'bg-green-500/10 text-green-400' : 'bg-neon-cyan/10 text-neon-cyan'}`}>
                                    {kpi.trend}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-gray-400 text-xs uppercase tracking-wider font-bold">{kpi.label}</h3>
                                <p className="text-3xl font-black text-white italic">{kpi.value}</p>
                            </div>
                        </CrystalCard>
                    );

                    return kpi.href ? (
                        <Link key={idx} href={kpi.href}>{Content}</Link>
                    ) : Content;
                })}
            </div>

            {/* Main Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <CrystalCard className="lg:col-span-2 p-8 min-h-[400px]">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Evolución Comercial</h3>
                            <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Ingresos netos vs Inscripciones</p>
                        </div>
                        <div className="flex gap-2 font-mono text-[10px]">
                            <span className="text-neon-cyan border border-neon-cyan/30 px-2 py-1 rounded bg-neon-cyan/5">Q1 2026</span>
                        </div>
                    </div>
                    <div className="h-[300px] w-full flex items-end">
                        <CrystalAreaChart
                            height={300}
                            color="#00f3ff"
                            data={[
                                { label: "Ago", value: 3500 },
                                { label: "Sep", value: 3800 },
                                { label: "Oct", value: 3200 },
                                { label: "Nov", value: 4100 },
                                { label: "Dic", value: 4500 },
                                { label: "Ene", value: 5200 },
                            ]}
                        />
                    </div>
                </CrystalCard>

                <CrystalCard className="p-8">
                    <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-tight italic">Top Planes</h3>
                    <div className="space-y-4">
                        {[
                            { name: 'Elite Anual', pct: 45, color: 'neon-cyan' },
                            { name: 'Mensual Full', pct: 30, color: 'purple-500' },
                            { name: 'Pase 10', pct: 15, color: 'green-400' },
                            { name: 'Otros', pct: 10, color: 'gray-500' }
                        ].map((plan, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
                                    <span>{plan.name}</span>
                                    <span className="text-white">{plan.pct}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full bg-${plan.color.split('-')[0]}-500`}
                                        style={{ width: `${plan.pct}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 p-4 rounded-2xl bg-neon-cyan/5 border border-neon-cyan/10">
                        <p className="text-[10px] text-neon-cyan uppercase font-bold tracking-widest mb-1 italic">Tip del Coach AI:</p>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            La retención en planes "Elite Anual" subió un 12%. Recomendado: Lanzar promo de referidos.
                        </p>
                    </div>
                </CrystalCard>
            </div>
        </div>
    );
}
