import { TRPCError } from "@trpc/server";
import type { Request } from "express";
import type { User } from "../../drizzle/schema";

/**
 * ============================================================================
 * MULTI-TENANT CONTEXT & MIDDLEWARE
 * ============================================================================
 *
 * This module provides multi-tenant isolation through:
 * 1. Extracting tenant_id from the authenticated user
 * 2. Enforcing tenant_id validation in all protected procedures
 * 3. Preventing cross-tenant data access
 */

export interface MultiTenantContext {
  tenantId: string;
  userId: number;
  user: User;
}

/**
 * Extract multi-tenant context from authenticated user
 * Ensures user has a valid tenant_id and is properly associated
 */
export function extractTenantContext(user: User): MultiTenantContext {
  if (!user.tenantId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User is not associated with any tenant",
    });
  }

  return {
    tenantId: user.tenantId,
    userId: user.id,
    user,
  };
}

/**
 * Validate that the requested tenant_id matches the user's tenant_id
 * Used in procedures to prevent cross-tenant access
 */
export function validateTenantAccess(userTenantId: string, requestedTenantId: string): void {
  if (userTenantId !== requestedTenantId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access denied: tenant_id mismatch",
    });
  }
}

/**
 * Validate that all provided tenant_ids belong to the user's tenant
 * Useful for batch operations
 */
export function validateTenantAccessBatch(userTenantId: string, tenantIds: string[]): void {
  const invalidTenantIds = tenantIds.filter((id) => id !== userTenantId);
  if (invalidTenantIds.length > 0) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access denied: one or more tenant_ids do not match user's tenant",
    });
  }
}

/**
 * Ensure tenant_id is properly set in database queries
 * This is used in query builders to automatically filter by tenant_id
 */
export function withTenantFilter(tenantId: string, baseQuery: Record<string, any>) {
  return {
    ...baseQuery,
    tenantId,
  };
}
