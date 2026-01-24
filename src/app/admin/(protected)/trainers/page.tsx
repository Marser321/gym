"use client";

import { CrystalCard } from "@/components/crystal/CrystalCard";
import { CrystalButton } from "@/components/crystal/CrystalButton";
import { Search, UserCheck, Users, MoreVertical, Loader2, User, Star, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function TrainersPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [trainers, setTrainers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchTrainers();
    }, []);

    const fetchTrainers = async () => {
        setIsLoading(true);
        try {
            // Fetch trainers and count their assignments
            const { data, error } = await supabase
                .from("profiles")
                .select(`
                    *,
                    clients:trainer_assignments(count)
                `)
                .eq("role", "trainer")
                .order("full_name", { ascending: true });

            if (error) throw error;
            setTrainers(data || []);
        } catch (err) {
            console.error("Error fetching trainers:", err);
            setTrainers([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDemote = async (id: string) => {
        if (!confirm("¿Estás seguro de quitar el rango de Entrenador a este usuario? Seguirá siendo un socio regular.")) return;

        try {
            const { error } = await supabase
                .from("profiles")
                .update({ role: "member" })
                .eq("id", id);

            if (error) throw error;
            setTrainers(prev => prev.filter(t => t.id !== id));
        } catch (err) {
            console.error("Error demoting trainer:", err);
            alert("No se pudo degradar al entrenador.");
        }
    };

    const filteredTrainers = trainers.filter(t =>
        t.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
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
                    <h1 className="text-2xl font-bold text-white uppercase tracking-tight italic">Gestión de Entrenadores</h1>
                    <p className="text-gray-400 text-sm">Administra el staff técnico y sus asignaciones de clientes</p>
                </div>
                <Link href="/admin/trainers/promote">
                    <CrystalButton className="gap-2">
                        <UserCheck className="h-4 w-4" /> PROMOCIONAR ENTRENADOR
                    </CrystalButton>
                </Link>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CrystalCard className="p-6">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Staff</p>
                    <p className="text-3xl font-black text-white">{trainers.length}</p>
                </CrystalCard>
                <CrystalCard className="p-6">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Clientes Asignados</p>
                    <p className="text-3xl font-black text-neon-cyan">
                        {trainers.reduce((acc, t) => acc + (t.clients?.[0]?.count || 0), 0)}
                    </p>
                </CrystalCard>
                <CrystalCard className="p-6">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Estatus Sistema</p>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                        <span className="text-xs font-bold text-white uppercase">Sincronizado</span>
                    </div>
                </CrystalCard>
            </div>

            {/* Search */}
            <CrystalCard className="p-4" hoverEffect={false}>
                <div className="relative w-full">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar staff por nombre..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:outline-none focus:border-neon-cyan/50 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </CrystalCard>

            {/* Trainer List */}
            <div className="grid gap-4">
                {filteredTrainers.length === 0 ? (
                    <CrystalCard className="p-20 text-center opacity-40">
                        <UserCheck className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                        <p className="text-gray-400 uppercase tracking-widest text-sm">No hay entrenadores registrados</p>
                    </CrystalCard>
                ) : (
                    filteredTrainers.map((trainer) => (
                        <CrystalCard key={trainer.id} className="p-4 border-l-4 border-neon-cyan" hoverEffect={false}>
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                {/* Avatar */}
                                <div className="relative h-16 w-16 shrink-0">
                                    <div className="h-full w-full rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-transparent flex items-center justify-center border border-white/10 overflow-hidden">
                                        {trainer.avatar_url ? (
                                            <img src={trainer.avatar_url} className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="h-8 w-8 text-gray-500" />
                                        )}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 bg-neon-cyan rounded-lg p-1 shadow-lg">
                                        <Star className="h-3 w-3 text-black fill-black" />
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-xl font-bold text-white uppercase italic tracking-tight">{trainer.full_name}</h3>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-1">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                            <Users className="h-3.5 w-3.5 text-neon-cyan" />
                                            <span>{trainer.clients?.[0]?.count || 0} Clientes activos</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                            <Star className="h-3.5 w-3.5 text-yellow-500" />
                                            <span>Staff Verificado</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3">
                                    <Link href={`/admin/trainers/${trainer.id}`}>
                                        <CrystalButton className="text-xs bg-white/5 border-white/10 hover:bg-white/10">
                                            VER PERFIL
                                        </CrystalButton>
                                    </Link>
                                    <button
                                        onClick={() => handleDemote(trainer.id)}
                                        className="p-3 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                        title="Degradar a Miembro"
                                    >
                                        <Trash2 className="h-5 w-5" />
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
