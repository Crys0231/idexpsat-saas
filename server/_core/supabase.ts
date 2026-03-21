import { createClient } from "@supabase/supabase-js";
import { ENV } from "./env";

/**
 * ============================================================================
 * SUPABASE CLIENT (BACKEND)
 * ============================================================================
 *
 * Cliente Supabase para o backend com credenciais de service role
 * Permite operações administrativas e acesso total ao banco
 */

const supabaseUrl = ENV.supabaseUrl;
const supabaseServiceRoleKey = ENV.supabaseServiceRoleKey;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  );
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Obter usuário do Supabase Auth pelo JWT
 */
export async function getUserFromJWT(token: string) {
  try {
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error) {
      console.error("[Supabase] Error getting user from JWT:", error);
      return null;
    }

    return user;
  } catch (error) {
    console.error("[Supabase] Error in getUserFromJWT:", error);
    return null;
  }
}

/**
 * Verificar se usuário existe no banco de dados
 */
export async function getUserFromDatabase(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("open_id", userId)
      .single();

    if (error) {
      console.error("[Supabase] Error getting user from database:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("[Supabase] Error in getUserFromDatabase:", error);
    return null;
  }
}

/**
 * Criar ou atualizar usuário no banco de dados
 */
export async function upsertUserInDatabase(
  userId: string,
  email: string,
  tenantId: string,
  name?: string
) {
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .upsert(
        {
          open_id: userId,
          email,
          tenant_id: tenantId,
          name: name || email.split("@")[0],
          role: "user",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_signed_in: new Date().toISOString(),
        },
        {
          onConflict: "open_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("[Supabase] Error upserting user:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("[Supabase] Error in upsertUserInDatabase:", error);
    return null;
  }
}
