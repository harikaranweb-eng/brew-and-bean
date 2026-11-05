// Supabase Edge Function: create-order
// Deployed at: /functions/v1/create-order
// Validates customer payload, recalculates prices from the database, and records order atomically.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const {
      customer_name,
      customer_email,
      customer_phone,
      delivery_address,
      city,
      pincode,
      payment_method,
      order_notes,
      items
    } = body;

    // Call trusted database procedure
    const { data, error } = await supabase.rpc("create_guest_order", {
      p_customer_name: customer_name,
      p_customer_email: customer_email || "",
      p_customer_phone: customer_phone,
      p_delivery_address: delivery_address,
      p_city: city,
      p_pincode: pincode,
      p_payment_method: payment_method || "Cash on Delivery",
      p_order_notes: order_notes || "",
      p_items: items
    });

    if (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

