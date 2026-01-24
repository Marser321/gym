import { createClient } from "@/lib/supabase/server";
import { CrystalCard } from "@/components/crystal/CrystalCard";
import { Calendar, Dumbbell, Trophy } from "lucide-react";
import { redirect } from "next/navigation";

export default async function HistoryPage() {
    const supabase = await createClient();

    if (!supabase) {
        return (
            <div className="flex items-center justify-center min-h-[50vh] text-white">
                <p>Error: Cliente Supabase no inicializado.</p>
            </div>
        );
    }

    // Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    // Fetch Logs
    const { data: logs, error } = await supabase
        .from("workout_logs")
        .select(`
            *,
            routine:routines(name),
            exercise:exercises(name, muscle_group)
        `)
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false });

    if (error) {
        console.error("Error logs:", error);
    }

    // Grouping Logic: Group by Date and Routine
    const sessions: any[] = [];

    logs?.forEach((log) => {
        const date = new Date(log.completed_at).toLocaleDateString("es-AR", {
            day: 'numeric', month: 'long', year: 'numeric'
        });

        let session = sessions.find(s => s.date === date && s.routineId === log.routine_id);

        if (!session) {
            session = {
                date,
                timestamp: new Date(log.completed_at),
                routineId: log.routine_id,
                routineName: log.routine?.name || "Entrenamiento Libre",
                exercises: [],
                totalSets: 0,
                totalVolume: 0
            };
            sessions.push(session);
        }

        session.totalSets += 1;
        session.totalVolume += (log.weight || 0) * (log.reps || 0);

        // Add simplified exercise stats
        if (!session.exercises.includes(log.exercise?.name)) {
            session.exercises.push(log.exercise?.name);
        }
    });

    return (
        <div className="space-y-8 pb-24">
            <div>
                <h1 className="text-4xl font-black text-white italic uppercase tracking-tight">Historial</h1>
                <p className="text-gray-400">Tus sesiones de entrenamiento pasadas.</p>
            </div>

            <div className="space-y-4">
                {sessions.length > 0 ? (
                    sessions.map((session, idx) => (
                        <CrystalCard key={idx} className="p-6">
                            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                <div>
                                    <div className="flex items-center gap-2 text-neon-cyan mb-1">
                                        <Calendar className="h-4 w-4" />
                                        <span className="text-xs font-bold uppercase tracking-widest">{session.date}</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-white uppercase italic">{session.routineName}</h3>
                                    <p className="text-sm text-gray-400 mt-1">
                                        {session.exercises.slice(0, 3).join(", ")}
                                        {session.exercises.length > 3 && ` +${session.exercises.length - 3} más`}
                                    </p>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-center md:text-right">
                                        <p className="text-[10px] uppercase font-bold text-gray-500">Sets</p>
                                        <p className="text-xl font-bold text-white">{session.totalSets}</p>
                                    </div>
                                    <div className="text-center md:text-right">
                                        <p className="text-[10px] uppercase font-bold text-gray-500">Volumen</p>
                                        <p className="text-xl font-bold text-white">{(session.totalVolume / 1000).toFixed(1)}k <span className="text-xs font-normal text-gray-500">KG</span></p>
                                    </div>
                                    <div className="hidden md:block">
                                        <Trophy className="h-8 w-8 text-yellow-500 opacity-50" />
                                    </div>
                                </div>
                            </div>
                        </CrystalCard>
                    ))
                ) : (
                    <div className="text-center py-20 opacity-50">
                        <Dumbbell className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                        <p className="text-xl text-white">Aún no hay historial.</p>
                        <p className="text-sm text-gray-400">Completa tu primera rutina para verla aquí.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
