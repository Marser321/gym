"use client";

import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ChevronLeft, User, Loader2 } from "lucide-react";
import { CrystalCard } from "@/components/crystal/CrystalCard";
import Link from "next/link";

export default function TrainerChatPage() {
    const params = useParams();
    const router = useRouter();
    const clientId = params.id as string;
    const supabase = createClient();

    const [client, setClient] = useState<any>(null);
    const [myUser, setMyUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [clientId]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setMyUser(user);

            const { data: profile, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", clientId)
                .single();

            if (error) throw error;
            setClient(profile);
        } catch (err) {
            console.error("Error loading chat:", err);
            router.push("/admin/my-clients");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-neon-cyan" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/admin/my-clients" className="p-2 rounded-xl bg-white/5 hover:text-white text-gray-400 border border-white/10 transition-colors">
                    <ChevronLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-white uppercase italic tracking-tight">Chat con Alumno</h1>
                    <p className="text-neon-cyan text-[10px] font-black uppercase tracking-widest">Soporte Técnico Especializado</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Profile Card Sidebar */}
                <div className="lg:col-span-1">
                    <CrystalCard className="p-6 text-center space-y-4" hoverEffect={false}>
                        <div className="h-20 w-20 rounded-full bg-white/5 border border-white/10 mx-auto flex items-center justify-center overflow-hidden">
                            {client.avatar_url ? (
                                <img src={client.avatar_url} className="h-full w-full object-cover" />
                            ) : (
                                <User className="h-10 w-10 text-gray-500" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold text-white uppercase tracking-tight">{client.full_name}</h3>
                            <p className="text-xs text-gray-500 uppercase font-bold">Nivel {client.level || 1} • {client.rank_name || 'Miembro'}</p>
                        </div>
                        <div className="pt-4 border-t border-white/5 space-y-2">
                            <div className="flex justify-between text-[10px] items-center">
                                <span className="text-gray-500 uppercase font-black">XP Total</span>
                                <span className="text-white font-bold">{client.xp || 0}</span>
                            </div>
                            <div className="flex justify-between text-[10px] items-center">
                                <span className="text-gray-500 uppercase font-black">Rango</span>
                                <span className="text-neon-cyan font-bold uppercase">{client.rank_name || 'Standard'}</span>
                            </div>
                        </div>
                    </CrystalCard>
                </div>

                {/* Chat Area */}
                <div className="lg:col-span-3">
                    <ChatWindow
                        userId={myUser.id}
                        partnerId={clientId}
                        partnerName={client.full_name}
                    />
                </div>
            </div>
        </div>
    );
}
