"use client";

import { CrystalCard } from "@/components/crystal/CrystalCard";
import { CrystalButton } from "@/components/crystal/CrystalButton";
import { Star, MapPin } from "lucide-react";
import Image from "next/image";

interface TrainerCardProps {
    name: string;
    specialty: string;
    rating: number;
    hourlyRate: number;
    imageUrl: string;
    trainerId: string;
}

export function TrainerCard({ name, specialty, rating, hourlyRate, imageUrl, trainerId }: TrainerCardProps) {
    const handleBook = () => {
        // Navigate to booking page or open modal
        console.log("Booking trainer:", trainerId);
        // router.push(`/dashboard/trainers/${trainerId}`);
    };

    return (
        <CrystalCard className="group relative overflow-hidden p-0 border-white/10 hover:border-neon-cyan/50 transition-colors" tilt={true}>
            <div className="relative h-64 w-full">
                <Image
                    src={imageUrl}
                    alt={name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-deep-charcoal via-transparent to-transparent opacity-90" />

                {/* Badge Metálico */}
                <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full border border-white/20 bg-black/40 px-3 py-1 backdrop-blur-md">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-bold text-white">{rating.toFixed(1)}</span>
                </div>
            </div>

            <div className="relative -mt-16 p-4">
                <div className="mb-2 inline-block rounded-lg bg-neon-cyan/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-neon-cyan border border-neon-cyan/20">
                    {specialty}
                </div>

                <h3 className="text-xl font-bold text-white">{name}</h3>

                <div className="mt-4 flex items-center justify-between">
                    <div>
                        <span className="text-sm text-gray-400">Por hora</span>
                        <div className="text-lg font-bold text-white">${hourlyRate}</div>
                    </div>

                    <CrystalButton size="sm" onClick={handleBook} className="shadow-none">
                        Contratar
                    </CrystalButton>
                </div>
            </div>
        </CrystalCard>
    );
}
