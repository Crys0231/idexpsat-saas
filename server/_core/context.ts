import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { extractTenantContext, type MultiTenantContext } from "./multitenant";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  tenant?: MultiTenantContext;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let tenant: MultiTenantContext | undefined;

  try {
    user = await sdk.authenticateRequest(opts.req);
    if (user) {
      tenant = extractTenantContext(user);
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    tenant,
  };
}
