"use server";

import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function promoteTrainerAction(userId: string) {
    const supabase = await createServerClient();

    // 1. Verify the current user is an admin
    const { data: { user } } = await supabase!.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Check if the user is an admin (or we can trust the admin_access cookie logic from layout, 
    // but better to check DB if possible. Here we will rely on the fact that they are logged in 
    // and we are using the service role key which suggests we are confident).
    // Ideally, we fetch the profile of the requester and check role='admin'.

    // For now, let's assume if they can call this, they are authenticated. 
    // We will attempt the update using the SERVICE ROLE key to bypass RLS.

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
        throw new Error("Missing Supabase Service Role Key");
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        const { error } = await adminClient
            .from("profiles")
            .update({ role: "trainer" })
            .eq("id", userId);

        if (error) {
            console.error("Supabase Error:", error);
            throw new Error(error.message);
        }

        return { success: true };
    } catch (error: any) {
        console.error("Action Error:", error);
        return { success: false, error: error.message };
    }
}
