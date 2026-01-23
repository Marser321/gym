"use client";

import { CrystalCard } from "@/components/crystal/CrystalCard";
import { CrystalButton } from "@/components/crystal/CrystalButton";
import { Lock, Save, Globe, Moon, Sun, Bell, Shield } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-white">Configuración</h1>
                <p className="text-gray-400 text-sm">Preferencias generales y seguridad</p>
            </div>

            {/* General Settings */}
            <CrystalCard className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Globe className="h-5 w-5 text-neon-cyan" />
                    <h3 className="text-lg font-bold text-white">Información del Gimnasio</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Nombre del Centro</label>
                        <input
                            type="text"
                            defaultValue="Gym Premium Fitness"
                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-neon-cyan/50 transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Email de Contacto</label>
                        <input
                            type="email"
                            defaultValue="contacto@gympremium.com"
                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-neon-cyan/50 transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Teléfono</label>
                        <input
                            type="text"
                            defaultValue="+598 99 123 456"
                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-neon-cyan/50 transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Dirección</label>
                        <input
                            type="text"
                            defaultValue="Av. Principal 1234, Montevideo"
                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-neon-cyan/50 transition-colors"
                        />
                    </div>
                </div>
            </CrystalCard>

            {/* Security Settings */}
            <CrystalCard className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Shield className="h-5 w-5 text-neon-purple" />
                    <h3 className="text-lg font-bold text-white">Seguridad</h3>
                </div>

                <div className="p-4 rounded-xl bg-deep-charcoal border border-white/5 mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-neon-cyan/10 flex items-center justify-center text-neon-cyan">
                                <Lock className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white">PIN de Administrador</h4>
                                <p className="text-sm text-gray-400">Usado para ingresar al panel de control</p>
                            </div>
                        </div>
                        <button className="px-4 py-2 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-colors text-sm">
                            Cambiar PIN
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between py-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <Bell className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-300">Notificaciones de nuevos socios</span>
                    </div>
                    <div className="relative inline-block w-12 h-6 rounded-full bg-neon-cyan/20 cursor-pointer">
                        <span className="absolute left-6 top-1 block w-4 h-4 rounded-full bg-neon-cyan transition-transform" />
                    </div>
                </div>
            </CrystalCard>

            {/* Appearance */}
            <CrystalCard className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Moon className="h-5 w-5 text-gray-300" />
                    <h3 className="text-lg font-bold text-white">Apariencia</h3>
                </div>

                <div className="flex gap-4">
                    <div className="flex-1 p-4 rounded-xl border border-neon-cyan bg-neon-cyan/5 cursor-pointer">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-4 w-4 rounded-full border-4 border-neon-cyan" />
                            <span className="font-bold text-white">Dark Mode</span>
                        </div>
                        <p className="text-xs text-gray-400">Tema oscuro predeterminado (Recomendado)</p>
                    </div>
                    <div className="flex-1 p-4 rounded-xl border border-white/10 bg-black/20 opacity-50 cursor-not-allowed">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-4 w-4 rounded-full border border-gray-500" />
                            <span className="font-bold text-gray-400">Light Mode</span>
                        </div>
                        <p className="text-xs text-gray-500">No disponible en esta versión</p>
                    </div>
                </div>
            </CrystalCard>

            <div className="flex justify-end pt-4">
                <CrystalButton size="lg" className="w-full md:w-auto px-8">
                    <Save className="h-5 w-5 mr-2" />
                    Guardar Cambios
                </CrystalButton>
            </div>
        </div>
    );
}
