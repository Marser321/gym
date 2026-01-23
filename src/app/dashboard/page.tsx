import { createClient } from "@/lib/supabase/server";
import { QRCrystal } from "@/components/crystal/QRCrystal";
import { CrystalCard } from "@/components/crystal/CrystalCard";
import { ProgressRing } from "@/components/crystal/ProgressRing";
import { LevelProgress } from "@/components/gamification/LevelProgress";
import { Dumbbell, Trophy, Users } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch user profile securely
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

    return (
        <div className="space-y-6">
            <div className="flex flex-col items-center space-y-2 text-center md:items-start md:text-left">
                <h1 className="text-2xl font-bold text-white">
                    Hola, <span className="text-neon-cyan">{profile?.full_name?.split(' ')[0] || 'Atleta'}</span>
                </h1>
                <p className="text-sm text-gray-400">Listo para romper tus límites hoy?</p>
            </div>

            {/* Access Card (QR) */}
            <div className="flex justify-center py-4">
                <QRCrystal
                    token={profile?.qr_code_token || user?.id || "demo-token"}
                    userName={profile?.full_name || "Miembro Premium"}
                />
            </div>

            {/* Gamification Stats */}
            <div className="space-y-4">
                <LevelProgress
                    level={12}
                    xp={2450}
                    nextLevelXp={3000}
                    rankName="Oro"
                />

                {/* Mini Badges Preview - to be moved to profile later */}
                {/* <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                     Badges will go here in profile
                </div> */}
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white">Acciones Rápidas</h2>
                <div className="grid grid-cols-1 gap-3">
                    <Link href="/dashboard/routines">
                        <CrystalCard className="flex items-center space-x-4 p-4 hover:bg-white/5 cursor-pointer" tilt>
                            <div className="bg-neon-cyan/10 p-3 rounded-xl border border-neon-cyan/20">
                                <Dumbbell className="h-6 w-6 text-neon-cyan" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Mi Rutina de Hoy</h3>
                                <p className="text-xs text-gray-400">Pierna & Hombro • 45 min</p>
                            </div>
                        </CrystalCard>
                    </Link>

                    <Link href="/dashboard/gym-match">
                        <CrystalCard className="flex items-center space-x-4 p-4 hover:bg-white/5 cursor-pointer" tilt>
                            <div className="bg-pink-500/10 p-3 rounded-xl border border-pink-500/20">
                                <Users className="h-6 w-6 text-pink-500" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Gym Match</h3>
                                <p className="text-xs text-gray-400">Encuentra tu spotter ideal</p>
                            </div>
                        </CrystalCard>
                    </Link>
                </div>
            </div>
        </div>
    );
}
