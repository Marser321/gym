"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CrystalCard } from "@/components/crystal/CrystalCard";
import { CrystalButton } from "@/components/crystal/CrystalButton";
import {
    Play, Pause, SkipForward, CheckCircle, Clock,
    Dumbbell, Zap, ChevronUp, X, Trophy, RefreshCw
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";

interface Exercise {
    id: string;
    name: string;
    muscle_group: string;
    video_url?: string;
    sets: number;
    reps: string;
    rest_seconds: number;
    order_index: number;
}

interface WorkoutPlayerProps {
    routine: {
        id: string;
        name: string;
    };
    exercises: Exercise[];
    userId: string;
}

export function WorkoutPlayer({ routine, exercises, userId }: WorkoutPlayerProps) {
    const router = useRouter();
    const supabase = createClient();

    // -- State --
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentSet, setCurrentSet] = useState(1);
    const [isResting, setIsResting] = useState(false);
    const [timer, setTimer] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    // Logging State
    const [weight, setWeight] = useState("");
    const [reps, setReps] = useState("");

    // Tips Drawer State
    const [isTipsOpen, setIsTipsOpen] = useState(false);

    // Derived
    const currentExercise = exercises[currentIndex];
    const totalSets = currentExercise?.sets || 3;

    // -- Timer Logic --
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isResting && timer > 0) {
            interval = setInterval(() => setTimer(t => t - 1), 1000);
        } else if (isResting && timer === 0) {
            handleRestComplete();
        }
        return () => clearInterval(interval);
    }, [isResting, timer]);

    const handleRestComplete = () => {
        setIsResting(false);
        // Haptics if available
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        // Sound could go here
    };

    // -- Actions --
    const handleFinishSet = async () => {
        if (!currentExercise) return;

        // 1. Log the set (Optimistic UI)
        const logData = {
            user_id: userId,
            routine_id: routine.id,
            exercise_id: currentExercise.id,
            reps: parseInt(reps) || 0,
            weight: parseFloat(weight) || 0,
            completed_at: new Date().toISOString()
        };

        // Fire and forget log for fluidity, or handle error silently
        supabase.from("workout_logs").insert(logData).then(({ error }) => {
            if (error) console.error("Log error", error);
        });

        // 2. Progress Logic
        if (currentSet < totalSets) {
            setCurrentSet(p => p + 1);
            startRest();
        } else {
            // Finished Exercise
            if (currentIndex < exercises.length - 1) {
                // Next Exercise
                setCurrentIndex(p => p + 1);
                setCurrentSet(1);
                // Reset inputs
                setWeight("");
                setReps("");
                // Optional: Short transition rest or go straight
                setIsTipsOpen(true); // Auto open tips for new exercise
            } else {
                // Finished Routine
                finishWorkout();
            }
        }
    };

    const startRest = () => {
        setIsResting(true);
        setTimer(currentExercise.rest_seconds || 60);
    };

    const skipRest = () => {
        setTimer(0);
        setIsResting(false);
    };

    const finishWorkout = () => {
        setIsFinished(true);
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#00F3FF', '#FFFFFF']
        });
    };

    // -- Render: Finished State --
    if (isFinished) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-8 animate-in fade-in duration-700">
                <div className="relative">
                    <div className="absolute inset-0 bg-neon-cyan/20 blur-3xl rounded-full" />
                    <Trophy className="h-24 w-24 text-neon-cyan relative z-10" />
                </div>
                <div>
                    <h1 className="text-4xl font-black text-white italic uppercase">¡Rutina Completada!</h1>
                    <p className="text-gray-400 mt-2">Has dominado {routine.name}</p>
                </div>
                <CrystalCard className="w-full p-6">
                    <p className="text-sm font-bold text-gray-500 uppercase">XP Ganada</p>
                    <p className="text-3xl font-black text-white">+250 XP</p>
                </CrystalCard>
                <CrystalButton onClick={() => router.push('/dashboard')} className="w-full">
                    VOLVER AL DASHBOARD
                </CrystalButton>
            </div>
        );
    }

    if (!currentExercise) return <div>Cargando...</div>;

    // -- Render: Player --
    return (
        <div className="h-screen w-full flex flex-col relative overflow-hidden bg-black">
            {/* Background Image Layer */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40 z-10" />
                {/* Fallback image or video thumbnail could go here */}
                <img
                    src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470"
                    className="w-full h-3/4 object-cover opacity-40"
                    alt="Background"
                />
            </div>

            {/* Top Bar */}
            <div className="relative z-20 flex justify-between items-center p-4">
                <button onClick={() => router.back()} className="p-2 rounded-full bg-black/20 text-white backdrop-blur">
                    <X className="h-6 w-6" />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neon-cyan">
                        Ejercicio {currentIndex + 1} / {exercises.length}
                    </span>
                    {isResting && (
                        <span className="text-xl font-mono font-bold text-white animate-pulse">
                            {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                        </span>
                    )}
                </div>
                <button onClick={() => setIsTipsOpen(true)} className="p-2 rounded-full bg-white/10 text-neon-cyan backdrop-blur border border-neon-cyan/30 animate-pulse">
                    <Zap className="h-6 w-6" />
                </button>
            </div>

            {/* Main Content Area */}
            <div className="relative z-20 flex-1 flex flex-col justify-end p-6 pb-10 space-y-6">

                {/* Exercise Title */}
                <div className="space-y-2">
                    <h2 className="text-4xl font-black text-white uppercase italic leading-none tracking-tight text-shadow-glow">
                        {currentExercise.name}
                    </h2>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                        {currentExercise.muscle_group} • Set {currentSet} de {totalSets}
                    </p>
                </div>

                {/* Rest Overlay or Input Area */}
                <AnimatePresence mode="wait">
                    {isResting ? (
                        <motion.div
                            key="rest"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center space-y-6"
                        >
                            <Clock className="h-12 w-12 text-neon-cyan animate-spin-slow" />
                            <div className="text-center">
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Descanso</p>
                                <p className="text-6xl font-black text-white font-mono">
                                    {timer}s
                                </p>
                            </div>
                            <CrystalButton onClick={skipRest} className="w-full bg-white/10 hover:bg-white/20 border-white/10 text-sm">
                                SALTAR DESCANSO
                            </CrystalButton>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="logging"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                        >
                            {/* Inputs Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                    <label className="text-[10px] uppercase font-black text-gray-500 block mb-1">Peso (KG)</label>
                                    <input
                                        type="number"
                                        value={weight}
                                        onChange={e => setWeight(e.target.value)}
                                        placeholder="0"
                                        className="w-full bg-transparent text-3xl font-black text-white outline-none placeholder-gray-600"
                                        inputMode="decimal"
                                    />
                                </div>
                                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                    <label className="text-[10px] uppercase font-black text-gray-500 block mb-1">Reps</label>
                                    <input
                                        type="number"
                                        value={reps}
                                        onChange={e => setReps(e.target.value)}
                                        placeholder={currentExercise.reps?.split('-')[0] || "0"}
                                        className="w-full bg-transparent text-3xl font-black text-white outline-none placeholder-gray-600"
                                        inputMode="numeric"
                                    />
                                </div>
                            </div>

                            {/* Main Action Button */}
                            <CrystalButton
                                onClick={handleFinishSet}
                                className="w-full h-16 text-xl shadow-[0_0_30px_rgba(0,243,255,0.3)]"
                            >
                                <CheckCircle className="mr-2 h-6 w-6" />
                                {currentSet === totalSets ? "TERMINAR EJERCICIO" : "FINALIZAR SET"}
                            </CrystalButton>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Tips Drawer (Bottom Sheet) */}
            <AnimatePresence>
                {isTipsOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsTipsOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 20 }}
                            className="absolute bottom-0 left-0 right-0 z-40 bg-[#111] rounded-t-3xl border-t border-white/10 p-6 pb-12 max-h-[85vh] overflow-y-auto"
                        >
                            <div className="w-12 h-1 bg-gray-700 rounded-full mx-auto mb-6" />

                            <h3 className="text-2xl font-black text-white uppercase italic mb-4">Técnica Correcta</h3>

                            {/* Video / GIF Area */}
                            <div className="aspect-video w-full bg-black rounded-2xl border border-white/10 overflow-hidden mb-6 relative group">
                                {currentExercise.video_url ? (
                                    <iframe
                                        src={currentExercise.video_url.replace("watch?v=", "embed/")}
                                        className="w-full h-full"
                                        title="Exercise Video"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                                        <Dumbbell className="h-12 w-12 mb-2 opacity-50" />
                                        <span className="text-xs uppercase font-bold">Sin video disponible</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-white/5 border-l-2 border-neon-cyan">
                                    <h4 className="text-sm font-bold text-white uppercase mb-1">Tip Pro</h4>
                                    <p className="text-sm text-gray-400">Mantén el movimiento controlado en todo momento. Exhala al realizar el esfuerzo.</p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border-l-2 border-purple-500">
                                    <h4 className="text-sm font-bold text-white uppercase mb-1">Músculos</h4>
                                    <p className="text-sm text-gray-400">{currentExercise.muscle_group}</p>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
