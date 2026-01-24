import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { MessageSquare } from "lucide-react";

export default async function ChatPage() {
    const supabase = await createClient();

    if (!supabase) redirect("/login");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    // Fetch Assigned Trainer
    const { data: assignment } = await supabase
        .from("trainer_assignments")
        .select(`
            trainer:profiles!trainer_id (id, full_name)
        `)
        .eq("client_id", user.id)
        .eq("status", "active")
        .maybeSingle();

    if (!assignment) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white/5 border border-white/10 rounded-3xl mx-auto max-w-2xl mt-10">
                <MessageSquare className="h-12 w-12 text-gray-600 mb-6" />
                <h2 className="text-2xl font-bold text-white mb-2 uppercase italic tracking-tight">Sin Entrenador Asignado</h2>
                <p className="text-gray-400 mb-6 max-w-sm">Todavía no tenés un entrenador personal asignado. Contactate con la administración del gimnasio para habilitar el chat.</p>
            </div>
        );
    }

    const trainer = (assignment.trainer as any);

    return (
        <div className="space-y-8 pb-24">
            <div>
                <h1 className="text-4xl font-black text-white italic uppercase tracking-tight">Nexus Chat</h1>
                <p className="text-gray-400 font-medium">Conversación directa con tu Personal Trainer.</p>
            </div>

            <div className="max-w-4xl mx-auto">
                <ChatWindow
                    userId={user.id}
                    partnerId={trainer.id}
                    partnerName={trainer.full_name}
                />
            </div>
        </div>
    );
}
