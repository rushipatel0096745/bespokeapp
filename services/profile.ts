import { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { CreateProfilePayload, Profile, UpdateProfilePayload } from "../types/Profile";

export async function createProfile(payload: CreateProfilePayload) {
    const { data, error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" }).select().single();

    if (error) {
        throw error;
    }

    return data;
}

export async function getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}

export async function updateProfile(userId: string, payload: UpdateProfilePayload) {
    const { data, error } = await supabase.from("profiles").update(payload).eq("id", userId).select().single();

    if (error) {
        throw error;
    }

    return data;
}

export async function ensureProfile(user: User) {
    let profile = await getProfile(user.id);

    if (profile) {
        return profile;
    }

    await createProfile({
        id: user.id,
        email: user.email ?? "",
        first_name: user.user_metadata.first_name ?? "",
        last_name: user.user_metadata.last_name ?? "",
        phone: user.user_metadata.phone ?? "",
    });

    profile = await getProfile(user.id);

    return profile;
}
