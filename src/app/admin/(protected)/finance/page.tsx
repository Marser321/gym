"use client";

import { CrystalCard } from "@/components/crystal/CrystalCard";
import { DollarSign, TrendingUp, CreditCard, Calendar, Download } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const DATA = [
    { name: "Ene", income: 4200 },
    { name: "Feb", income: 3800 },
    { name: "Mar", income: 5100 },
    { name: "Abr", income: 4800 },
    { name: "May", income: 6400 },
    { name: "Jun", income: 7200 },
];

const TRANSACTIONS = [
    { id: 1, user: "Ana Gonzalez", plan: "Anual Premium", amount: "$450.00", date: "23 Ene 2026", status: "completed" },
    { id: 2, user: "Carlos Perez", plan: "Mensual", amount: "$45.00", date: "23 Ene 2026", status: "completed" },
    { id: 3, user: "Roberto Diaz", plan: "Clase Suelta", amount: "$15.00", date: "22 Ene 2026", status: "completed" },
    { id: 4, user: "Maria Rodriguez", plan: "Mensual", amount: "$45.00", date: "22 Ene 2026", status: "pending" },
];

export default function FinancePage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Finanzas</h1>
                    <p className="text-gray-400 text-sm">Resumen de ingresos y movimientos</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/10">
                    <Download className="h-4 w-4" /> Exportar Reporte
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <CrystalCard className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-400 mb-1">Ingresos Totales (Mes)</p>
                            <h3 className="text-3xl font-bold text-white">$7,200</h3>
                        </div>
                        <div className="p-3 rounded-xl bg-neon-cyan/10 text-neon-cyan">
                            <DollarSign className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-sm text-green-400">
                        <TrendingUp className="h-3 w-3" />
                        <span>+12.5% vs mes anterior</span>
                    </div>
                </CrystalCard>

                <CrystalCard className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-400 mb-1">Suscripciones Activas</p>
                            <h3 className="text-3xl font-bold text-white">142</h3>
                        </div>
                        <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                            <CreditCard className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-sm text-green-400">
                        <TrendingUp className="h-3 w-3" />
                        <span>+8 nuevos esta semana</span>
                    </div>
                </CrystalCard>

                <CrystalCard className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-400 mb-1">Pagos Pendientes</p>
                            <h3 className="text-3xl font-bold text-white">$135</h3>
                        </div>
                        <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400">
                            <Calendar className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-500">
                        3 recordatorios enviados
                    </div>
                </CrystalCard>
            </div>

            {/* Chart Section */}
            <CrystalCard className="p-6">
                <h3 className="text-lg font-bold text-white mb-6">Evolución de Ingresos</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={DATA}>
                            <defs>
                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#00f3ff" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="name"
                                stroke="#666"
                                tick={{ fill: '#666' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                stroke="#666"
                                tick={{ fill: '#666' }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0F1115', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                                itemStyle={{ color: '#00f3ff' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="income"
                                stroke="#00f3ff"
                                fillOpacity={1}
                                fill="url(#colorIncome)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CrystalCard>

            {/* Recent Transactions */}
            <CrystalCard className="p-6 overflow-hidden">
                <h3 className="text-lg font-bold text-white mb-4">Transacciones Recientes</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 text-gray-400 text-sm">
                                <th className="pb-4 font-medium">Usuario</th>
                                <th className="pb-4 font-medium">Plan</th>
                                <th className="pb-4 font-medium">Fecha</th>
                                <th className="pb-4 font-medium">Monto</th>
                                <th className="pb-4 font-medium text-right">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {TRANSACTIONS.map((tx) => (
                                <tr key={tx.id} className="group hover:bg-white/5 transition-colors">
                                    <td className="py-4 text-white font-medium">{tx.user}</td>
                                    <td className="py-4 text-gray-400">{tx.plan}</td>
                                    <td className="py-4 text-gray-400">{tx.date}</td>
                                    <td className="py-4 text-white font-bold">{tx.amount}</td>
                                    <td className="py-4 text-right">
                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${tx.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'}`}>
                                            {tx.status === 'completed' ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CrystalCard>
        </div>
    );
}
