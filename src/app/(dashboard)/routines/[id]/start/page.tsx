"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ActiveWorkoutOverlay } from "@/components/routines/ActiveWorkoutOverlay";
import { CrystalButton } from "@/components/crystal/CrystalButton";
import { ArrowLeft } from "lucide-react";

// Mock data generator helper for demo
const getRoutineData = (id: string) => ({
    id,
    name: "Hipertrofia Pierna & Glúteo",
    exercises: [
        { id: "e1", name: "Sentadilla Libre", sets: 4, reps: 10 },
        { id: "e2", name: "Prensa 45°", sets: 3, reps: 12 },
        { id: "e3", name: "Extensiones Cuádriceps", sets: 3, reps: 15 },
        { id: "e4", name: "Peso Muerto Rumano", sets: 4, reps: 10 },
        { id: "e5", name: "Zancadas Estáticas", sets: 3, reps: 12 }
    ]
});

export default function StartWorkoutPage({ params, searchParams }: any) {
    // Note: params is a promise in Next.js 15, we need to unwrap it if we use it directly, 
    // but here we might just use a mock based on the ID.
    // However, to follow Next.js 15 patterns correctly, let's treat it safely.

    const [routine, setRoutine] = useState<any>(null);
    const [isMinimized, setIsMinimized] = useState(false);
    const router = useRouter();

    // Unwrapping params (simplified for client component demo)
    // In a real app, we might want to fetch server-side or use React.use()

    useEffect(() => {
        // Mock fetch
        setRoutine(getRoutineData("demo"));
    }, []);

    if (!routine) return <div className="flex h-screen items-center justify-center text-white">Cargando rutina...</div>;

    if (isMinimized) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-6">
                <h1 className="text-2xl font-bold text-white text-center">Entrenamiento en Curso</h1>
                <div className="p-6 bg-neon-cyan/10 border border-neon-cyan/30 rounded-full animate-pulse">
                    <span className="text-4xl font-mono text-neon-cyan">EN PAUSA</span>
                </div>
                <CrystalButton onClick={() => setIsMinimized(false)}>
                    Reanudar Pantalla Completa
                </CrystalButton>
                <CrystalButton variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Salir
                </CrystalButton>
            </div>
        );
    }

    return (
        <ActiveWorkoutOverlay
            routineName={routine.name}
            exercises={routine.exercises}
            onComplete={() => {
                alert("¡Entrenamiento Completado! +500 XP");
                router.push("/dashboard");
            }}
            onMinimize={() => setIsMinimized(true)}
        />
    );
}
