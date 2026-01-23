import { createClient } from "@/lib/supabase/server";
import { RoutineCard } from "@/components/routines/RoutineCard";
import { CrystalCard } from "@/components/crystal/CrystalCard";

export default async function RoutinesPage() {
    const supabase = await createClient();

    if (!supabase) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center opacity-60">
                <p className="text-lg text-gray-300">Error de conexión con la base de datos.</p>
            </div>
        );
    }

    // Fetch routines
    const { data: routines } = await supabase
        .from("routines")
        .select("*")
        .limit(10);

    // Fallback mock data if DB is empty for demo purposes
    const displayRoutines = routines && routines.length > 0 ? routines : [
        {
            id: "demo-1",
            name: "Hipertrofia Pierna",
            description: "Enfoque en cuádriceps y glúteos con alta intensidad.",
            difficulty: "intermedio",
            duration: 60,
            exercise_count: 8,
            image_url: "https://images.unsplash.com/photo-1434608519344-49d77a699ded?q=80&w=1474&auto=format&fit=crop"
        },
        {
            id: "demo-2",
            name: "Upper Body Power",
            description: "Pecho, espalda y hombros para fuerza máxima.",
            difficulty: "avanzado",
            duration: 75,
            exercise_count: 10,
            image_url: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1470&auto=format&fit=crop"
        },
        {
            id: "demo-3",
            name: "Cardio & Core",
            description: "Circuito metabólico para quemar grasa.",
            difficulty: "principiante",
            duration: 45,
            exercise_count: 6,
            image_url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1470&auto=format&fit=crop"
        }
    ];

    return (
        <div className="space-y-6 pb-24">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-white">Mis Rutinas</h1>
                <p className="text-gray-400">Selecciona tu entrenamiento de hoy.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {displayRoutines.map((routine: any) => (
                    <RoutineCard
                        key={routine.id}
                        title={routine.name}
                        description={routine.description}
                        difficulty={routine.difficulty || "intermedio"} // Fallback type check
                        duration={routine.duration || 45} // Default if missing
                        exerciseCount={routine.exercise_count || 5}
                        imageUrl={routine.image_url}
                    />
                ))}

                <CrystalCard className="flex flex-col items-center justify-center p-8 border-dashed border-white/20 bg-transparent hover:bg-white/5 cursor-pointer">
                    <span className="text-4xl mb-2 text-gray-600">+</span>
                    <span className="text-sm font-medium text-gray-400">Solicitar Nueva Rutina</span>
                </CrystalCard>
            </div>
        </div>
    );
}
