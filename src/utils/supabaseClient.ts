// lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

interface Session {
  getToken(options: { template: string }): Promise<string>;
}

export const createClerkSupabaseClient = async (session:Session) => {
  if (!session) {
    console.error("❌ Session is not available");
    return null;
  }

  try {
    const token = await session.getToken({ template: "supabase" });

    if (!token) {
      console.error("❌ Token is undefined");
      return null;
    }

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
