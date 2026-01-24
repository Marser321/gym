"use client";

import { CrystalCard } from "@/components/crystal/CrystalCard";
import { CrystalButton } from "@/components/crystal/CrystalButton";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Star, Check, ArrowLeft, Loader2, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const PLANS = [
    { id: "mensual", name: "Mensual Básico", price: 2500, duration: "30 días", features: ["Acceso Gym", "Duchas"] },
    { id: "trimestral", name: "Trimestral Pro", price: 6500, duration: "90 días", features: ["Acceso Total", "Clases Grupales", "10% dto en tienda"], recommended: true },
    { id: "anual", name: "Anual Elite", price: 24000, duration: "365 días", features: ["Todo incluido", "Entrenador Personal (2x)", "Toalla y Batido"] },
];

export default function NewMemberPage() {
    const router = useRouter();
    const supabase = createClient();
    const [selectedPlan, setSelectedPlan] = useState(PLANS[1].id);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        dni: "",
        id: "" // We will use this as a manual UUID for the profile record
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Generamos un ID si no hay uno (en producción esto vendría de Auth)
            const userId = crypto.randomUUID();
            const qrToken = encodeURIComponent(formData.fullName.substring(0, 3) + Math.floor(Math.random() * 10000));

            const { error } = await supabase
                .from("profiles")
                .insert([
                    {
                        id: userId,
                        full_name: formData.fullName,
                        phone: formData.phone,
                        dni: formData.dni,
                        qr_code_token: qrToken,
                        rank_name: selectedPlan === 'anual' ? 'Oro' : 'Bronce',
                        level: 1
                    }
                ]);

            if (error) throw error;

            alert("Socio registrado exitosamente en la base de datos.");
            router.push("/admin/members");
            router.refresh();
        } catch (err: any) {
            console.error("Error creating member:", err);
            alert("Error al registrar socio: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/members" className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-all border border-white/10">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-white uppercase tracking-tight italic">Registrar Nuevo Socio</h1>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Panel de Alta Directa</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Personal Data */}
                <div className="lg:col-span-2 space-y-6">
                    <CrystalCard className="p-8 space-y-8" hoverEffect={false}>
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                            <UserPlus className="h-5 w-5 text-neon-cyan" />
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">Información Personal</h2>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                            <div className="h-32 w-32 rounded-3xl bg-black/40 border border-white/10 flex flex-col items-center justify-center cursor-pointer hover:bg-neon-cyan/5 hover:border-neon-cyan/30 transition-all group shrink-0 relative">
                                <Upload className="h-8 w-8 text-gray-600 group-hover:text-neon-cyan transition-colors" />
                                <span className="mt-2 text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Avatar</span>
                            </div>

                            <div className="flex-1 w-full space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Nombre Completo</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej: Juan Perez"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-neon-cyan/50 focus:bg-white/10 transition-all"
                                        value={formData.fullName}
                                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">DNI / Documento</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="12.345.678"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-neon-cyan/50 focus:bg-white/10 transition-all"
                                            value={formData.dni}
                                            onChange={e => setFormData({ ...formData, dni: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">WhatsApp</label>
                                        <input
                                            type="tel"
                                            placeholder="099..."
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-neon-cyan/50 focus:bg-white/10 transition-all"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="usuario@ejemplo.com"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-neon-cyan/50 focus:bg-white/10 transition-all"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </CrystalCard>
                </div>

                {/* Right Column: Plan Selection */}
                <div className="space-y-6">
                    <CrystalCard className="p-8 space-y-6 h-full" hoverEffect={false}>
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                            <Star className="h-5 w-5 text-neon-cyan" />
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">Plan de Socio</h2>
                        </div>

                        <div className="space-y-4">
                            {PLANS.map((plan) => (
                                <div
                                    key={plan.id}
                                    onClick={() => setSelectedPlan(plan.id)}
                                    className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${selectedPlan === plan.id ? 'bg-neon-cyan/10 border-neon-cyan shadow-[0_0_20px_rgba(0,243,255,0.1)]' : 'bg-black/20 border-white/5 hover:border-white/20'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className={`text-xs font-black uppercase tracking-widest ${selectedPlan === plan.id ? 'text-neon-cyan' : 'text-gray-500'}`}>{plan.name}</h3>
                                        {selectedPlan === plan.id && <Check className="h-4 w-4 text-neon-cyan" />}
                                    </div>
                                    <div className="text-2xl font-black text-white italic">
                                        ${plan.price.toLocaleString()} <span className="text-[10px] font-normal text-gray-500 tracking-normal opacity-60">/ {plan.duration}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-8 space-y-4">
                            <CrystalButton
                                type="submit"
                                className="w-full text-sm font-black tracking-widest h-14 shadow-[0_0_30px_rgba(0,243,255,0.2)]"
                                isLoading={isLoading}
                            >
                                ACTIVAR SOCIO
                            </CrystalButton>
                            <p className="text-center text-[10px] text-gray-500 uppercase font-medium leading-relaxed">
                                Al confirmar, se creará el perfil del socio y se activará su código QR de acceso.
                            </p>
                        </div>
                    </CrystalCard>
                </div>

            </form>
        </div>
    );
}
