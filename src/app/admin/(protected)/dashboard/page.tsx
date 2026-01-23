import { CrystalCard } from "@/components/crystal/CrystalCard";
import { DollarSign, Users, UserPlus, TrendingUp } from "lucide-react";
import { CrystalAreaChart } from "@/components/admin/CrystalAreaChart";

export default function AdminDashboardPage() {
    const kpis = [
        { label: "Ingresos Mensuales", value: "$42,500", trend: "+12%", icon: DollarSign, color: "neon-cyan" },
        { label: "Socios Activos", value: "342", trend: "+5%", icon: Users, color: "purple-500" },
        { label: "Nuevos (Este mes)", value: "28", trend: "-2%", icon: UserPlus, color: "green-400" },
        { label: "Check-ins Hoy", value: "115", trend: "+18%", icon: TrendingUp, color: "orange-400" },
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
                    return (
                        <CrystalCard key={idx} className="p-6" hoverEffect>
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-xl border ${colorMap[kpi.color]}`}>
                                    <Icon className="h-6 w-6" />
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${kpi.trend.startsWith('+') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {kpi.trend}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-gray-400 text-sm">{kpi.label}</h3>
                                <p className="text-2xl font-bold text-white">{kpi.value}</p>
                            </div>
                        </CrystalCard>
                    );
                })}
            </div>

            {/* Main Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <CrystalCard className="lg:col-span-2 p-6 min-h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white">Evolución de Ingresos</h3>
                        <div className="flex gap-2">
                            <span className="text-xs font-bold text-neon-cyan bg-neon-cyan/10 px-2 py-1 rounded border border-neon-cyan/20">Año Actual</span>
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

                <CrystalCard className="p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Membresías</h3>
                    <div className="space-y-4">
                        {['Premium Anual', 'Mensual Básico', 'Pase Diario'].map((plan, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                <span className="text-gray-300">{plan}</span>
                                <span className="font-mono text-neon-cyan">{(30 - i * 5)}%</span>
                            </div>
                        ))}
                    </div>
                </CrystalCard>
            </div>
        </div>
    );
}
