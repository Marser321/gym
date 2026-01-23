"use client";

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import { CrystalCard } from "../crystal/CrystalCard";

const data = [
    { subject: 'Fuerza', A: 120, fullMark: 150 },
    { subject: 'Cardio', A: 98, fullMark: 150 },
    { subject: 'Movilidad', A: 86, fullMark: 150 },
    { subject: 'Recuperación', A: 99, fullMark: 150 },
    { subject: 'Mente', A: 85, fullMark: 150 },
    { subject: 'Nutrición', A: 65, fullMark: 150 },
];

export function HealthRadar() {
    return (
        <CrystalCard className="p-6 h-full flex flex-col" hoverEffect>
            <div className="mb-4">
                <h3 className="text-lg font-bold text-white">Balance Fisiológico</h3>
                <p className="text-sm text-gray-400">Análisis de rendimiento integral</p>
            </div>
            <div className="flex-1 min-h-[250px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                        <Radar
                            name="Tú"
                            dataKey="A"
                            stroke="#00f3ff"
                            strokeWidth={3}
                            fill="#00f3ff"
                            fillOpacity={0.2}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                            itemStyle={{ color: '#fff' }}
                        />
                    </RadarChart>
                </ResponsiveContainer>

                {/* Decorator */}
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
            </div>
        </CrystalCard>
    );
}
