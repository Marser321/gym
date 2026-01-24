"use client";

import { CrystalCard } from "@/components/crystal/CrystalCard";
import { CrystalButton } from "@/components/crystal/CrystalButton";
import { Dumbbell, Plus, Loader2, X, Check, Trash2, Search, Video, Play, Filter } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ExercisesPage() {
    const [exercises, setExercises] = useState<any[]>([]);
    const [filteredExercises, setFilteredExercises] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExercise, setEditingExercise] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedMuscle, setSelectedMuscle] = useState("all");
    const supabase = createClient();

    // Form states
    const [name, setName] = useState("");
    const [muscleGroup, setMuscleGroup] = useState("");
    const [videoUrl, setVideoUrl] = useState("");

    const MUSCLE_GROUPS = ["Pecho", "Espalda", "Piernas", "Hombros", "Bíceps", "Tríceps", "Abdominales", "Cardio", "Full Body"];

    useEffect(() => {
        fetchExercises();
    }, []);

    useEffect(() => {
        let result = exercises;

        if (searchTerm) {
            result = result.filter(ex => ex.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        if (selectedMuscle !== "all") {
            result = result.filter(ex => ex.muscle_group === selectedMuscle);
        }

        setFilteredExercises(result);
    }, [searchTerm, selectedMuscle, exercises]);

    const fetchExercises = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("exercises")
                .select("*")
                .order("name", { ascending: true });

            if (error) throw error;
            setExercises(data || []);
            setFilteredExercises(data || []);
        } catch (err) {
            console.error("Error fetching exercises:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (exercise: any = null) => {
        if (exercise) {
            setEditingExercise(exercise);
            setName(exercise.name);
            setMuscleGroup(exercise.muscle_group || "Full Body");
            setVideoUrl(exercise.video_url || "");
        } else {
            setEditingExercise(null);
            setName("");
            setMuscleGroup("Pecho");
            setVideoUrl("");
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const exerciseData = {
            name,
            muscle_group: muscleGroup,
            video_url: videoUrl
        };

        try {
            if (editingExercise) {
                const { error } = await supabase
                    .from("exercises")
                    .update(exerciseData)
                    .eq("id", editingExercise.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("exercises")
                    .insert([exerciseData]);
                if (error) throw error;
            }

            setIsModalOpen(false);
            fetchExercises();
        } catch (err: any) {
            alert("Error al guardar: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este ejercicio?")) return;
        try {
            const { error } = await supabase.from("exercises").delete().eq("id", id);
            if (error) throw error;
            setExercises(prev => prev.filter(e => e.id !== id));
        } catch (err: any) {
            alert("Error al eliminar: " + err.message);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight italic">Biblioteca de Ejercicios</h1>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-1">Gestión de movimientos y tutoriales</p>
                </div>
                <CrystalButton onClick={() => handleOpenModal()} className="shadow-[0_0_20px_rgba(0,243,255,0.2)]">
                    <Plus className="h-4 w-4 mr-2" /> NUEVO EJERCICIO
                </CrystalButton>
            </div>

            {/* Filters */}
            <CrystalCard className="p-4 flex flex-col md:flex-row gap-4 items-center" hoverEffect={false}>
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                        placeholder="Buscar ejercicio..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-neon-cyan/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                    <Filter className="h-4 w-4 text-gray-500 shrink-0" />
                    <button
                        onClick={() => setSelectedMuscle("all")}
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase whitespace-nowrap transition-colors ${selectedMuscle === "all" ? "bg-neon-cyan text-black" : "bg-white/5 text-gray-400 hover:text-white"}`}
                    >
                        Todos
                    </button>
                    {MUSCLE_GROUPS.map(group => (
                        <button
                            key={group}
                            onClick={() => setSelectedMuscle(group)}
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase whitespace-nowrap transition-colors ${selectedMuscle === group ? "bg-neon-cyan text-black" : "bg-white/5 text-gray-400 hover:text-white"}`}
                        >
                            {group}
                        </button>
                    ))}
                </div>
            </CrystalCard>

            {isLoading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-10 w-10 animate-spin text-neon-cyan" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredExercises.map((exercise) => (
                        <CrystalCard key={exercise.id} className="group p-0 overflow-hidden flex flex-col" hoverEffect={false}>
                            <div className="relative h-40 bg-black/40 border-b border-white/5 flex items-center justify-center group-hover:bg-white/5 transition-colors">
                                {exercise.video_url ? (
                                    <div className="relative w-full h-full">
                                        {/* In a real app we might embed a thumbnail here */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="h-12 w-12 rounded-full bg-neon-cyan/10 flex items-center justify-center border border-neon-cyan/30 text-neon-cyan">
                                                <Play className="h-5 w-5 ml-1 fill-current" />
                                            </div>
                                        </div>
                                        <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-[10px] font-mono text-white flex items-center gap-1">
                                            <Video className="h-3 w-3" /> VIDEO
                                        </div>
                                    </div>
                                ) : (
                                    <Dumbbell className="h-10 w-10 text-gray-600 group-hover:text-gray-400 transition-colors" />
                                )}
                            </div>

                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-white uppercase tracking-tight truncate pr-2" title={exercise.name}>
                                        {exercise.name}
                                    </h3>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-neon-cyan bg-neon-cyan/5 px-2 py-1 rounded border border-neon-cyan/20">
                                        {exercise.muscle_group}
                                    </span>
                                </div>

                                <div className="mt-auto pt-4 flex gap-2">
                                    <button
                                        onClick={() => handleOpenModal(exercise)}
                                        className="flex-1 py-2 rounded-lg bg-white/5 text-xs font-bold text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                                    >
                                        EDITAR
                                    </button>
                                    <button
                                        onClick={() => handleDelete(exercise.id)}
                                        className="p-2 rounded-lg bg-white/5 text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </CrystalCard>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
                    <CrystalCard className="w-full max-w-lg p-8 border-neon-cyan/30 shadow-[0_0_50px_rgba(0,243,255,0.15)]" hoverEffect={false}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-white uppercase italic">
                                {editingExercise ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nombre</label>
                                <input
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-neon-cyan/50 focus:bg-white/10 outline-none transition-all"
                                    placeholder="Ej: Press de Banca"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Grupo Muscular</label>
                                <select
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-neon-cyan/50 focus:bg-white/10 outline-none transition-all"
                                    value={muscleGroup}
                                    onChange={e => setMuscleGroup(e.target.value)}
                                >
                                    {MUSCLE_GROUPS.map(g => (
                                        <option key={g} value={g} className="bg-black">{g}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Video URL (Opcional)</label>
                                <input
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-neon-cyan/50 focus:bg-white/10 outline-none transition-all font-mono text-xs"
                                    placeholder="https://youtube.com/..."
                                    value={videoUrl}
                                    onChange={e => setVideoUrl(e.target.value)}
                                />
                            </div>

                            <CrystalButton
                                type="submit"
                                className="w-full mt-4"
                                isLoading={isSaving}
                            >
                                <Check className="h-5 w-5 mr-2" />
                                GUARDAR
                            </CrystalButton>
                        </form>
                    </CrystalCard>
                </div>
            )}
        </div>
    );
}
