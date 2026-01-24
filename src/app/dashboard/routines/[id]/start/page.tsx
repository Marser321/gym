import { createClient } from "@/lib/supabase/server";
import { WorkoutPlayer } from "@/components/workout/WorkoutPlayer";
import { redirect } from "next/navigation";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function StartRoutinePage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    if (!supabase) {
        return <div>Error de configuración</div>;
    }

    // 1. Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect("/login");
    }

    // 2. Fetch Routine Header
    const { data: routine, error: routineError } = await supabase
        .from("routines")
        .select("id, name")
        .eq("id", id)
        .single();

    if (routineError || !routine) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white">
                <p>Rutina no encontrada.</p>
            </div>
        );
    }

    // 3. Fetch Exercises with Details
    const { data: rawExercises, error: exercisesError } = await supabase
        .from("routine_exercises")
        .select(`
            *,
            exercise:exercises (
                id,
                name,
                muscle_group,
                video_url
            )
        `)
        .eq("routine_id", id)
        .order("order_index");

    if (exercisesError) {
        console.error("Error fetching exercises:", exercisesError);
        return <div>Error al cargar ejercicios.</div>;
    }

    // Transform to cleaner format for player
    const exercises = rawExercises?.map((item: any) => ({
        id: item.exercise.id,
        name: item.exercise.name,
        muscle_group: item.exercise.muscle_group,
        video_url: item.exercise.video_url,
        sets: item.sets,
        reps: item.reps,
        rest_seconds: item.rest_seconds,
        order_index: item.order_index
    })) || [];

    return (
        <WorkoutPlayer
            routine={routine}
            exercises={exercises}
            userId={user.id}
        />
    );
}
