"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CrystalCard } from "@/components/crystal/CrystalCard";
import { CrystalButton } from "@/components/crystal/CrystalButton";
import { ArrowLeft, Save, Plus, Trash2, GripVertical, Check, Search, Dumbbell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";

// Separate component for search params handling
function RoutineBuilderContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const routineId = searchParams.get("id");
    const supabase = createClient();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Routine Header State
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [difficulty, setDifficulty] = useState("Intermedio");
    const [imageUrl, setImageUrl] = useState("");

    // Routine Exercises State
    const [routineExercises, setRoutineExercises] = useState<any[]>([]);

    // Exercise Selector State
    const [availableExercises, setAvailableExercises] = useState<any[]>([]);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const init = async () => {
            await fetchExercisesLib();
            if (routineId) {
                await fetchRoutineData(routineId);
            }
            setIsLoading(false);
        };
        init();
    }, [routineId]);

    const fetchExercisesLib = async () => {
        const { data } = await supabase.from("exercises").select("*").order("name");
        setAvailableExercises(data || []);
    };

    const fetchRoutineData = async (id: string) => {
        // Fetch Header
        const { data: routine } = await supabase.from("routines").select("*").eq("id", id).single();
        if (routine) {
            setName(routine.name);
            setDescription(routine.description || "");
            setDifficulty(routine.difficulty || "Intermedio");
            setImageUrl(routine.image_url || "");
        }

        // Fetch Exercises
        const { data: exercises } = await supabase
            .from("routine_exercises")
            .select(`
                *,
                exercise:exercises (
                    name,
                    muscle_group
                )
            `)
            .eq("routine_id", id)
            .order("order_index");

        if (exercises) {
            // Transform for local state
            setRoutineExercises(exercises.map(item => ({
                id: item.id, // Junction ID
                exercise_id: item.exercise_id,
                name: item.exercise.name,
                muscle_group: item.exercise.muscle_group,
                sets: item.sets,
                reps: item.reps,
                rest_seconds: item.rest_seconds
            })));
        }
    };

    const handleAddExercise = (exercise: any) => {
        setRoutineExercises(prev => [...prev, {
            id: `temp-${Date.now()}`, // Temp ID until saved
            exercise_id: exercise.id,
            name: exercise.name,
            muscle_group: exercise.muscle_group,
            sets: 3,
            reps: "10-12",
            rest_seconds: 60
        }]);
        setIsSelectorOpen(false);
    };

    const handleRemoveExercise = (index: number) => {
        setRoutineExercises(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpdateExercise = (index: number, field: string, value: any) => {
        setRoutineExercises(prev => {
            const copy = [...prev];
            copy[index] = { ...copy[index], [field]: value };
            return copy;
        });
    };

    const handleSave = async () => {
        if (!name) return alert("El nombre es obligatorio");
        setIsSaving(true);

        try {
            let currentRoutineId = routineId;

            // 1. Upsert Routine Header
            const routineData = {
                name,
                description,
                difficulty,
                image_url: imageUrl,
                exercise_count: routineExercises.length,
                duration: routineExercises.length * 5 // Approx calculation
            };

            if (currentRoutineId) {
                await supabase.from("routines").update(routineData).eq("id", currentRoutineId);
            } else {
                const { data, error } = await supabase.from("routines").insert([routineData]).select().single();
                if (error) throw error;
                currentRoutineId = data.id;
            }

            // 2. Sync Exercises (Delete all and re-insert is easiest for this scale)
            // Ideally we should be smarter but this is robust enough for now
            if (currentRoutineId) {
                // Delete existing
                await supabase.from("routine_exercises").delete().eq("routine_id", currentRoutineId);

                // Insert new batch
                if (routineExercises.length > 0) {
                    const toInsert = routineExercises.map((ex, idx) => ({
                        routine_id: currentRoutineId,
                        exercise_id: ex.exercise_id,
                        order_index: idx,
                        sets: ex.sets,
                        reps: ex.reps,
                        rest_seconds: ex.rest_seconds
                    }));

                    const { error: insertError } = await supabase.from("routine_exercises").insert(toInsert);
                    if (insertError) throw insertError;
                }
            }

            router.push("/admin/routines");
            router.refresh();
        } catch (err: any) {
            console.error("Error saving:", err);
            alert("Error al guardar: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-20 text-center text-neon-cyan">Cargando constructor...</div>;
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">
            {/* Top Bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/routines" className="p-2 rounded-xl bg-white/5 hover:text-white text-gray-400 border border-white/10">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-white uppercase italic tracking-tight">
                            {routineId ? 'Editar Rutina' : 'Nueva Rutina'}
                        </h1>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Constructor de Protocolos</p>
                    </div>
                </div>
                <CrystalButton onClick={handleSave} isLoading={isSaving} className="px-8 shadow-[0_0_20px_rgba(0,243,255,0.2)]">
                    <Save className="h-4 w-4 mr-2" /> GUARDAR RUTINA
                </CrystalButton>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Metadata */}
                <div className="space-y-6">
                    <CrystalCard className="p-6 space-y-4" hoverEffect={false}>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">Información Básica</h3>

                        <div className="space-y-2">
                            <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Nombre</label>
                            <input
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-neon-cyan/50 outline-none"
                                value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Full Body A"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Descripción</label>
                            <textarea
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-neon-cyan/50 outline-none h-24 resize-none"
                                value={description} onChange={e => setDescription(e.target.value)} placeholder="Objetivo y detalles..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Dificultad</label>
                            <select
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-neon-cyan/50 outline-none"
                                value={difficulty} onChange={e => setDifficulty(e.target.value)}
                            >
                                <option className="bg-black">Principiante</option>
                                <option className="bg-black">Intermedio</option>
                                <option className="bg-black">Avanzado</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Imagen URL</label>
                            <input
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-xs font-mono text-gray-300 focus:border-neon-cyan/50 outline-none"
                                value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..."
                            />
                        </div>
                    </CrystalCard>
                </div>

                {/* Right: Exercise List */}
                <div className="lg:col-span-2 space-y-6">
                    <CrystalCard className="p-6 min-h-[500px] flex flex-col" hoverEffect={false}>
                        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Ejercicios ({routineExercises.length})</h3>
                            <button
                                onClick={() => setIsSelectorOpen(true)}
                                className="text-xs font-bold text-neon-cyan hover:underline uppercase flex items-center gap-1"
                            >
                                <Plus className="h-3 w-3" /> Agregar
                            </button>
                        </div>

                        <div className="space-y-3 flex-1">
                            {routineExercises.length === 0 ? (
                                <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl text-gray-500">
                                    <Dumbbell className="h-8 w-8 mb-2 opacity-50" />
                                    <span className="text-xs uppercase font-bold">Sin ejercicios</span>
                                </div>
                            ) : (
                                routineExercises.map((ex, idx) => (
                                    <div key={ex.id || idx} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 group hover:border-white/20 transition-all">
                                        <div className="h-8 w-8 bg-black/50 rounded-lg flex items-center justify-center text-gray-400 font-mono text-xs border border-white/5">
                                            {idx + 1}
                                        </div>

                                        <div className="flex-1">
                                            <h4 className="font-bold text-white text-sm">{ex.name}</h4>
                                            <span className="text-[10px] text-neon-cyan uppercase font-black">{ex.muscle_group}</span>
                                        </div>

                                        {/* Quick Editors */}
                                        <div className="flex items-center gap-2">
                                            <div className="flex flex-col w-16">
                                                <label className="text-[8px] text-gray-500 uppercase font-bold">Series</label>
                                                <input
                                                    type="number" className="bg-black/30 text-white text-xs p-1 rounded border border-white/10 text-center"
                                                    value={ex.sets} onChange={e => handleUpdateExercise(idx, 'sets', parseInt(e.target.value))}
                                                />
                                            </div>
                                            <div className="flex flex-col w-20">
                                                <label className="text-[8px] text-gray-500 uppercase font-bold">Reps</label>
                                                <input
                                                    type="text" className="bg-black/30 text-white text-xs p-1 rounded border border-white/10 text-center"
                                                    value={ex.reps} onChange={e => handleUpdateExercise(idx, 'reps', e.target.value)}
                                                />
                                            </div>
                                            <div className="flex flex-col w-16">
                                                <label className="text-[8px] text-gray-500 uppercase font-bold">Descanso</label>
                                                <input
                                                    type="number" className="bg-black/30 text-white text-xs p-1 rounded border border-white/10 text-center"
                                                    value={ex.rest_seconds} onChange={e => handleUpdateExercise(idx, 'rest_seconds', parseInt(e.target.value))}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleRemoveExercise(idx)}
                                            className="p-2 text-gray-600 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </CrystalCard>
                </div>
            </div>

            {/* Exercise Selector Modal */}
            {isSelectorOpen && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
                    <CrystalCard className="w-full max-w-2xl h-[80vh] flex flex-col p-6 shadow-2xl border-neon-cyan/20" hoverEffect={false}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-white uppercase italic">Seleccionar Ejercicio</h3>
                            <button onClick={() => setIsSelectorOpen(false)}><X className="text-white h-6 w-6" /></button>
                        </div>

                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <input
                                placeholder="Buscar por nombre..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 text-white outline-none focus:border-neon-cyan"
                                autoFocus
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                            {availableExercises
                                .filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map(exercise => (
                                    <button
                                        key={exercise.id}
                                        onClick={() => handleAddExercise(exercise)}
                                        className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-neon-cyan/10 hover:border-neon-cyan/50 transition-all group"
                                    >
                                        <div className="text-left">
                                            <div className="font-bold text-white group-hover:text-neon-cyan">{exercise.name}</div>
                                            <div className="text-xs text-gray-500 uppercase">{exercise.muscle_group}</div>
                                        </div>
                                        <Plus className="h-5 w-5 text-gray-500 group-hover:text-neon-cyan" />
                                    </button>
                                ))}
                        </div>
                    </CrystalCard>
                </div>
            )}
        </div>
    );
}

export default function RoutineBuilder() {
    return (
        <Suspense fallback={<div className="p-10 text-center">Cargando...</div>}>
            <RoutineBuilderContent />
        </Suspense>
    );
}
