"use client";

import { CrystalCard } from "@/components/crystal/CrystalCard";
import { CrystalButton } from "@/components/crystal/CrystalButton";
import { Dumbbell, Clock, Users, MoreVertical, Plus, Loader2, X, Check, Trash2, Camera } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ServicesPage() {
    const [services, setServices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<any>(null);
    const supabase = createClient();

    // Form states
    const [title, setTitle] = useState("");
    const [instructor, setInstructor] = useState("");
    const [schedule, setSchedule] = useState("");
    const [capacity, setCapacity] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [status, setStatus] = useState("active");

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("gym_services")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setServices(data || []);
        } catch (err) {
            console.error("Error fetching services:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (service: any = null) => {
        if (service) {
            setEditingService(service);
            setTitle(service.title);
            setInstructor(service.instructor);
            setSchedule(service.schedule);
            setCapacity(service.capacity_text);
            setImageUrl(service.image_url);
            setStatus(service.status);
        } else {
            setEditingService(null);
            setTitle("");
            setInstructor("");
            setSchedule("");
            setCapacity("");
            setImageUrl("https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470");
            setStatus("active");
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const serviceData = {
            title,
            instructor,
            schedule,
            capacity_text: capacity,
            image_url: imageUrl,
            status
        };

        try {
            if (editingService) {
                const { error } = await supabase
                    .from("gym_services")
                    .update(serviceData)
                    .eq("id", editingService.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("gym_services")
                    .insert([serviceData]);
                if (error) throw error;
            }

            setIsModalOpen(false);
            fetchServices();
        } catch (err: any) {
            alert("Error al guardar: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar esta clase permanentemente?")) return;
        try {
            const { error } = await supabase.from("gym_services").delete().eq("id", id);
            if (error) throw error;
            setServices(prev => prev.filter(s => s.id !== id));
        } catch (err: any) {
            alert("Error al eliminar: " + err.message);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight italic">Servicios y Clases</h1>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-1">Gestión de la agenda y disponibilidad elite</p>
                </div>
                <CrystalButton onClick={() => handleOpenModal()} className="shadow-[0_0_20px_rgba(0,243,255,0.2)]">
                    <Plus className="h-4 w-4 mr-2" /> NUEVA CLASE
                </CrystalButton>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-10 w-10 animate-spin text-neon-cyan" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services.map((service) => (
                        <CrystalCard key={service.id} className="group overflow-hidden border-white/5 hover:border-neon-cyan/30 transition-all flex flex-col" hoverEffect={false}>
                            {/* Image Header */}
                            <div className="relative h-52 w-full overflow-hidden">
                                <Image
                                    src={service.image_url || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470'}
                                    alt={service.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-70"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-deep-charcoal via-deep-charcoal/20 to-transparent" />

                                <div className="absolute top-4 right-4 flex gap-2">
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border ${service.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                        {service.status === 'active' ? 'Activa' : 'Cancelada'}
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 flex-1 flex flex-col bg-deep-charcoal/40 relative">
                                <div className="space-y-1 mb-4">
                                    <h3 className="text-xl font-black text-white italic uppercase tracking-tight group-hover:text-neon-cyan transition-colors">
                                        {service.title}
                                    </h3>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Instructor: {service.instructor}</p>
                                </div>

                                <div className="space-y-3 flex-1">
                                    <div className="flex items-center gap-3 text-sm text-gray-300 font-medium">
                                        <div className="h-8 w-8 rounded-lg bg-neon-cyan/10 flex items-center justify-center border border-neon-cyan/20">
                                            <Clock className="h-4 w-4 text-neon-cyan" />
                                        </div>
                                        <span>{service.schedule}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-300 font-medium">
                                        <div className="h-8 w-8 rounded-lg bg-neon-cyan/10 flex items-center justify-center border border-neon-cyan/20">
                                            <Users className="h-4 w-4 text-neon-cyan" />
                                        </div>
                                        <span>Capacidad: <span className={service.capacity_text === 'Full' ? 'text-red-400 font-black' : 'text-white font-black'}>{service.capacity_text}</span></span>
                                    </div>
                                </div>

                                <div className="mt-6 flex gap-3">
                                    <button
                                        onClick={() => handleOpenModal(service)}
                                        className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-neon-cyan/10 text-xs font-black uppercase tracking-widest text-white transition-all border border-white/10 hover:border-neon-cyan/30"
                                    >
                                        Editar Clase
                                    </button>
                                    <button
                                        onClick={() => handleDelete(service.id)}
                                        className="p-3 rounded-xl bg-white/5 hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all border border-white/10 hover:border-red-500/20"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </CrystalCard>
                    ))}

                    {/* Empty State */}
                    {services.length === 0 && (
                        <div className="col-span-full py-20 text-center opacity-30">
                            <Dumbbell className="h-16 w-16 mx-auto mb-4" />
                            <p className="font-black uppercase tracking-[0.3em] text-sm">No hay clases programadas</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal para Crear/Editar */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all animate-in fade-in duration-200">
                    <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />
                    <CrystalCard className="w-full max-w-4xl p-0 overflow-hidden border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative z-10" hoverEffect={false}>
                        <div className="grid grid-cols-1 lg:grid-cols-5 h-full">
                            {/* Form Section */}
                            <div className="lg:col-span-3 p-8 space-y-8 bg-black/40">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tight flex items-center gap-3">
                                            {editingService ? (
                                                <>
                                                    <span className="text-neon-cyan text-4xl">/</span> EDITAR
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-neon-cyan text-4xl">+</span> NUEVA
                                                </>
                                            )}
                                            CLASE
                                        </h2>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1 ml-6">Gestión de identidad visual y agenda</p>
                                    </div>
                                    <button onClick={() => setIsModalOpen(false)} className="group p-2 text-gray-500 hover:text-white transition-colors">
                                        <X className="h-6 w-6 group-hover:rotate-90 transition-transform" />
                                    </button>
                                </div>

                                <form onSubmit={handleSave} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Título</label>
                                            <div className="relative group">
                                                <Dumbbell className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-neon-cyan transition-colors" />
                                                <input
                                                    required placeholder="Ej: CrossFit Élite"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm text-white outline-none focus:border-neon-cyan/50 focus:bg-white/10 transition-all font-bold placeholder:text-gray-700"
                                                    value={title} onChange={e => setTitle(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Instructor</label>
                                            <div className="relative group">
                                                <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-neon-cyan transition-colors" />
                                                <input
                                                    required placeholder="Ej: Marcos V."
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm text-white outline-none focus:border-neon-cyan/50 focus:bg-white/10 transition-all font-bold placeholder:text-gray-700"
                                                    value={instructor} onChange={e => setInstructor(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Horario</label>
                                            <div className="relative group">
                                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-neon-cyan transition-colors" />
                                                <input
                                                    required placeholder="07:00 AM - 08:00 AM"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm text-white outline-none focus:border-neon-cyan/50 focus:bg-white/10 transition-all font-bold font-mono placeholder:text-gray-700"
                                                    value={schedule} onChange={e => setSchedule(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Capacidad</label>
                                            <div className="relative group">
                                                <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-neon-cyan transition-colors" />
                                                <input
                                                    required placeholder="08/12 o 'Full'"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm text-white outline-none focus:border-neon-cyan/50 focus:bg-white/10 transition-all font-bold placeholder:text-gray-700"
                                                    value={capacity} onChange={e => setCapacity(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Imagen de Portada (URL)</label>
                                        <div className="relative group">
                                            <Camera className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-neon-cyan transition-colors" />
                                            <input
                                                placeholder="https://..."
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-xs text-white outline-none focus:border-neon-cyan/50 focus:bg-white/10 transition-all font-mono placeholder:text-gray-700 text-ellipsis"
                                                value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Estado</label>
                                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                                            <button
                                                type="button"
                                                onClick={() => setStatus('active')}
                                                className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${status === 'active' ? 'bg-neon-cyan text-black shadow-lg shadow-neon-cyan/20' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                Activa
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setStatus('cancelled')}
                                                className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${status === 'cancelled' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                Inactiva
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <CrystalButton
                                            type="submit"
                                            className="w-full h-14 font-black tracking-widest text-lg shadow-[0_0_30px_rgba(0,243,255,0.15)] hover:shadow-[0_0_50px_rgba(0,243,255,0.3)] border-neon-cyan/30"
                                            isLoading={isSaving}
                                        >
                                            {editingService ? 'GUARDAR CAMBIOS' : 'PUBLICAR CLASE'}
                                        </CrystalButton>
                                    </div>
                                </form>
                            </div>

                            {/* Preview Section */}
                            <div className="lg:col-span-2 relative hidden lg:block bg-black/60 border-l border-white/10">
                                <div className="absolute inset-0 z-0">
                                    <Image
                                        src={imageUrl || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470'}
                                        alt="Preview"
                                        fill
                                        className="object-cover opacity-30 grayscale hover:grayscale-0 transition-all duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                                </div>
                                <div className="relative z-10 h-full flex flex-col justify-end p-8 space-y-4">
                                    <div className="space-y-1">
                                        <div className="inline-flex items-center px-2 py-1 rounded bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-[10px] font-black uppercase tracking-widest mb-2">
                                            Vista Previa
                                        </div>
                                        <h3 className="text-3xl font-black text-white italic uppercase tracking-tight leading-none">
                                            {title || "Título de la clase"}
                                        </h3>
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                                            {instructor || "Nombre del Instructor"}
                                        </p>
                                    </div>
                                    <div className="pt-6 border-t border-white/10 space-y-2">
                                        <div className="flex items-center gap-3 text-sm text-gray-300">
                                            <Clock className="h-4 w-4 text-neon-cyan" />
                                            <span className="font-mono">{schedule || "00:00 AM - 00:00 PM"}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-300">
                                            <Users className="h-4 w-4 text-neon-cyan" />
                                            <span>Cupos: {capacity || "00/00"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CrystalCard>
                </div>
            )}
        </div>
    );
}
