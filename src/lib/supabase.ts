import { createClient } from '@supabase/supabase-js';

let supabaseAdmin: any = null;

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is required.');
  }
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is required.');
  }

  if (!supabaseAdmin) {
    supabaseAdmin = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  }
  return supabaseAdmin;
}

export async function uploadBase64Image(base64Data: string): Promise<string> {
  const supabase = getSupabaseAdmin();

  // Parse the base64 string
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 image data format');
  }

  const contentType = matches[1];
  const base64Content = matches[2];
  const buffer = Buffer.from(base64Content, 'base64');
  
  const fileName = `screenshot-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.png`;

  const { data, error } = await supabase.storage
    .from('screenshots')
    .upload(fileName, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error('Supabase storage upload error:', error);
    // Fallback to returning a default elegant illustration if the bucket is not yet provisioned
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
    .from('screenshots')
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}

