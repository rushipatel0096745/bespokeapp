import { SignInPayload, SignUpPayload } from "@/types/Auth";
import { supabase } from "../lib/supabase";

export async function signIn({ email, password }: SignInPayload) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    console.log("login service", data, error);

    if (error) throw error;

    return data;
}

export async function signUp({ firstName, lastName, email, phone, password }: SignUpPayload) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                first_name: firstName,
                last_name: lastName,
                phone,
            },
            emailRedirectTo: "modernmum://auth/callback",
        },
    });

    if (error) {
        throw error;
    }

    return data;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;
}

export async function getSession() {
    const {
        data: { session },
        error,
    } = await supabase.auth.getSession();

    if (error) {
        throw error;
    }

    return session;
}

export async function refreshSession() {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
        throw error;
    }

    return data.session;
}

export async function getCurrentUser() {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error) {
        throw error;
    }

    return user;
}
