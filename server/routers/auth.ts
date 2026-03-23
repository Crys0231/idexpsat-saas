import { z } from "zod";
import { randomUUID } from "crypto";
import { publicProcedure, router, adminProcedure } from "../_core/trpc";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { supabaseAdmin } from "../_core/supabase";
import * as db from "../db";
import { sendApprovalRequestEmail } from "../_core/email";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { users, tenants, userTenants } from "../../drizzle/schema";
import type { Response } from "express";

export const authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user),

  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    // FIX: cast explícito para Response do express — o tipo do ctx.res pode não
    // incluir clearCookie dependendo de como o contexto tRPC está tipado
    (ctx.res as Response).clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),

  requestAccess: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
      tenantName: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const { email, password, tenantName } = input;

      try {
        // FIX: supabaseAdmin.auth.admin — em @supabase/supabase-js v2 o .admin
        // só existe no GoTrueAdminApi, acessível via service role key.
        // O cast para (any) resolve o erro TS2339 causado por tipagem estrita
        // do TypeScript 5.9 com esta versão do SDK.
        const adminAuth = (supabaseAdmin.auth as any).admin;
        const { data: authData, error: authError } = await adminAuth.createUser({
          email,
          password,
          email_confirm: true,
        });

        if (authError || !authData?.user) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: authError?.message || "Failed to create user in Auth provider",
          });
        }

        const userId = authData.user.id;

        const database = await db.getDb();
        if (!database) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB Connection failed" });
        }

        const tenantId = randomUUID();
        await database.insert(tenants).values({
          id: tenantId,
          nome: tenantName,
        });

        await database.insert(users).values({
          id: userId,
          tenantId: tenantId,
          email: email,
          role: "admin",
          pendingAccess: "PENDING",
        });

        await database.insert(userTenants).values({
          userId: userId,
          tenantId: tenantId,
          role: "admin",
        });

        await sendApprovalRequestEmail(email, tenantName);

        return { success: true, message: "Access requested successfully. Pending approval." };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error in requestAccess:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occurred while requesting access.",
        });
      }
    }),

  listPendingUsers: adminProcedure.query(async () => {
    const database = await db.getDb();
    if (!database) return [];
    const pendingUsers = await database
      .select()
      .from(users)
      .where(eq(users.pendingAccess, "PENDING"));
    return pendingUsers;
  }),

  approveAccess: adminProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(async ({ input }: { input: { userId: string } }) => {
      const { userId } = input;
      const database = await db.getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB Connection failed" });
      }
      await database
        .update(users)
        .set({ pendingAccess: "APPROVED" })
        .where(eq(users.id, userId));

      return { success: true };
    }),
});