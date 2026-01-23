import { createClient } from "@/lib/supabase/server";
import { CrystalCard } from "@/components/crystal/CrystalCard";
import { CrystalButton } from "@/components/crystal/CrystalButton";
import { User, Mail, Phone, Calendar, ShieldCheck, Camera } from "lucide-react";

export default async function ProfilePage() {
    const supabase = await createClient();

    if (!supabase) return null;

    const { data: { user } } = await supabase.auth.getUser();

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-white tracking-tight">Mi Perfil</h1>
                <p className="text-gray-400">Gestiona tu información personal y preferencias.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
                {/* Profile Card */}
                <CrystalCard className="md:col-span-1 p-8 flex flex-col items-center text-center">
                    <div className="relative group mb-6">
                        <div className="h-32 w-32 rounded-full border-2 border-neon-cyan/30 p-1">
                            <div className="h-full w-full rounded-full bg-deep-charcoal border border-white/10 flex items-center justify-center overflow-hidden">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                                ) : (
                                    <User className="h-16 w-16 text-gray-700" />
                                )}
                            </div>
                        </div>
                        <button className="absolute bottom-0 right-0 h-10 w-10 flex items-center justify-center rounded-full bg-neon-cyan text-black hover:bg-cyan-300 transition-all border-4 border-black">
                            <Camera className="h-5 w-5" />
                        </button>
                    </div>
                    <h2 className="text-xl font-bold text-white">{profile?.full_name || "Miembro Premium"}</h2>
                    <p className="text-neon-cyan text-xs font-mono tracking-widest uppercase mt-1">Nivel 12 • Oro</p>
                </CrystalCard>

                {/* Form Section */}
                <CrystalCard className="md:col-span-2 p-8 space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nombre Completo</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <input
                                    type="text"
                                    defaultValue={profile?.full_name || ""}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-neon-cyan/50 outline-none"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Correo Electrónico</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <input
                                    type="email"
                                    value={user?.email || ""}
                                    readOnly
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-400 outline-none cursor-not-allowed"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Teléfono</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <input
                                    type="tel"
                                    defaultValue={profile?.phone || ""}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-neon-cyan/50 outline-none"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Miembro Desde</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <input
                                    type="text"
                                    value="Enero 2026"
                                    readOnly
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-400 outline-none cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-green-400">
                            <ShieldCheck className="h-4 w-4" />
                            <span>Cuenta Verificada</span>
                        </div>
                        <CrystalButton className="w-full sm:w-auto px-8">
                            GUARDAR CAMBIOS
                        </CrystalButton>
                    </div>
                </CrystalCard>
            </div>
        </div>
    );
}
