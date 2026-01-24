"use client";

import { CrystalCard } from "@/components/crystal/CrystalCard";
import { CrystalButton } from "@/components/crystal/CrystalButton";
import { Search, ChevronLeft, UserPlus, Loader2, User, CheckCircle } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { promoteTrainerAction } from "@/app/actions/promote-trainer";

export default function PromoteTrainerPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const supabase = createClient();
    const router = useRouter();

    const handleSearch = async () => {
        if (searchTerm.length < 3) return;
        setIsSearching(true);
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .neq("role", "trainer") // Only people who aren't trainers yet
                .ilike("full_name", `%${searchTerm}%`)
                .limit(10);

            if (error) throw error;
            setResults(data || []);
        } catch (err) {
            console.error("Error searching profiles:", err);
        } finally {
            setIsSearching(false);
        }
    };

    const handlePromote = async (id: string) => {
        if (!confirm("¿Deseas promover a este socio a Entrenador? Tendrá acceso a gestionar sus propios clientes y rutinas.")) return;

        setIsUpdating(id);
        try {
            const { success, error } = await promoteTrainerAction(id);

            if (!success) throw new Error(error);

            router.push("/admin/trainers");
            router.refresh();
        } catch (err: any) {
            console.error("Error promoting:", err);
            alert(`Error al promover al socio: ${err.message || "Desconocido"}`);
        } finally {
            setIsUpdating(null);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <Link href="/admin/trainers" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors">
                <ChevronLeft className="h-4 w-4" /> Volver a Staff
            </Link>

            <div>
                <h1 className="text-3xl font-black text-white italic uppercase tracking-tight italic">Promocionar Staff</h1>
                <p className="text-gray-400">Busca a un socio registrado para otorgarle el rango de Entrenador.</p>
            </div>

            <CrystalCard className="p-6">
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre (min. 3 letras)..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-neon-cyan/50 transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        />
                    </div>
                    <CrystalButton onClick={handleSearch} disabled={isSearching} className="px-8">
                        {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : "BUSCAR"}
                    </CrystalButton>
                </div>
            </CrystalCard>

            <div className="space-y-3">
                {results.map((profile) => (
                    <CrystalCard key={profile.id} className="p-4" hoverEffect={false}>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} className="h-full w-full object-cover" />
                                    ) : (
                                        <User className="h-5 w-5 text-gray-500" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-white uppercase tracking-tight">{profile.full_name}</p>
                                    <p className="text-xs text-gray-500 font-mono">{profile.email || profile.id}</p>
                                </div>
                            </div>

                            <CrystalButton
                                onClick={() => handlePromote(profile.id)}
                                disabled={isUpdating !== null}
                                className="bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20 hover:bg-neon-cyan/20 text-xs px-6"
                            >
                                {isUpdating === profile.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        HACER ENTRENADOR
                                    </>
                                )}
                            </CrystalButton>
                        </div>
                    </CrystalCard>
                ))}

                {searchTerm.length > 0 && results.length === 0 && !isSearching && (
                    <div className="text-center py-12 opacity-40">
                        <p className="text-gray-400">No se encontraron socios.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
