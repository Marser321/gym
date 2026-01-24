"use client";

import { CrystalCard } from "@/components/crystal/CrystalCard";
import { CrystalButton } from "@/components/crystal/CrystalButton";
import { Search, MessageSquare, User, Users, ChevronRight, Activity, Dumbbell, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function MyClientsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [clients, setClients] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchMyClients();
    }, []);

    const fetchMyClients = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch assignments where current user is the trainer
            const { data, error } = await supabase
                .from("trainer_assignments")
                .select(`
                    id,
                    client:profiles!client_id (*)
                `)
                .eq("trainer_id", user.id)
                .eq("status", "active");

            if (error) throw error;

            // Re-map to a flatter structure
            const clientsList = (data || []).map(item => item.client);
            setClients(clientsList);
        } catch (err) {
            console.error("Error fetching my clients:", err);
            setClients([]);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredClients = clients.filter(c =>
        c.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
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
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white uppercase italic tracking-tight">Mis Clientes</h1>
                    <p className="text-gray-400 text-sm">Gestiona tus alumnos y su progreso</p>
                </div>
            </div>

            {/* Quick Stats for Trainer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CrystalCard className="p-6">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Socios a cargo</p>
                    <p className="text-3xl font-black text-white">{clients.length}</p>
                </CrystalCard>
                <CrystalCard className="p-6">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Actividad Hoy</p>
                    <p className="text-3xl font-black text-neon-cyan">0</p>
                </CrystalCard>
                <CrystalCard className="p-6">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Mensajes Pendientes</p>
                    <p className="text-3xl font-black text-purple-500">0</p>
                </CrystalCard>
            </div>

            {/* Search */}
            <CrystalCard className="p-3" hoverEffect={false}>
                <div className="relative w-full">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar alumno..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:outline-none focus:border-neon-cyan/50 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </CrystalCard>

            {/* Clients List */}
            <div className="grid gap-3">
                {filteredClients.length === 0 ? (
                    <CrystalCard className="p-20 text-center opacity-40">
                        <Users className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                        <p className="text-gray-400 uppercase tracking-widest text-sm">No tenés alumnos asignados todavía</p>
                    </CrystalCard>
                ) : (
                    filteredClients.map((client) => (
                        <div key={client.id} className="relative group">
                            <CrystalCard className="p-4 flex flex-col md:flex-row items-center gap-6" hoverEffect={false}>
                                {/* Avatar */}
                                <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
                                    {client.avatar_url ? (
                                        <img src={client.avatar_url} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center">
                                            <User className="h-8 w-8 text-gray-600" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-lg font-bold text-white uppercase italic tracking-tight">{client.full_name}</h3>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-1">
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                                            <Dumbbell className="h-3.5 w-3.5" />
                                            <span>Nivel {client.level || 1}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-neon-cyan">
                                            <Activity className="h-3.5 w-3.5" />
                                            <span>Entrenó hace 2 días</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <Link href={`/admin/my-clients/${client.id}/chat`}>
                                        <CrystalButton className="p-3 bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20">
                                            <MessageSquare className="h-5 w-5" />
                                        </CrystalButton>
                                    </Link>
                                    <Link href={`/admin/members/${client.id}`}>
                                        <CrystalButton className="p-3 bg-white/5 text-white border-white/10 hover:bg-white/10">
                                            <ChevronRight className="h-5 w-5" />
                                        </CrystalButton>
                                    </Link>
                                </div>
                            </CrystalCard>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
