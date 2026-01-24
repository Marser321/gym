"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { motion } from "framer-motion";

interface ChartData {
    date: string;
    volume: number;
    sets: number;
}

interface VolumeChartProps {
    data: ChartData[];
}

export function VolumeChart({ data }: VolumeChartProps) {
    // Reverse data to show chronological order for the chart if it's descending
    const chartData = [...data].reverse();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full h-[300px] mt-4"
        >
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00F3FF" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#00F3FF" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis
                        dataKey="date"
                        stroke="#666"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => value.split(' de ')[0]} // Shorten date
                    />
                    <YAxis
                        stroke="#666"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#000',
                            border: '1px solid #ffffff20',
                            borderRadius: '12px',
                            fontSize: '12px'
                        }}
                        itemStyle={{ color: '#00F3FF' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="volume"
                        stroke="#00F3FF"
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#colorVolume)"
                        animationDuration={2000}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </motion.div>
    );
}
