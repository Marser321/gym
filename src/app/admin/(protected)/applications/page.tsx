"use client";

import { CrystalCard } from "@/components/crystal/CrystalCard";
import { CrystalButton } from "@/components/crystal/CrystalButton";
import { Check, X, Clock, Mail, Phone, Dumbbell, User, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ApplicationsPage() {
    const [applications, setApplications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("membership_requests")
                .select("*")
                .eq("status", "pending")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setApplications(data || []);
        } catch (err) {
            console.error("Error fetching applications:", err);
            // Fallback mock para demo
            setApplications([
                {
                    id: "demo-1",
                    full_name: "Ignacio Techera",
                    email: "ignacio@tech.com",
                    phone: "099 123 456",
                    goal: "Hipertrofia",
                    created_at: new Date().toISOString()
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (id: string, action: 'approved' | 'rejected') => {
        try {
            const { error } = await supabase
                .from("membership_requests")
                .update({ status: action })
                .eq("id", id);

            if (error) throw error;

            setApplications(prev => prev.filter(app => app.id !== id));
        } catch (err) {
            console.error(`Error ${action} application:`, err);
            // Fallback manual para demo
            setApplications(prev => prev.filter(app => app.id !== id));
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
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white uppercase tracking-tight">Solicitudes de Membresía</h1>
                <p className="text-gray-400 text-sm">Nuevos prospectos que quieren unirse al GYM Premium.</p>
            </div>

            <div className="grid gap-4">
                {applications.length === 0 ? (
                    <CrystalCard className="p-12 text-center opacity-50">
                        <p className="text-gray-400 font-medium">No hay solicitudes pendientes.</p>
                    </CrystalCard>
                ) : (
                    applications.map((app) => (
                        <CrystalCard key={app.id} className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div className="flex gap-4 items-start">
                                    <div className="h-12 w-12 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center shrink-0">
                                        <User className="h-6 w-6 text-neon-cyan" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-bold text-white uppercase tracking-tight italic">{app.full_name}</h3>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 font-medium">
                                            <span className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer">
                                                <Mail className="h-3 w-3 text-neon-cyan" /> {app.email}
                                            </span>
                                            <span className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer">
                                                <Phone className="h-3 w-3 text-neon-cyan" /> {app.phone}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Dumbbell className="h-3 w-3 text-neon-cyan" /> {app.goal}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono italic">
                                        <Clock className="h-3 w-3 text-neon-cyan/50" />
                                        {new Date(app.created_at).toLocaleDateString()} {new Date(app.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>

                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <CrystalButton
                                            size="sm"
                                            onClick={() => handleAction(app.id, 'approved')}
                                            className="bg-green-500/20 text-green-400 border-green-500/40 hover:bg-green-500 hover:text-white"
                                        >
                                            <Check className="h-4 w-4 mr-2" />
                                            APROBAR
                                        </CrystalButton>
                                        <CrystalButton
                                            size="sm"
                                            variant="danger"
                                            onClick={() => handleAction(app.id, 'rejected')}
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            RECHAZAR
                                        </CrystalButton>
                                    </div>
                                </div>
                            </div>
                        </CrystalCard>
                    ))
                )}
            </div>
        </div>
    );
}
