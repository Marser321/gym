"use client";

import { CrystalCard } from "@/components/crystal/CrystalCard";
import { CrystalButton } from "@/components/crystal/CrystalButton";
import { Search, Filter, MoreVertical, ShieldAlert, CheckCircle } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";

// Mock Data
const MEMBERS = [
    { id: 1, name: "Ana Gonzalez", email: "ana@gmail.com", plan: "Premium Anual", status: "active", due_date: "2026-05-12", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana" },
    { id: 2, name: "Carlos Perez", email: "carlos@hotmail.com", plan: "Mensual", status: "late", due_date: "2026-01-20", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos" },
    { id: 3, name: "Lucia Mendez", email: "lucia@outlook.com", plan: "Pack 10 Clases", status: "active", due_date: "2026-02-15", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucia" },
];

export default function MembersPage() {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Gestión de Socios</h1>
                    <p className="text-gray-400 text-sm">Administra accesos y membresías</p>
                </div>
                <Link href="/admin/members/new">
                    <CrystalButton>
                        + Nuevo Socio
                    </CrystalButton>
                </Link>
            </div>

            {/* Filters Bar */}
            <CrystalCard className="p-4 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, DNI o email..."
                        className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:outline-none focus:border-neon-cyan/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5">
                    <Filter className="h-4 w-4" /> Filtros
                </button>
            </CrystalCard>

            {/* Members Table */}
            <div className="grid gap-4">
                {MEMBERS.map((member) => (
                    <CrystalCard key={member.id} className="p-4 hover:bg-white/5 transition-colors flex flex-col md:flex-row items-center gap-4">
                        {/* Avatar & Info */}
                        <div className="flex items-center gap-4 flex-1 w-full">
                            <div className="relative h-12 w-12 rounded-full overflow-hidden border border-white/10">
                                <Image src={member.avatar} alt={member.name} fill />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">{member.name}</h3>
                                <div className="text-xs text-gray-400">{member.email} • {member.plan}</div>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex flex-1 items-center gap-2 w-full md:w-auto">
                            {member.status === 'active' ? (
                                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20">
                                    <CheckCircle className="h-3 w-3" /> AL DÍA
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20">
                                    <ShieldAlert className="h-3 w-3" /> VENCIDO
                                </span>
                            )}
                            <span className="text-xs text-gray-500 ml-2">Vence: {member.due_date}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg">
                                <MoreVertical className="h-5 w-5" />
                            </button>
                        </div>
                    </CrystalCard>
                ))}
            </div>
        </div>
    );
}
