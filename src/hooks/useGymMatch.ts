"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useGymMatch() {
    const [isLooking, setIsLooking] = useState(false);
    const [matches, setMatches] = useState<any[]>([]);
    const supabase = createClient();

    const checkStatus = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from("gym_match")
            .select("status")
            .eq("user_id", user.id)
            .eq("status", "buscando")
            .single();

        setIsLooking(!!data);
    };

    const fetchMatches = async () => {
        const { data: { user } } = await supabase.auth.getUser();

        const { data } = await supabase
            .from("gym_match")
            .select(`
        *,
        profiles:user_id ( full_name, avatar_url )
      `)
            .eq("status", "buscando")
            .neq("user_id", user?.id || ""); // Exclude self

        setMatches(data || []);
    };

    useEffect(() => {
        checkStatus();
        fetchMatches();

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
        fetchMatches();
    };

    return { isLooking, matches, toggleLooking };
}
