"use client";

import { CrystalCard } from "@/components/crystal/CrystalCard";
import { CrystalButton } from "@/components/crystal/CrystalButton";
import { Dumbbell, Clock, Users, MoreVertical, Plus } from "lucide-react";
import Image from "next/image";

const SERVICES = [
    {
        id: 1,
        title: "CrossFit Élite",
        instructor: "Marcos V.",
        time: "07:00 AM - 08:00 AM",
        capacity: "08/12",
        image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop",
        status: "active"
    },
    {
        id: 2,
        title: "Yoga Flow",
        instructor: "Elena R.",
        time: "09:00 AM - 10:00 AM",
        capacity: "12/15",
        image: "https://images.unsplash.com/photo-1599447421405-0c325d26d77e?q=80&w=1469&auto=format&fit=crop",
        status: "active"
    },
    {
        id: 3,
        title: "Boxeo Técnico",
        instructor: "Javier M.",
        time: "18:00 PM - 19:30 PM",
        capacity: "Full",
        image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=1374&auto=format&fit=crop",
        status: "active"
    },
    {
        id: 4,
        title: "Powerlifting",
        instructor: "Sarah C.",
        time: "20:00 PM - 21:30 PM",
        capacity: "04/06",
        image: "https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?q=80&w=1470&auto=format&fit=crop",
        status: "cancelled"
    }
];

export default function ServicesPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Servicios y Clases</h1>
                    <p className="text-gray-400 text-sm">Gestiona la agenda y disponibilidad</p>
                </div>
                <CrystalButton>
                    <Plus className="h-4 w-4 mr-2" /> Nueva Clase
                </CrystalButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {SERVICES.map((service) => (
                    <CrystalCard key={service.id} className="group overflow-hidden border-white/5 hover:border-neon-cyan/30 transition-all">
                        {/* Image Header */}
                        <div className="relative h-48 w-full">
                            <Image
                                src={service.image}
                                alt={service.title}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-deep-charcoal via-transparent to-transparent" />
                            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10">
                                {service.status === 'active' ? (
                                    <span className="text-green-400">● Activa</span>
                                ) : (
                                    <span className="text-red-400">● Cancelada</span>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 relative">
                            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-neon-cyan transition-colors">
                                {service.title}
                            </h3>
                            <p className="text-sm text-gray-400 mb-4">con {service.instructor}</p>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm text-gray-300">
                                    <Clock className="h-4 w-4 text-neon-cyan" />
                                    <span>{service.time}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-300">
                                    <Users className="h-4 w-4 text-neon-cyan" />
                                    <span>Capacidad: <span className={service.capacity === 'Full' ? 'text-red-400 font-bold' : 'text-white'}>{service.capacity}</span></span>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-2">
                                <button className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium text-white transition-colors border border-white/5 hover:border-white/20">
                                    Editar
                                </button>
                                <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/5">
                                    <MoreVertical className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </CrystalCard>
                ))}
            </div>
        </div>
    );
}
