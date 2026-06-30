// supabase/functions/create-payment-intent/index.ts
//
// Deploy with: supabase functions deploy create-payment-intent
// Requires these secrets set via `supabase secrets set`:
//   STRIPE_SECRET_KEY=sk_live_... (or sk_test_... while developing)
//   SUPABASE_URL=...              (auto-injected by Supabase, usually already present)
//   SUPABASE_SERVICE_ROLE_KEY=... (needed to write to payments/addon_orders bypassing RLS)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@16?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2024-06-20",
    httpClient: Stripe.createFetchHttpClient(),
});

const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { addon_order_id } = await req.json();

        if (!addon_order_id) {
            return new Response(JSON.stringify({ error: "addon_order_id is required" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Look up the order server-side — never trust an amount sent from the client.
        const { data: addonOrder, error: orderError } = await supabaseAdmin
            .from("addon_orders")
            .select("id, total, status, stripe_payment_intent")
            .eq("id", addon_order_id)
            .single();

        if (orderError || !addonOrder) {
            return new Response(JSON.stringify({ error: "addon_order not found" }), {
                status: 404,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (addonOrder.status !== "pending") {
            return new Response(
                JSON.stringify({ error: `addon_order is not pending (status: ${addonOrder.status})` }),
                { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // If a PaymentIntent already exists for this order (e.g. user backed out
        // and retried), reuse it instead of creating a duplicate charge target.
        if (addonOrder.stripe_payment_intent) {
            const existing = await stripe.paymentIntents.retrieve(addonOrder.stripe_payment_intent);
            if (existing.status !== "canceled") {
                return new Response(
                    JSON.stringify({
                        client_secret: existing.client_secret,
                        payment_intent_id: existing.id,
                    }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }
        }

        // Stripe expects the smallest currency unit (pence for GBP).
        const amountInPence = Math.round(Number(addonOrder.total) * 100);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInPence,
            currency: "gbp",
            metadata: { addon_order_id: addonOrder.id },
            automatic_payment_methods: { enabled: true }, // supports card now, Apple/Google Pay later with no code change here
        });

        const { error: updateError } = await supabaseAdmin
            .from("addon_orders")
            .update({ stripe_payment_intent: paymentIntent.id })
            .eq("id", addon_order_id);

        if (updateError) throw updateError;

        const { error: paymentInsertError } = await supabaseAdmin.from("payments").insert({
            addon_order_id: addonOrder.id,
            provider: "stripe",
            provider_payment_id: paymentIntent.id,
            amount: addonOrder.total,
            currency: "GBP",
            status: "pending",
        });

        if (paymentInsertError) throw paymentInsertError;

        return new Response(
            JSON.stringify({
                client_secret: paymentIntent.client_secret,
                payment_intent_id: paymentIntent.id,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (err) {
        console.error("create-payment-intent error:", err);
        return new Response(JSON.stringify({ error: err.message ?? "Unknown error" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
