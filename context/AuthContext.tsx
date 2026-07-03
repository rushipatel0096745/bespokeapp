import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";

import type { Session, User } from "@supabase/supabase-js";

import {
    signIn as signInService,
    signUp as signUpService,
    signOut as signOutService,
    getSession,
} from "../services/auth";

import { ensureProfile, getProfile } from "../services/profile";

import type { Profile } from "../types/Profile";
import type { AuthContextType, SignInPayload, SignUpPayload } from "../types/Auth";

import { supabase } from "../lib/supabase";
import { unregisterToken } from "@/hooks/useNotifications";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);

    const [user, setUser] = useState<User | null>(null);

    const [profile, setProfile] = useState<Profile | null>(null);

    const [loading, setLoading] = useState(true);

    const loadProfile = useCallback(async (userId: string) => {
        try {
            const profile = await getProfile(userId);

            setProfile(profile);
        } catch (error) {
            console.error("Failed to load profile", error);

            setProfile(null);
        }
    }, []);

    const refreshProfile = useCallback(async () => {
        if (!user) return;

        await loadProfile(user.id);
    }, [user, loadProfile]);

    useEffect(() => {
        let mounted = true;

        async function initialise() {
            try {
                const session = await getSession();

                if (!mounted) return;

                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    // await loadProfile(session.user.id);
                    const profile = await ensureProfile(session.user);
                    setProfile(profile);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        initialise();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("EVENT", event);

            setLoading(true); // Signal that auth state is being resolved

            try {
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    console.log("Ensuring profile...");

                    const profile = await ensureProfile(session.user);

                    console.log("Profile:", profile);

                    setProfile(profile);
                } else {
                    setProfile(null);
                }
            } catch (e) {
                console.error("AUTH CONTEXT ERROR", e);
            } finally {
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    async function signIn(payload: SignInPayload) {
        await signInService(payload);
    }

    async function signUp(payload: SignUpPayload) {
        await signUpService(payload);
    }

    async function signOut() {
        try {
            await unregisterToken(); // remove this device's token first
            await signOutService();
            // await supabase.auth.signOut();
            // Navigation is handled reactively:
            // signOutService clears the Supabase session → onAuthStateChange fires
            // SIGNED_OUT → session becomes null → isAuthenticated becomes false
            // → app/index.tsx <Redirect href='/login' /> takes effect automatically.
        } catch (error) {
            console.error("Sign out failed:", error);
        }
    }

    const value = useMemo(
        () => ({
            session,

            user,

            profile,

            loading,

            isAuthenticated: !!session,

            signIn,

            signUp,

            signOut,

            refreshProfile,
        }),
        [session, user, profile, loading, refreshProfile]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider.");
    }

    return context;
}
