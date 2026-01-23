import { createClient } from "@/lib/supabase/server";
import { TrainerCard } from "@/components/trainers/TrainerCard";
import { CrystalCard } from "@/components/crystal/CrystalCard";

// Fallback image if no avatar
const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1470&auto=format&fit=crop";

export default async function TrainersPage() {
    const supabase = await createClient();

    // Fetch trainers with profile details
    const { data: trainers } = await supabase
        .from("trainers")
        .select(`
      *,
      profiles:user_id ( full_name, avatar_url )
    `)
        .eq("is_active", true);

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-white">Entrenadores Elite</h1>
                <p className="text-gray-400">Encuentra al experto que llevará tu físico al siguiente nivel.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {trainers && trainers.length > 0 ? (
                    trainers.map((trainer: any) => (
                        <TrainerCard
                            key={trainer.id}
                            name={trainer.profiles?.full_name || "Entrenador"}
                            specialty={trainer.specialty || "General"}
                            rating={5.0} // Placeholder rating logic
                            hourlyRate={trainer.hourly_rate}
                            imageUrl={trainer.profiles?.avatar_url || DEFAULT_AVATAR}
                            trainerId={trainer.id}
                        />
                    ))
                ) : (
                    /* Empty State */
                    <CrystalCard className="col-span-full flex flex-col items-center justify-center p-12 text-center opacity-60">
                        <p className="text-lg text-gray-300">Aún no hay entrenadores disponibles.</p>
                    </CrystalCard>
                )}
            </div>
        </div>
    );
}
