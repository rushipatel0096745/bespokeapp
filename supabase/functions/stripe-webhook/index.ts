// supabase/functions/stripe-webhook/index.ts
//
// Deploy with: supabase functions deploy stripe-webhook --no-verify-jwt
// (--no-verify-jwt because Stripe calls this directly, not through your app's auth)
//
// After deploying, register the endpoint URL in the Stripe Dashboard
// (Developers -> Webhooks) for events: payment_intent.succeeded, payment_intent.payment_failed
// Then copy the signing secret into:
//   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@16?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2024-06-20",
    httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

serve(async (req) => {
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    if (!signature) {
        return new Response("Missing stripe-signature header", { status: 400 });
    }

    let event: Stripe.Event;

    try {
        // constructEventAsync (not constructEvent) — required in Deno's runtime
        // since the sync version relies on Node-only crypto APIs.
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
        console.error("Webhook signature verification failed:", err.message);
        return new Response(`Webhook signature verification failed`, { status: 400 });
    }

    try {
        switch (event.type) {
            case "payment_intent.succeeded": {
                const intent = event.data.object as Stripe.PaymentIntent;
                await markPaymentAndOrder(intent.id, "succeeded", "paid");
                break;
            }

            case "payment_intent.payment_failed": {
                const intent = event.data.object as Stripe.PaymentIntent;
                await markPaymentAndOrder(intent.id, "failed", "payment_failed");
                break;
            }

            case "payment_intent.canceled": {
                const intent = event.data.object as Stripe.PaymentIntent;
                await markPaymentAndOrder(intent.id, "canceled", "canceled");
                break;
            }

            default:
                // Unhandled event types are fine to ignore — Stripe sends many
                // events you don't need to act on.
                break;
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error("Webhook handler error:", err);
        // Returning 500 tells Stripe to retry delivery later.
        return new Response(JSON.stringify({ error: "Internal error processing webhook" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});

async function markPaymentAndOrder(
    paymentIntentId: string,
    paymentStatus: "succeeded" | "failed" | "canceled",
    orderStatus: "paid" | "payment_failed" | "canceled"
) {
    const { error: paymentError } = await supabaseAdmin
        .from("payments")
        .update({ status: paymentStatus })
        .eq("provider_payment_id", paymentIntentId);

    if (paymentError) throw paymentError;

    const { error: orderError } = await supabaseAdmin
        .from("addon_orders")
        .update({ status: orderStatus })
        .eq("stripe_payment_intent", paymentIntentId);

    if (orderError) throw orderError;
}
