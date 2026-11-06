"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useRealtimeCrowd() {
    const [count, setCount] = useState(0);
    const [level, setLevel] = useState<"low" | "medium" | "high">("low");
    const supabase = createClient();

    const fetchCrowd = async () => {
        // Count checkins where checked_out_at is NULL
        const { count } = await supabase
            .from("checkins")
            .select("*", { count: 'exact', head: true })
            .is("checked_out_at", null);

        const currentCount = count || 0;
        setCount(currentCount);

        if (currentCount < 10) setLevel("low");
        else if (currentCount < 30) setLevel("medium");
        else setLevel("high");
    };

    useEffect(() => {
        fetchCrowd();

        const channel = supabase
            .channel('checkins_updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'checkins' },
                () => {
                    fetchCrowd();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return { count, level };
}
