import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { csvRouter } from "./routers/csv";
import { surveysRouter } from "./routers/surveys";
import { configRouter } from "./routers/config";

export const appRouter = router({
  // System and auth
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Feature routers
  csv: csvRouter,
  surveys: surveysRouter,
  config: configRouter,
});

export type AppRouter = typeof appRouter;
