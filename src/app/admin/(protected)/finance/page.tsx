"use client";

import { CrystalCard } from "@/components/crystal/CrystalCard";
import { CrystalButton } from "@/components/crystal/CrystalButton";
import { DollarSign, TrendingUp, CreditCard, Calendar, Download, Plus, Loader2, User, Search, X, Check } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const CHART_DATA = [
    { name: "Ene", income: 4200 },
    { name: "Feb", income: 3800 },
    { name: "Mar", income: 5100 },
    { name: "Abr", income: 4800 },
    { name: "May", income: 6400 },
    { name: "Jun", income: 7200 },
];

export default function FinancePage() {
    const [payments, setPayments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [members, setMembers] = useState<any[]>([]);
    const [selectedMember, setSelectedMember] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const supabase = createClient();

    // Form states
    const [amount, setAmount] = useState("");
    const [plan, setPlan] = useState("Mensual Básico");
    const [method, setMethod] = useState("efectivo");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch payments with member info
            const { data: payData, error: payError } = await supabase
                .from("payments")
                .select("*, profiles(full_name)")
                .order("created_at", { ascending: false });

            if (!payError) setPayments(payData || []);

            // Fetch members for the selection dropdown
            const { data: memData } = await supabase
                .from("profiles")
                .select("id, full_name")
                .order("full_name");

            if (memData) setMembers(memData);
        } catch (err) {
            console.error("Error fetching finance data:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMember) return alert("Selecciona un socio");

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from("payments")
                .insert([{
                    member_id: selectedMember.id,
                    amount: parseFloat(amount),
                    plan_name: plan,
                    payment_method: method,
                    status: 'completed'
                }]);

            if (error) throw error;

            setIsModalOpen(false);
            fetchData();
            // Reset form
            setSelectedMember(null);
            setAmount("");
        } catch (err: any) {
            alert("Error al registrar: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    // KPI Calculations
    const monthlyIncome = payments
        .filter(p => new Date(p.created_at).getMonth() === new Date().getMonth())
        .reduce((sum, p) => sum + p.amount, 0);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight italic">Control Financiero</h1>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-1">Gestión de ingresos y suscripciones</p>
                </div>
                <div className="flex gap-4">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/5 text-xs font-bold uppercase tracking-widest">
                        <Download className="h-4 w-4" /> Exportar
                    </button>
                    <CrystalButton onClick={() => setIsModalOpen(true)} className="shadow-[0_0_20px_rgba(0,243,255,0.2)]">
                        <Plus className="h-4 w-4 mr-2" /> REGISTRAR PAGO
                    </CrystalButton>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white">
                <CrystalCard className="p-8 group" hoverEffect>
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Ingresos Mes</p>
                            <h3 className="text-4xl font-black italic tracking-tighter">${monthlyIncome.toLocaleString() || '0'}</h3>
                        </div>
                        <div className="p-4 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan shadow-[0_0_15px_rgba(0,243,255,0.1)] group-hover:scale-110 transition-transform">
                            <DollarSign className="h-6 w-6" />
                        </div>
                    </div>
                </CrystalCard>

                <CrystalCard className="p-8 group" hoverEffect>
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Suscripciones Activas</p>
                            <h3 className="text-4xl font-black italic tracking-tighter">{members.length}</h3>
                        </div>
                        <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
                            <CreditCard className="h-6 w-6" />
                        </div>
                    </div>
                </CrystalCard>

                <CrystalCard className="p-8 group" hoverEffect>
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Ticket Promedio</p>
                            <h3 className="text-4xl font-black italic tracking-tighter">
                                ${payments.length > 0 ? (monthlyIncome / (payments.length || 1)).toFixed(0) : '0'}
                            </h3>
                        </div>
                        <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 group-hover:scale-110 transition-transform">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                    </div>
                </CrystalCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-white">
                {/* Chart Section */}
                <CrystalCard className="lg:col-span-2 p-8 overflow-hidden relative" hoverEffect={false}>
                    <div className="relative z-10 space-y-8">
                        <div>
                            <h3 className="text-xl font-bold uppercase tracking-tight">Evolución Comercial</h3>
                            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">Ventas brutas acumuladas por mes</p>
                        </div>

                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={CHART_DATA}>
                                    <defs>
                                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#00f3ff" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#444"
                                        tick={{ fill: '#666', fontSize: 10, fontWeight: 'bold' }}
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#000', borderRadius: '12px', border: '1px solid rgba(0,243,255,0.2)', padding: '12px' }}
                                        labelStyle={{ color: '#00f3ff', fontWeight: 'bold', marginBottom: '4px' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="income"
                                        stroke="#00f3ff"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorIncome)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </CrystalCard>

                {/* Recent Transactions List */}
                <CrystalCard className="p-8" hoverEffect={false}>
                    <h3 className="text-xl font-bold uppercase tracking-tight mb-8 italic">Últimos Pagos</h3>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full py-10 opacity-30">
                            <Loader2 className="h-8 w-8 animate-spin text-neon-cyan" />
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-10 opacity-30">
                            <CreditCard className="h-10 w-10 mb-4" />
                            <p className="text-xs font-black uppercase tracking-widest text-center">Sin transacciones</p>
                        </div>
                    ) : (
                        <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {payments.map((tx) => (
                                <div key={tx.id} className="group p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-neon-cyan/20 transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="space-y-1">
                                            <h4 className="text-xs font-black text-white uppercase tracking-tight group-hover:text-neon-cyan transition-colors truncate max-w-[120px]">
                                                {tx.profiles?.full_name || 'Anónimo'}
                                            </h4>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                                                {tx.plan_name}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-white italic">${tx.amount}</p>
                                            <p className="text-[9px] text-gray-600 font-mono uppercase mt-1">
                                                {new Date(tx.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`h-1.5 w-1.5 rounded-full ${tx.status === 'completed' ? 'bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.5)]' : 'bg-orange-400'}`} />
                                        <span className="text-[9px] font-black uppercase tracking-[0.1em] text-gray-500">
                                            {tx.payment_method}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CrystalCard>
            </div>

            {/* Modal para Registrar Pago */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
                    <CrystalCard className="w-full max-w-lg p-8 space-y-8 relative shadow-[0_0_50px_rgba(0,0,0,0.5)] border-white/20">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>

                        <div className="text-center space-y-1">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">Registrar Cobro</h2>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Asignar pago a un socio existente</p>
                        </div>

                        <form onSubmit={handleRecordPayment} className="space-y-6">
                            {/* Buscar Socio */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Seleccionar Socio</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
                                    <select
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-12 text-sm text-white appearance-none outline-none focus:border-neon-cyan/50 focus:bg-white/10 transition-all font-bold"
                                        onChange={(e) => setSelectedMember(members.find(m => m.id === e.target.value))}
                                    >
                                        <option value="" className="bg-black">Seleccionar...</option>
                                        {members.map(m => (
                                            <option key={m.id} value={m.id} className="bg-black text-white">{m.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Monto ($)</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="Ej: 2500"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white outline-none focus:border-neon-cyan/50 focus:bg-white/10 transition-all font-bold"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Método</label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white outline-none focus:border-neon-cyan/50 focus:bg-white/10 transition-all font-bold uppercase"
                                        value={method}
                                        onChange={(e) => setMethod(e.target.value)}
                                    >
                                        <option value="efectivo" className="bg-black">Efectivo</option>
                                        <option value="transferencia" className="bg-black">Transferencia</option>
                                        <option value="debito" className="bg-black">Débito</option>
                                        <option value="credito" className="bg-black">Crédito</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Plan Relacionado</label>
                                <select
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white outline-none focus:border-neon-cyan/50 focus:bg-white/10 transition-all font-bold uppercase"
                                    value={plan}
                                    onChange={(e) => setPlan(e.target.value)}
                                >
                                    <option value="Mensual Básico" className="bg-black">Mensual Básico</option>
                                    <option value="Trimestral Pro" className="bg-black">Trimestral Pro</option>
                                    <option value="Anual Elite" className="bg-black">Anual Elite</option>
                                    <option value="Pase Diario" className="bg-black">Pase Diario</option>
                                </select>
                            </div>

                            <CrystalButton
                                type="submit"
                                className="w-full h-14 font-black tracking-widest shadow-[0_0_30px_rgba(0,243,255,0.2)]"
                                isLoading={isSaving}
                            >
                                <Check className="h-5 w-5 mr-4" />
                                CONFIRMAR COBRO
                            </CrystalButton>
                        </form>
                    </CrystalCard>
                </div>
            )}
        </div>
    );
}
