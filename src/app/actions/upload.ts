// src/app/actions/upload.ts
'use server';

import { createClient } from '@supabase/supabase-js';

export async function uploadToSupabaseStorage(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    const filePath = formData.get('filePath') as string;

    if (!file || !filePath) {
      return { success: false, error: 'Missing file or file path' };
    }

    // Get credentials from environment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL');
      return { success: false, error: 'Server configuration error: Missing URL' };
    }

    if (!supabaseServiceKey) {
      console.error('❌ Missing Service Role Key');
      console.error('   Check: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY');
      return { success: false, error: 'Server configuration error: Missing Service Role Key' };
    }

    console.log('🔑 Server: Using Service Role Key (bypasses RLS)');
    console.log(`📤 Uploading: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    console.log(`📂 Path: ${filePath}`);

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to storage
    const { data, error } = await supabaseAdmin.storage
      .from('documents')
      .upload(filePath, buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream'
      });

    if (error) {
      console.error('❌ Server storage error:', error);
      
      // Provide more specific error messages
      if (error.message.includes('bucket not found')) {
        return { 
          success: false, 
          error: 'Storage bucket "documents" not found. Please create it in Supabase.' 
        };
      }
      if (error.message.includes('permission')) {
        return { 
          success: false, 
          error: 'Permission denied. Check your Service Role Key and bucket policies.' 
        };
      }
      
      return { success: false, error: error.message };
    }

    console.log('✅ Server: File uploaded successfully');
    console.log('📦 Upload data:', data);
    
    return { success: true, data };
  } catch (error: any) {
    console.error('❌ Server upload error:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown server error occurred' 
    };
  }
}

export async function getPublicUrl(filePath: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { data } = supabaseAdmin.storage
      .from('documents')
      .getPublicUrl(filePath);
    
    if (!data || !data.publicUrl) {
      throw new Error('Failed to generate public URL');
    }
    
    return data.publicUrl;
  } catch (error: any) {
    console.error('❌ Error getting public URL:', error);
    throw new Error(`Failed to get public URL: ${error.message}`);
  }
}

// Optional: Add a function to delete files if needed
export async function deleteFromStorage(filePath: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { error } = await supabaseAdmin.storage
      .from('documents')
      .remove([filePath]);

    if (error) {
      console.error('❌ Delete error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ File deleted successfully');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Delete error:', error);
    return { success: false, error: error.message };
  }
}