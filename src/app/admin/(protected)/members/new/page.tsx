"use client";

import { CrystalCard } from "@/components/crystal/CrystalCard";
import { CrystalButton } from "@/components/crystal/CrystalButton";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Star, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";

const PLANS = [
    { id: "mensual", name: "Mensual Básico", price: 2500, duration: "30 días", features: ["Acceso Gym", "Duchas"] },
    { id: "trimestral", name: "Trimestral Pro", price: 6500, duration: "90 días", features: ["Acceso Total", "Clases Grupales", "10% dto en tienda"], recommended: true },
    { id: "anual", name: "Anual Elite", price: 24000, duration: "365 días", features: ["Todo incluido", "Entrenador Personal (2x)", "Toalla y Batido"] },
];

export default function NewMemberPage() {
    const router = useRouter();
    const [selectedPlan, setSelectedPlan] = useState(PLANS[1].id);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        dni: ""
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Here we would call Supabase API
        console.log("Creating member:", { ...formData, plan: selectedPlan });

        // Simulate loading
        // then redirect
        alert("Socio registrado exitosamente. Credenciales enviadas por email.");
        router.push("/admin/members");
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/admin/members" className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Registrar Nuevo Socio</h1>
                    <p className="text-gray-400 text-sm">Ingreso de datos y asignación de plan</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Personal Data */}
                <div className="lg:col-span-2 space-y-6">
                    <CrystalCard className="p-6 space-y-6">
                        <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Datos Personales</h2>

                        <div className="flex items-start gap-6">
                            <div className="h-24 w-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors group relative overflow-hidden">
                                <Upload className="h-8 w-8 text-gray-400 group-hover:text-white" />
                                <span className="absolute bottom-2 text-[10px] text-gray-500">Subir Foto</span>
                            </div>
                            <div className="flex-1 space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Nombre Completo</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-neon-cyan/50"
                                        value={formData.fullName}
                                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">DNI / Pasaporte</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-neon-cyan/50"
                                            value={formData.dni}
                                            onChange={e => setFormData({ ...formData, dni: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Teléfono</label>
                                        <input
                                            type="tel"
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-neon-cyan/50"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Email (Usuario)</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-neon-cyan/50"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </CrystalCard>

                    {/* Submit Button (Mobile) */}
                    <div className="lg:hidden">
                        <CrystalButton type="submit" className="w-full">Confirmar Registro</CrystalButton>
                    </div>
                </div>

                {/* Right Column: Plan Selection */}
                <div className="space-y-6">
                    <CrystalCard className="p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Membresía</h2>

                        <div className="space-y-3">
                            {PLANS.map((plan) => (
                                <div
                                    key={plan.id}
                                    onClick={() => setSelectedPlan(plan.id)}
                                    className={`relative p-4 rounded-xl border cursor-pointer transition-all ${selectedPlan === plan.id ? 'bg-neon-cyan/10 border-neon-cyan shadow-[0_0_15px_rgba(0,243,255,0.15)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                >
                                    {plan.recommended && (
                                        <div className="absolute -top-3 right-4 px-2 py-0.5 bg-neon-purple text-[10px] font-bold text-white rounded-full">
                                            RECOMENDADO
                                        </div>
                                    )}
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className={`font-bold ${selectedPlan === plan.id ? 'text-white' : 'text-gray-300'}`}>{plan.name}</h3>
                                        {selectedPlan === plan.id && <Check className="h-4 w-4 text-neon-cyan" />}
                                    </div>
                                    <div className="text-xl font-bold text-white mb-2">
                                        ${plan.price.toLocaleString()} <span className="text-xs font-normal text-gray-500">/ {plan.duration}</span>
                                    </div>
                                    <ul className="text-xs text-gray-400 space-y-1">
                                        {plan.features.slice(0, 2).map((feat, i) => (
                                            <li key={i} className="flex items-center gap-1.5">
                                                <div className="h-1 w-1 rounded-full bg-gray-500" /> {feat}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-white/10">
                            <CrystalButton type="submit" className="w-full text-lg h-12">
                                Confirmar Registro
                            </CrystalButton>
                            <p className="text-center text-[10px] text-gray-500 mt-2">
                                Al confirmar, se enviará un email de bienvenida.
                            </p>
                        </div>
                    </CrystalCard>
                </div>

            </form>
        </div>
    );
}
