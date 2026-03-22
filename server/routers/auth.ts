import { z } from "zod";
import { randomUUID } from "crypto";
import { publicProcedure, router, adminProcedure, tenantProcedure } from "../_core/trpc";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { supabaseAdmin } from "../_core/supabase";
import * as db from "../db";
import { sendApprovalRequestEmail } from "../_core/email";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { users, tenants, userTenants } from "../../drizzle/schema";

export const authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user),
  
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return {
      success: true,
    } as const;
  }),

  // Request Access (replaces direct Signup)
  requestAccess: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
      tenantName: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const { email, password, tenantName } = input;

      try {
        // 1. Create user in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true, // Auto confirm to simplify
        });

        if (authError || !authData.user) {
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

        // 2. Create Tenant (or you could find an existing one by name, but keeping it simple)
        const tenantId = randomUUID();
        await database.insert(tenants).values({
          id: tenantId,
          nome: tenantName,
        });

        // 3. Create User in Database with PENDING status
        // Utilizing userId directly into the 'id' field to match Supabase Auth linking
        await database.insert(users).values({
          id: userId,
          tenantId: tenantId,
          email: email,
          role: "admin",
          pendingAccess: "PENDING", 
        });

        // 4. Create the User -> Tenant linking entity
        await database.insert(userTenants).values({
          userId: userId,
          tenantId: tenantId,
          role: "admin"
        });

        // 5. Send Email Notification
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

  // Admin procedure to list pending users
  listPendingUsers: adminProcedure.query(async () => {
    // Only accessible by SuperAdmin (handled by systemProcedure or you can verify email)
    const database = await db.getDb();
    if (!database) return [];
    const pendingUsers = await database.select().from(users).where(eq(users.pendingAccess, "PENDING"));
    return pendingUsers;
  }),

  // Admin procedure to approve user
  approveAccess: adminProcedure
    .input(z.object({
      userId: z.string().uuid()
    }))
    .mutation(async ({ input }: { input: { userId: string } }) => {
      const { userId } = input;
      const database = await db.getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB Connection failed" });
      }
      await database.update(users)
        .set({ pendingAccess: "APPROVED" })
        .where(eq(users.id, userId));
        
      return { success: true };
    }),
});
