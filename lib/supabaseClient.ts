import { createClient } from "@supabase/supabase-js";

// Client Supabase public - utilisé uniquement pour le Realtime (notifications amis)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
