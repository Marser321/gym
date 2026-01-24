"use client";

import { CrystalCard } from "@/components/crystal/CrystalCard";
import { CrystalButton } from "@/components/crystal/CrystalButton";
import { Dumbbell, Plus, Loader2, X, Check, Trash2, Search, Filter, Layers, Clock, Activity, ArrowRight, User } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RoutinesPage() {
    const [routines, setRoutines] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        fetchRoutines();
    }, []);

    const fetchRoutines = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("routines")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setRoutines(data || []);
        } catch (err) {
            console.error("Error fetching routines:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm("¿Eliminar esta rutina permanentemente? Se eliminarán también las asignaciones existentes.")) return;
        try {
            const { error } = await supabase.from("routines").delete().eq("id", id);
            if (error) throw error;
            setRoutines(prev => prev.filter(r => r.id !== id));
        } catch (err: any) {
            alert("Error al eliminar: " + err.message);
        }
    };

    const getDifficultyColor = (diff: string) => {
        switch (diff?.toLowerCase()) {
            case 'principiante': return 'text-green-400 border-green-500/30 bg-green-500/10';
            case 'intermedio': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
            case 'avanzado': return 'text-red-400 border-red-500/30 bg-red-500/10';
            default: return 'text-gray-400 border-gray-500/30 bg-gray-500/10';
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight italic">Gestión de Rutinas</h1>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-1">Diseña los protocolos de entrenamiento</p>
                </div>
                {/* We point this to a separate builder page for better UX */}
                <Link href="/admin/routines/builder">
                    <CrystalButton className="shadow-[0_0_20px_rgba(0,243,255,0.2)]">
                        <Plus className="h-4 w-4 mr-2" /> NUEVA RUTINA
                    </CrystalButton>
                </Link>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-10 w-10 animate-spin text-neon-cyan" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {routines.map((routine) => (
                        <Link href={`/admin/routines/builder?id=${routine.id}`} key={routine.id}>
                            <CrystalCard className="group p-0 overflow-hidden flex flex-col h-full hover:border-neon-cyan/50 transition-all" hoverEffect={false}>
                                {/* Header Image Placeholder for now */}
                                <div className="relative h-48 bg-deep-charcoal border-b border-white/5 flex items-center justify-center overflow-hidden">
                                    {routine.image_url ? (
                                        <Image src={routine.image_url} alt={routine.name} fill className="object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                                    ) : (
                                        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black opacity-50" />
                                    )}
                                    <div className="relative z-10 flex flex-col items-center gap-2">
                                        <Layers className="h-8 w-8 text-white/50 group-hover:text-neon-cyan transition-colors" />
                                        <span className="text-xs font-black uppercase tracking-widest text-white/70">Protocolo</span>
                                    </div>
                                </div>

                                <div className="p-6 flex-1 flex flex-col space-y-4">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none mb-2 group-hover:text-neon-cyan transition-colors">
                                                {routine.name}
                                            </h3>
                                            <button onClick={(e) => handleDelete(routine.id, e)} className="text-gray-500 hover:text-red-400 transition-colors p-1">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-400 line-clamp-2">{routine.description || "Sin descripción."}</p>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mt-auto">
                                        <span className={`px-2 py-1 rounded border text-[10px] font-bold uppercase ${getDifficultyColor(routine.difficulty)}`}>
                                            {routine.difficulty}
                                        </span>
                                        <div className="flex items-center gap-1 px-2 py-1 rounded border border-white/10 bg-white/5 text-[10px] font-bold text-gray-300 uppercase">
                                            <Clock className="h-3 w-3" /> {routine.duration} MIN
                                        </div>
                                        <div className="flex items-center gap-1 px-2 py-1 rounded border border-white/10 bg-white/5 text-[10px] font-bold text-gray-300 uppercase">
                                            <Dumbbell className="h-3 w-3" /> {routine.exercise_count} Ejer.
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-500 group-hover:text-white transition-colors">
                                        <span className="font-mono">ID: {routine.id.substring(0, 8)}...</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </div>
                                </div>
                            </CrystalCard>
                        </Link>
                    ))}

                    {routines.length === 0 && (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-30">
                            <Layers className="h-16 w-16 mb-4" />
                            <p className="font-black uppercase tracking-[0.3em] text-sm mb-4">No hay rutinas creadas</p>
                            <Link href="/admin/routines/builder">
                                <CrystalButton size="sm">Crear Primera Rutina</CrystalButton>
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
