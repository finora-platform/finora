// lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";
import { Session } from "@clerk/nextjs/server";

export const createClerkSupabaseClient = async (session: Session | null) => {
  if (!session) {
    console.error("❌ Session is not available");
    return null;
  }

  console.log("✅ Clerk Session:", session);

  try {
    const token = await session.getToken({ template: "supabase" });

    if (!token) {
      console.error("❌ Token is undefined");
      return null;
    }

    console.log("🔑 Supabase JWT Token:", token);

    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          
        },
        auth: {
          persistSession: false,
        },
      }
    );
  } catch (error) {
    console.error("❌ Error creating Supabase client:", error);
    return null;
  }
};

export type SupabaseClient = ReturnType<typeof createClient>;
