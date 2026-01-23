import { DashboardLayout as Layout } from "@/components/layout/DashboardLayout";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import React from "react";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    if (!supabase) {
        redirect("/login");
    }

    let user;
    try {
        const { data: userData } = await supabase.auth.getUser();
        user = userData?.user;
    } catch (e) {
        console.error("Layout Auth Error:", e);
        redirect("/login");
    }

    if (!user) {
        redirect("/login");
    }

    return <Layout>{children}</Layout>;
}
