import { createClient } from "@/lib/supabase/server";
import { QRCrystal } from "@/components/crystal/QRCrystal";
import { CrystalCard } from "@/components/crystal/CrystalCard";
import { Info } from "lucide-react";

export default async function QRPage() {
    const supabase = await createClient();

    if (!supabase) return null;

    const { data: { user } } = await supabase.auth.getUser();

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-white tracking-tight">Acceso Digital</h1>
                <p className="text-gray-400">Escanea este código en el tótem de entrada para ingresar.</p>
            </div>

            <QRCrystal
                token={profile?.qr_code_token || user?.id || "demo-token"}
                userName={profile?.full_name || "Miembro"}
            />

            <CrystalCard className="max-w-md p-6 border-neon-cyan/10 bg-neon-cyan/5">
                <div className="flex gap-3">
                    <Info className="h-5 w-5 text-neon-cyan shrink-0" />
                    <p className="text-xs text-gray-400 leading-relaxed">
                        Este código es intransferible y dinámico. Si tienes problemas de acceso, contacta con recepción o asegúrate de tener una membresía activa.
                    </p>
                </div>
            </CrystalCard>
        </div>
    );
}
