"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CrystalCard } from "@/components/crystal/CrystalCard";
import { CrystalButton } from "@/components/crystal/CrystalButton";
import { ArrowLeft, User, Calendar, Dumbbell, Trophy, Mail, Phone, Hash, Plus, X, Search, CheckCircle, UserPlus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function MemberDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const memberId = params.id as string;
    const supabase = createClient();

    const [member, setMember] = useState<any>(null);
    const [currentRoutine, setCurrentRoutine] = useState<any>(null);
    const [currentTrainer, setCurrentTrainer] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAssigning, setIsAssigning] = useState(false);

    // Routine Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [availableRoutines, setAvailableRoutines] = useState<any[]>([]);

    // Trainer Modal State
    const [isTrainerModalOpen, setIsTrainerModalOpen] = useState(false);
    const [availableTrainers, setAvailableTrainers] = useState<any[]>([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRoutine, setSelectedRoutine] = useState<string | null>(null);
    const [selectedTrainer, setSelectedTrainer] = useState<string | null>(null);

    useEffect(() => {
        if (memberId) {
            fetchMemberDetails();
        }
    }, [memberId]);

    const fetchMemberDetails = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Profile
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", memberId)
                .single();

            if (profileError) throw profileError;
            setMember(profile);

            // 2. Fetch Active Routine
            // We look for the most recent assignment that is active
            const { data: assignment, error: assignmentError } = await supabase
                .from("user_routines")
                .select(`
                    *,
                    routine:routines (*)
                `)
                .eq("user_id", memberId)
                .eq("status", "active")
                .order("assigned_at", { ascending: false })
                .limit(1)
                .single();

            if (!assignmentError && assignment) {
                setCurrentRoutine(assignment);
            } else {
                setCurrentRoutine(null);
            }

            // 3. Fetch Assigned Trainer
            const { data: trainerAssig, error: trainerError } = await supabase
                .from("trainer_assignments")
                .select(`
                    *,
                    trainer:profiles!trainer_id (id, full_name, avatar_url)
                `)
                .eq("client_id", memberId)
                .eq("status", "active")
                .limit(1)
                .single();

            if (!trainerError && trainerAssig) {
                setCurrentTrainer(trainerAssig);
            } else {
                setCurrentTrainer(null);
            }

        } catch (err) {
            console.error("Error fetching details:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAvailableRoutines = async () => {
        const { data } = await supabase
            .from("routines")
            .select("*")
            .order("name");
        setAvailableRoutines(data || []);
    };

    const fetchAvailableTrainers = async () => {
        const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("role", "trainer")
            .order("full_name");
        setAvailableTrainers(data || []);
    };

    const handleOpenModal = () => {
        setIsModalOpen(true);
        fetchAvailableRoutines();
    };

    const handleOpenTrainerModal = () => {
        setIsTrainerModalOpen(true);
        fetchAvailableTrainers();
    };

    const handleAssignTrainer = async () => {
        if (!selectedTrainer) return;
        setIsAssigning(true);

        try {
            // 1. Deactivate current active trainer for this client if any
            if (currentTrainer) {
                await supabase
                    .from("trainer_assignments")
                    .update({ status: "archived" })
                    .eq("client_id", memberId);
            }

            // 2. Create new assignment
            const { error } = await supabase
                .from("trainer_assignments")
                .insert({
                    trainer_id: selectedTrainer,
                    client_id: memberId,
                    status: "active",
                    assigned_at: new Date().toISOString()
                });

            if (error) throw error;

            await fetchMemberDetails();
            setIsTrainerModalOpen(false);
            setSelectedTrainer(null);
            alert("Entrenador asignado correctamente");

        } catch (err: any) {
            console.error("Error trainer assignment:", err);
            alert("Error al asignar entrenador");
        } finally {
            setIsAssigning(false);
        }
    };

    const handleAssignRoutine = async () => {
        if (!selectedRoutine) return;
        setIsAssigning(true);

        try {
            // 1. Deactivate current active routine if any
            if (currentRoutine) {
                await supabase
                    .from("user_routines")
                    .update({ status: "archived" })
                    .eq("id", currentRoutine.id);
            }

            // 2. Create new assignment
            const { error } = await supabase
                .from("user_routines")
                .insert({
                    user_id: memberId,
                    routine_id: selectedRoutine,
                    status: "active",
                    assigned_at: new Date().toISOString()
                });

            if (error) throw error;

            // 3. Refresh
            await fetchMemberDetails();
            setIsModalOpen(false);
            setSelectedRoutine(null);
            alert("Rutina asignada correctamente");

        } catch (err: any) {
            console.error("Error assigning routine:", err);
            alert("Error al asignar: " + err.message);
        } finally {
            setIsAssigning(false);
        }
    };

    if (isLoading) {
        return <div className="p-20 text-center text-neon-cyan animate-pulse">Cargando perfil...</div>;
    }

    if (!member) {
        return <div className="p-20 text-center text-red-500">No se encontró el socio.</div>;
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            {/* Header / Nav */}
            <div className="flex items-center gap-4">
                <Link href="/admin/members" className="p-2 rounded-xl bg-white/5 hover:text-white text-gray-400 border border-white/10 transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-white uppercase italic tracking-tight">Detalle de Socio</h1>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{member.id}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Profile Card */}
                <div className="space-y-6">
                    <CrystalCard className="p-6 text-center space-y-6 relative overflow-hidden" hoverEffect={false}>
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-neon-cyan/10 to-transparent" />

                        <div className="relative mx-auto h-32 w-32 rounded-full p-1 border-2 border-neon-cyan/30 shadow-[0_0_30px_rgba(0,243,255,0.1)]">
                            <div className="h-full w-full rounded-full bg-black overflow-hidden relative">
                                {member.avatar_url ? (
                                    <img src={member.avatar_url} alt={member.full_name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-gray-900">
                                        <User className="h-12 w-12 text-gray-600" />
                                    </div>
                                )}
                            </div>
                            <div className="absolute bottom-1 right-1 h-6 w-6 bg-green-500 rounded-full border-4 border-black animate-pulse" />
                        </div>

                        <div>
                            <h2 className="text-xl font-black text-white uppercase">{member.full_name}</h2>
                            <span className="text-xs font-mono text-neon-cyan uppercase tracking-widest">Socio {member.rank_name || 'Estándar'}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-left">
                            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                <label className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase font-black mb-1">
                                    <Mail className="h-3 w-3" /> Email
                                </label>
                                <div className="text-xs text-white truncate" title={member.email}>{member.email}</div>
                            </div>
                            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                <label className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase font-black mb-1">
                                    <Phone className="h-3 w-3" /> Teléfono
                                </label>
                                <div className="text-xs text-white">{member.phone || '-'}</div>
                            </div>
                            <div className="col-span-2 p-3 rounded-xl bg-white/5 border border-white/5">
                                <label className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase font-black mb-1">
                                    <Calendar className="h-3 w-3" /> Miembro Desde
                                </label>
                                <div className="text-xs text-white">{new Date(member.created_at).toLocaleDateString()}</div>
                            </div>
                        </div>
                    </CrystalCard>

                    {/* Stats Summary (Placeholder) */}
                    <CrystalCard className="p-6 space-y-4" hoverEffect={false}>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">Estadísticas</h3>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                            <span className="text-xs text-gray-400">Asistencias Mes</span>
                            <span className="text-lg font-bold text-white">12</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                            <span className="text-xs text-gray-400">Racha Actual</span>
                            <span className="text-lg font-bold text-neon-cyan">3 días</span>
                        </div>
                    </CrystalCard>
                </div>

                {/* Right Column: Routine & Activity */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Active Routine Card */}
                    <CrystalCard className="p-8 relative min-h-[300px] flex flex-col" hoverEffect={false}>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-sm font-black text-neon-cyan uppercase tracking-widest mb-1">Rutina Actual</h3>
                                <h2 className="text-3xl font-black text-white italic tracking-tight uppercase">
                                    {currentRoutine ? currentRoutine.routine.name : "Sin Asignar"}
                                </h2>
                            </div>
                            <CrystalButton
                                onClick={handleOpenModal}
                                className="text-xs px-6 py-2 shadow-[0_0_15px_rgba(0,243,255,0.15)]"
                            >
                                {currentRoutine ? "CAMBIAR RUTINA" : "ASIGNAR RUTINA"}
                            </CrystalButton>
                        </div>

                        {currentRoutine ? (
                            <div className="flex-1 flex flex-col gap-6">
                                <div className="flex gap-4 text-sm text-gray-300">
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                        <Trophy className="h-4 w-4 text-yellow-500" />
                                        <span className="uppercase font-bold text-[10px]">{currentRoutine.routine.difficulty}</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                        <Dumbbell className="h-4 w-4 text-purple-400" />
                                        <span className="uppercase font-bold text-[10px]">{currentRoutine.routine.exercise_count} Ejercicios</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                        <Calendar className="h-4 w-4 text-blue-400" />
                                        <span className="uppercase font-bold text-[10px]">{new Date(currentRoutine.assigned_at).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <p className="text-gray-400 text-sm leading-relaxed max-w-2xl bg-black/20 p-4 rounded-xl border border-white/5">
                                    {currentRoutine.routine.description || "Sin descripción disponible."}
                                </p>

                                {currentRoutine.routine.image_url && (
                                    <div className="mt-auto h-48 w-full rounded-2xl overflow-hidden relative border border-white/10">
                                        <img src={currentRoutine.routine.image_url} alt="Cover" className="h-full w-full object-cover opacity-60 hover:opacity-80 transition-opacity" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 border-2 border-dashed border-white/10 rounded-2xl m-4">
                                <Dumbbell className="h-12 w-12 text-gray-600 mb-3" />
                                <p className="text-gray-400 font-bold uppercase text-sm">El socio no tiene una rutina activa.</p>
                                <p className="text-gray-600 text-xs mt-1">Asigna un protocolo para comenzar el seguimiento.</p>
                            </div>
                        )}
                    </CrystalCard>

                    {/* Trainer Assignment Card */}
                    <CrystalCard className="p-8 relative min-h-[250px] flex flex-col" hoverEffect={false}>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-sm font-black text-neon-cyan uppercase tracking-widest mb-1">Entrenador Personal</h3>
                                <h2 className="text-2xl font-black text-white italic tracking-tight uppercase">
                                    {currentTrainer ? currentTrainer.trainer.full_name : "Sin Entrenador"}
                                </h2>
                            </div>
                            <CrystalButton
                                onClick={handleOpenTrainerModal}
                                className="text-xs px-6 py-2 bg-white/5 border-white/10"
                                variant="secondary"
                            >
                                {currentTrainer ? "CAMBIAR" : "ASIGNAR"}
                            </CrystalButton>
                        </div>

                        {currentTrainer ? (
                            <div className="flex items-center gap-6 p-4 rounded-2xl bg-white/5 border border-white/5">
                                <div className="h-16 w-16 rounded-xl bg-neon-cyan/20 flex items-center justify-center border border-neon-cyan/30 overflow-hidden shrink-0">
                                    {currentTrainer.trainer.avatar_url ? (
                                        <img src={currentTrainer.trainer.avatar_url} className="h-full w-full object-cover" />
                                    ) : (
                                        <User className="h-8 w-8 text-neon-cyan" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400 leading-relaxed font-medium">Este socio está bajo la supervisión técnica de {currentTrainer.trainer.full_name}.</p>
                                    <div className="flex gap-2 mt-2">
                                        <span className="text-[10px] font-black text-neon-cyan uppercase tracking-widest bg-neon-cyan/10 px-2 py-0.5 rounded">Verificado</span>
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">Status: Activo</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 border-2 border-dashed border-white/10 rounded-2xl">
                                <UserPlus className="h-10 w-10 text-gray-500 mb-2" />
                                <p className="text-xs font-bold uppercase text-gray-500">No hay un entrenador asignado</p>
                            </div>
                        )}
                    </CrystalCard>
                </div>
            </div>

            {/* Assignment Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                    <CrystalCard className="w-full max-w-2xl flex flex-col max-h-[85vh] p-0 overflow-hidden shadow-2xl border-neon-cyan/20" hoverEffect={false}>
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40">
                            <div>
                                <h3 className="text-xl font-black text-white uppercase italic">Seleccionar Protocolo</h3>
                                <p className="text-xs text-gray-500 font-bold uppercase">Asignando a {member.full_name}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="hover:text-red-400 text-gray-500 transition-colors">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-4 bg-white/5 border-b border-white/5">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <input
                                    placeholder="Buscar rutina..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 text-white outline-none focus:border-neon-cyan/50"
                                    autoFocus
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {availableRoutines
                                .filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map(routine => (
                                    <button
                                        key={routine.id}
                                        onClick={() => setSelectedRoutine(routine.id)}
                                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${selectedRoutine === routine.id
                                            ? "bg-neon-cyan/10 border-neon-cyan/50 ring-1 ring-neon-cyan"
                                            : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            {routine.image_url && (
                                                <div className="h-12 w-12 rounded-lg bg-black overflow-hidden border border-white/10">
                                                    <img src={routine.image_url} className="h-full w-full object-cover" />
                                                </div>
                                            )}
                                            <div>
                                                <h4 className={`font-bold uppercase text-sm ${selectedRoutine === routine.id ? "text-neon-cyan" : "text-white"}`}>
                                                    {routine.name}
                                                </h4>
                                                <div className="flex gap-2 text-[10px] text-gray-400 mt-1 uppercase font-bold">
                                                    <span>{routine.difficulty}</span>
                                                    <span>•</span>
                                                    <span>{routine.exercise_count} Ejercicios</span>
                                                </div>
                                            </div>
                                        </div>
                                        {selectedRoutine === routine.id && <CheckCircle className="h-5 w-5 text-neon-cyan" />}
                                    </button>
                                ))}
                        </div>

                        <div className="p-6 border-t border-white/10 bg-black/40 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-3 rounded-xl text-gray-400 hover:text-white text-xs font-bold uppercase transition-colors"
                            >
                                Cancelar
                            </button>
                            <CrystalButton
                                onClick={handleAssignRoutine}
                                isLoading={isAssigning}
                                disabled={!selectedRoutine}
                                className={`px-8 ${!selectedRoutine ? 'opacity-50 cursor-not-allowed' : 'shadow-[0_0_20px_rgba(0,243,255,0.2)]'}`}
                            >
                                Confirmar Asignación
                            </CrystalButton>
                        </div>
                    </CrystalCard>
                </div>
            )}
            {/* Trainer Assignment Modal */}
            {isTrainerModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                    <CrystalCard className="w-full max-w-lg flex flex-col max-h-[80vh] p-0 overflow-hidden shadow-2xl border-white/10" hoverEffect={false}>
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40">
                            <div>
                                <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Asignar Entrenador</h3>
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-0.5">Seleccionar staff técnico</p>
                            </div>
                            <button onClick={() => setIsTrainerModalOpen(false)} className="hover:text-red-400 text-gray-500 transition-colors">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {availableTrainers.map(trainer => (
                                <button
                                    key={trainer.id}
                                    onClick={() => setSelectedTrainer(trainer.id)}
                                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${selectedTrainer === trainer.id
                                        ? "bg-neon-cyan/10 border-neon-cyan/50 ring-1 ring-neon-cyan"
                                        : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                                        }`}
                                >
                                    <div className="h-12 w-12 rounded-xl bg-black overflow-hidden border border-white/10 shrink-0">
                                        {trainer.avatar_url ? (
                                            <img src={trainer.avatar_url} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center bg-gray-900">
                                                <User className="h-5 w-5 text-gray-600" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-bold uppercase text-sm truncate ${selectedTrainer === trainer.id ? "text-neon-cyan" : "text-white"}`}>
                                            {trainer.full_name}
                                        </p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widst">Personal Trainer</p>
                                    </div>
                                    {selectedTrainer === trainer.id && <CheckCircle className="h-5 w-5 text-neon-cyan" />}
                                </button>
                            ))}
                        </div>

                        <div className="p-6 border-t border-white/10 bg-black/40 flex justify-end gap-3">
                            <button
                                onClick={() => setIsTrainerModalOpen(false)}
                                className="px-6 py-3 rounded-xl text-gray-400 hover:text-white text-xs font-bold uppercase transition-colors"
                            >
                                Cancelar
                            </button>
                            <CrystalButton
                                onClick={handleAssignTrainer}
                                isLoading={isAssigning}
                                disabled={!selectedTrainer}
                                className={`px-8 ${!selectedTrainer ? 'opacity-50 cursor-not-allowed' : 'shadow-[0_0_20px_rgba(0,243,255,0.2)]'}`}
                            >
                                Confirmar Entrenador
                            </CrystalButton>
                        </div>
                    </CrystalCard>
                </div>
            )}
        </div>
    );
}
