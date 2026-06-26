export type CustomerType = "new" | "existing";

export type Purpose = "order" | "community" | "both";

export type YoungestChildAge =
    | "expecting"
    | "newborn"
    | "0-6_months"
    | "6-12_months"
    | "1_year"
    | "2_years"
    | "3_years"
    | "4+_years";

export interface Profile {
    id: string;

    email: string;

    first_name: string;

    last_name: string;

    phone: string | null;

    avatar_url: string | null;

    customer_type: CustomerType | null;

    youngest_child_age: YoungestChildAge | null;

    purpose: Purpose | null;

    completed_onboarding: boolean;

    created_at: string;

    updated_at: string;
}

export interface CreateProfilePayload {
    id: string;

    email: string;

    first_name: string;

    last_name: string;

    phone?: string;
}

export interface UpdateProfilePayload {
    first_name?: string;

    last_name?: string;

    phone?: string;

    avatar_url?: string;

    customer_type?: CustomerType;

    youngest_child_age?: YoungestChildAge;

    purpose?: Purpose;

    completed_onboarding?: boolean;
}
