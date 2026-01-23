"use client";

import { CrystalCard } from "@/components/crystal/CrystalCard";
import { CrystalButton } from "@/components/crystal/CrystalButton";
import { Search, Filter, MoreVertical, ShieldAlert, CheckCircle, Trash2, Loader2, User } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function MembersPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [members, setMembers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .order("full_name", { ascending: true });

            if (error) throw error;
            setMembers(data || []);
        } catch (err) {
            console.error("Error fetching members:", err);
            // Si falla o no hay tabla, mantenemos lista vacía
            setMembers([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de que quieres eliminar a este socio? Esta acción no se puede deshacer.")) return;

        try {
            // Nota: En Supabase, para borrar un auth.user necesitas el admin API o borrar por cascada si borras el perfil.
            // Aquí borramos el perfil. El trigger cascade lo manejaría si está configurado.
            const { error } = await supabase
                .from("profiles")
                .delete()
                .eq("id", id);

            if (error) throw error;

            setMembers(prev => prev.filter(m => m.id !== id));
        } catch (err) {
            console.error("Error deleting member:", err);
            alert("No se pudo eliminar el socio. Verifica los permisos de RLS.");
        }
    };

    const filteredMembers = members.filter(m =>
        m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.id.includes(searchTerm)
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-neon-cyan" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white uppercase tracking-tight italic">Gestión de Socios</h1>
                    <p className="text-gray-400 text-sm">Administra accesos y membresías activas</p>
                </div>
                <Link href="/admin/members/new">
                    <CrystalButton className="shadow-[0_0_20px_rgba(0,243,255,0.2)]">
                        + NUEVO SOCIO
                    </CrystalButton>
                </Link>
            </div>

            {/* Filters Bar */}
            <CrystalCard className="p-4 flex flex-col md:flex-row gap-4 items-center" hoverEffect={false}>
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o ID..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:outline-none focus:border-neon-cyan/50 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="flex items-center gap-2 px-6 py-2 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-widest text-gray-400 hover:bg-white/5 hover:text-white transition-all">
                    <Filter className="h-4 w-4" /> Filtros
                </button>
            </CrystalCard>

            {/* Members List */}
            <div className="grid gap-3">
                {filteredMembers.length === 0 ? (
                    <CrystalCard className="p-20 text-center opacity-40">
                        <p className="text-gray-400 uppercase tracking-widest text-sm">No se encontraron socios registrados</p>
                    </CrystalCard>
                ) : (
                    filteredMembers.map((member) => (
                        <CrystalCard key={member.id} className="p-4 hover:bg-white/5 transition-all flex flex-col md:flex-row items-center gap-4 group" hoverEffect={false}>
                            {/* Avatar & Info */}
                            <div className="flex items-center gap-4 flex-1 w-full">
                                <div className="relative h-14 w-14 rounded-full overflow-hidden border border-white/10 p-1">
                                    <div className="h-full w-full rounded-full bg-deep-charcoal flex items-center justify-center overflow-hidden">
                                        {member.avatar_url ? (
                                            <img src={member.avatar_url} alt={member.full_name} className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="h-6 w-6 text-gray-600" />
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-0.5">
                                    <h3 className="font-bold text-white uppercase tracking-tight">{member.full_name || 'Sin Nombre'}</h3>
                                    <div className="text-[10px] font-mono text-neon-cyan/70 tracking-tighter uppercase whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                                        ID: {member.id}
                                    </div>
                                    <div className="text-xs text-gray-500 font-medium">Nivel {member.level || 1} • {member.rank_name || 'Bronce'}</div>
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div className="flex flex-1 items-center gap-2 w-full md:w-auto justify-center md:justify-start">
                                <span className="flex items-center gap-1 px-4 py-1.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-black border border-green-500/20 uppercase tracking-widest">
                                    <CheckCircle className="h-3 w-3" /> ACTIVO
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 justify-end w-full md:w-auto">
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleDelete(member.id)}
                                        className="p-3 text-red-500/60 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                    <button className="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                                        <MoreVertical className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </CrystalCard>
                    ))
                )}
            </div>
        </div>
    );
}
