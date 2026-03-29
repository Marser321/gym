"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useGymMatch() {
    const [isLooking, setIsLooking] = useState(false);
    const [matches, setMatches] = useState<any[]>([]);
    const supabase = createClient();

    const checkStatus = async (userId: string) => {
        const { data } = await supabase
            .from("gym_match")
            .select("status")
            .eq("user_id", userId)
            .eq("status", "buscando")
            .single();

        setIsLooking(!!data);
    };

    const fetchMatches = async (userId?: string | null) => {
        let currentUserId = userId;
        if (currentUserId === undefined) {
            const { data: { user } } = await supabase.auth.getUser();
            currentUserId = user?.id;
        }

        const { data } = await supabase
            .from("gym_match")
            .select(`
        *,
        profiles:user_id ( full_name, avatar_url )
      `)
            .eq("status", "buscando")
            .neq("user_id", currentUserId || ""); // Exclude self

        setMatches(data || []);
    };

    const toggleLooking = async (exercise: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        if (isLooking) {
            // Stop looking
            await supabase
                .from("gym_match")
                .update({ status: "cancelado" })
                .eq("user_id", user.id)
                .eq("status", "buscando");
            setIsLooking(false);
        } else {
            // Start looking
            await supabase
                .from("gym_match")
                .insert({
                    user_id: user.id,
                    exercise_type: exercise,
                    status: "buscando"
                });
            setIsLooking(true);
        }
        fetchMatches(user.id);
    };

    useEffect(() => {
        const initialize = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                checkStatus(user.id);
            }
            fetchMatches(user?.id ?? null);
        };

        initialize();

        // Subscribe to changes in real-time
        const channel = supabase
            .channel('gym_match_updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'gym_match' },
                (payload) => {
                    console.log('Change received!', payload);
                    fetchMatches();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return { isLooking, matches, toggleLooking };
}
