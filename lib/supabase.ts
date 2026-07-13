import { StorageClient } from "@supabase/storage-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

export const BUCKET = "Picture";

export const storage = new StorageClient(`${supabaseUrl}/storage/v1`, {
  apiKey: supabaseKey,
  authorization: supabaseKey,
});
