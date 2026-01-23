"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CrystalCard } from "../crystal/CrystalCard";
import { CrystalButton } from "../crystal/CrystalButton";
import { useWorkoutTimer } from "@/hooks/useWorkoutTimer";
import { Check, Clock, ChevronRight, Minimize2, Play, Pause, X } from "lucide-react";

interface Exercise {
    id: string;
    name: string;
    sets: number;
    reps: number;
    video_url?: string;
}

interface ActiveWorkoutOverlayProps {
    routineName: string;
    exercises: Exercise[];
    onComplete: () => void;
    onMinimize: () => void;
}

export function ActiveWorkoutOverlay({ routineName, exercises, onComplete, onMinimize }: ActiveWorkoutOverlayProps) {
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [currentSet, setCurrentSet] = useState(1);
    const { formattedTime, startRest, isResting, formattedRestTime, togglePause, isPaused } = useWorkoutTimer();

    const currentExercise = exercises[currentExerciseIndex];
    const progress = ((currentExerciseIndex) / exercises.length) * 100;

    const handleNextSet = () => {
        if (currentSet < currentExercise.sets) {
            setCurrentSet(prev => prev + 1);
            startRest(60); // Default 60s rest
        } else {
            handleNextExercise();
        }
    };

    const handleNextExercise = () => {
        if (currentExerciseIndex < exercises.length - 1) {
            setCurrentExerciseIndex(prev => prev + 1);
            setCurrentSet(1);
            startRest(90); // Longer rest between exercises
        } else {
            onComplete();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-deep-charcoal">
            {/* Top Bar */}
            <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-md border-b border-white/5">
                <button onClick={onMinimize} className="p-2 text-gray-400 hover:text-white">
                    <Minimize2 className="h-6 w-6" />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-400 uppercase tracking-widest">{routineName}</span>
                    <div className="flex items-center gap-2 font-mono text-xl font-bold text-neon-cyan">
                        <Clock className="h-4 w-4" />
                        {formattedTime}
                    </div>
                </div>
                <button onClick={togglePause} className="p-2 text-gray-400 hover:text-white">
                    {isPaused ? <Play className="h-6 w-6" /> : <Pause className="h-6 w-6" />}
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 relative">
                {/* Background Video/Image if available, masked */}
                <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
                    {/* Placeholder for dynamic background */}
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center space-y-8 min-h-[50vh]">
                    <motion.div
                        key={currentExercise.id}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="text-center space-y-4"
                    >
                        <h2 className="text-3xl font-black text-white uppercase italic">{currentExercise.name}</h2>

                        <div className="flex justify-center gap-8">
                            <div className="flex flex-col items-center">
                                <span className="text-4xl font-bold text-white">{currentSet} <span className="text-lg text-gray-500">/ {currentExercise.sets}</span></span>
                                <span className="text-xs text-gray-400 uppercase">Set Actual</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-4xl font-bold text-white">{currentExercise.reps}</span>
                                <span className="text-xs text-gray-400 uppercase">Reps</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Rest Timer Overlay */}
                    <AnimatePresence>
                        {isResting && (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-3xl"
                            >
                                <div className="text-center">
                                    <span className="text-sm text-gray-400 uppercase tracking-widest">Descanso</span>
                                    <div className="text-6xl font-black text-neon-cyan font-mono my-4">
                                        {formattedRestTime}
                                    </div>
                                    <CrystalButton size="sm" onClick={() => startRest(0)} variant="secondary">
                                        Omitir
                                    </CrystalButton>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="p-6 pb-12 bg-black/40 backdrop-blur-xl border-t border-white/10">
                <div className="mb-4 flex items-center gap-2">
                    <div className="h-1 flex-1 bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-neon-cyan"
                            animate={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="text-xs text-gray-400">{currentExerciseIndex + 1} / {exercises.length}</span>
                </div>

                <CrystalButton
                    className="w-full h-16 text-xl font-bold"
                    onClick={handleNextSet}
                    disabled={isPaused}
                >
                    {isResting ? "TERMINAR DESCANSO" : "COMPLETAR SET"} <Check className="ml-2 h-6 w-6" />
                </CrystalButton>
            </div>
        </div>
    );
}
