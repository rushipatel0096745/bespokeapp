import type { Session, User } from "@supabase/supabase-js";
import type { Profile } from "./Profile";

export interface SignUpPayload {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
}

export interface SignInPayload {
    email: string;
    password: string;
}

export interface AuthContextType {
    session: Session | null;

    user: User | null;

    profile: Profile | null;

    loading: boolean;

    isAuthenticated: boolean;

    signIn(payload: SignInPayload): Promise<void>;

    signUp(payload: SignUpPayload): Promise<void>;

    signOut(): Promise<void>;

    refreshProfile(): Promise<void>;
}
