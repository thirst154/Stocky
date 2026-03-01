import { GenericQueryCtx } from "convex/server";
import { Id } from "./_generated/dataModel";
import type { DataModel } from "./_generated/dataModel";

type AnyCtx = GenericQueryCtx<DataModel>;

/**
 * Returns true if the user is the org owner OR has an active membership row.
 */
export async function isUserMemberOfOrg(
  ctx: AnyCtx,
  userId: Id<"users">,
  orgId: Id<"organizations">,
): Promise<boolean> {
  const org = await ctx.db.get(orgId);
  if (!org || org.deletedAt !== undefined) return false;
  if (org.ownerID === userId) return true;

  const membership = await ctx.db
    .query("organizationMembers")
    .withIndex("by_org_and_user", (q) =>
      q.eq("organizationID", orgId).eq("userID", userId),
    )
    .first();

  return membership !== null && membership.deletedAt === undefined;
}

/**
 * Throws if the user is not an active member (or owner) of the org.
 * Use at the top of mutations/queries that require org membership.
 */
export async function requireOrgMember(
  ctx: AnyCtx,
  userId: Id<"users">,
  orgId: Id<"organizations">,
): Promise<void> {
  const isMember = await isUserMemberOfOrg(ctx, userId, orgId);
  if (!isMember) throw new Error("Not a member of this organization");
}

/**
 * Throws if the user is not the owner of the org.
 * Use for owner-only operations (e.g. settings, invitations).
 */
export async function requireOrgOwner(
  ctx: AnyCtx,
  userId: Id<"users">,
  orgId: Id<"organizations">,
): Promise<void> {
  const org = await ctx.db.get(orgId);
  if (!org) throw new Error("Organization not found");
  if (org.ownerID !== userId)
    throw new Error("Only the owner can perform this action");
}
