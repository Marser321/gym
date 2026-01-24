import { createClient } from "@/lib/supabase/server";
import { RoutineCard } from "@/components/routines/RoutineCard";
import { CrystalCard } from "@/components/crystal/CrystalCard";

import Link from "next/link";

export default async function RoutinesPage() {
    const supabase = await createClient();

    if (!supabase) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center opacity-60">
                <p className="text-lg text-gray-300">Error de conexión con la base de datos.</p>
            </div>
        );
    }

    // Fetch user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Fetch assigned routines
    const { data: assignments, error } = await supabase
        .from("user_routines")
        .select(`
            id,
            status,
            routine:routines (
                id,
                name,
                description,
                difficulty,
                duration,
                exercise_count,
                image_url
            )
        `)
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("assigned_at", { ascending: false });

    if (error) {
        console.error("Error fetching routines:", error);
    }

    const displayRoutines = assignments?.map((a: any) => ({
        ...a.routine,
        assignment_id: a.id // Keep track of assignment ID for future use
    })) || [];

    return (
        <div className="space-y-6 pb-24">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-white">Mis Rutinas</h1>
                <p className="text-gray-400">Selecciona tu entrenamiento de hoy.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {displayRoutines.length > 0 ? (
                    displayRoutines.map((routine: any) => (
                        <div key={routine.id} className="relative group">
                            <RoutineCard
                                title={routine.name}
                                description={routine.description}
                                difficulty={routine.difficulty || "intermedio"}
                                duration={routine.duration || 45}
                                exerciseCount={routine.exercise_count || 5}
                                imageUrl={routine.image_url}
                            />
                            {/* Overlay Link */}
                            <a href={`/dashboard/routines/${routine.id}/start`} className="absolute inset-0 z-10" />
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center opacity-50">
                        <p className="text-xl font-bold text-white uppercase">No tenés rutinas asignadas</p>
                        <p className="text-sm text-gray-400">Pedile a tu entrenador que te asigne un plan.</p>
                    </div>
                )}

                <Link href="/dashboard/chat" className="h-full">
                    <CrystalCard className="flex flex-col items-center justify-center p-8 border-dashed border-white/20 bg-transparent hover:bg-white/5 cursor-pointer h-full transition-all hover:border-neon-cyan/30">
                        <span className="text-4xl mb-2 text-gray-600 group-hover:text-neon-cyan transition-colors">+</span>
                        <span className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors">Solicitar Nueva Rutina</span>
                    </CrystalCard>
                </Link>
            </div>
        </div>
    );
}
