// Nexus AI Logic Core

export type EnergyLevel = "low" | "medium" | "high" | "critical";
export type BodyPart = "shoulders" | "back" | "knees" | "chest" | "legs";
export type Goal = "strength" | "hyper trophy" | "endurance" | "mobility";

export interface CalibrationData {
    energy: number; // 0-100
    soreness: BodyPart[];
    timeAvailable: number; // minutes
}

export interface GeneratedRoutine {
    id: string;
    title: string;
    description: string;
    intensity: "Low" | "Moderate" | "High" | "Extreme";
    duration: number;
    tags: string[];
    exercises: { name: string; sets: number; reps: string }[];
}

const ROUTINE_DATABASE: GeneratedRoutine[] = [
    {
        id: "recovery-1",
        title: "Protocolo de Reactivación",
        description: "Enfoque en movilidad y flujo sanguíneo para días de baja energía o recuperación activa.",
        intensity: "Low",
        duration: 30,
        tags: ["Movilidad", "Recuperación", "Zen"],
        exercises: [
            { name: "Estiramiento Dinámico de Gato-Vaca", sets: 3, reps: "1 min" },
            { name: "Rotaciones Torácicas", sets: 3, reps: "10/lado" },
            { name: "Caminata de Oso", sets: 4, reps: "20m" },
        ]
    },
    {
        id: "strength-1",
        title: "Núcleo de Poder",
        description: "Sesión compacta de alta intensidad enfocada en levantamientos compuestos.",
        intensity: "High",
        duration: 45,
        tags: ["Fuerza", "Compuestos", "Potencia"],
        exercises: [
            { name: "Deadlift Convencional", sets: 5, reps: "5" },
            { name: "Press Militar", sets: 4, reps: "8" },
            { name: "Pull Ups con Lastre", sets: 4, reps: "Fallo - 1" },
        ]
    },
    {
        id: "mobility-1",
        title: "Mantenimiento Articular",
        description: "Rutina diseñada para evitar sobrecarga en articulaciones sensibles.",
        intensity: "Moderate",
        duration: 40,
        tags: ["Seguro", "Articulaciones", "Estabilidad"],
        exercises: [
            { name: "Plancha Isométrica", sets: 4, reps: "45s" },
            { name: "Puente de Glúteo Unilateral", sets: 3, reps: "12/lado" },
            { name: "Remo en Anillas", sets: 4, reps: "12" },
        ]
    }
];

export function synthesizeRoutine(data: CalibrationData): GeneratedRoutine {
    // Nexus AI Logic Simulation

    // 1. Check constraints
    if (data.energy < 40) {
        return ROUTINE_DATABASE.find(r => r.id === "recovery-1")!;
    }

    // 2. Check injuries
    if (data.soreness.includes("shoulders") || data.soreness.includes("back")) {
        return ROUTINE_DATABASE.find(r => r.id === "mobility-1")!;
    }

    // 3. Default high performance
    return ROUTINE_DATABASE.find(r => r.id === "strength-1")!;
}
