import { createClient } from '@supabase/supabase-js';
import neo4j from 'neo4j-driver';

// ==========================================
// SUPABASE CLIENT (Safe Wrapper)
// ==========================================
let supabaseInstance: any = null;

export const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  // Validate URL format (Must start with http:// or https://)
  if (!supabaseUrl.startsWith('http')) {
    console.warn('[Supabase] Warning: Invalid or missing NEXT_PUBLIC_SUPABASE_URL. Using mock fallback.');
    return null;
  }

  try {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
    return supabaseInstance;
  } catch (error) {
    console.error('[Supabase] Client Initialization Error:', error);
    return null;
  }
};

// ==========================================
// NEO4J CLIENT (Safe Wrapper)
// ==========================================
let neo4jDriver: any = null;

export const getNeo4j = () => {
  if (neo4jDriver) return neo4jDriver;

  const uri = process.env.NEO4J_URI || '';
  const user = process.env.NEO4J_USERNAME || '';
  const password = process.env.NEO4J_PASSWORD || '';

  // Validate URI format (Must start with bolt:// or neo4j:// or neo4j+s://)
  if (!uri.startsWith('bolt') && !uri.startsWith('neo4j')) {
    console.warn('[Neo4j] Warning: Invalid or missing NEO4J_URI. Using mock fallback.');
    return null;
  }

  try {
    neo4jDriver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    return neo4jDriver;
  } catch (error) {
    console.error('[Neo4j] Driver Initialization Error:', error);
    return null;
  }
};
