import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getOrgInvitations = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, { orgId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const org = await ctx.db.get(orgId);
    if (!org) return null;
    if (org.ownerID !== userId) return null;

    return await ctx.db
      .query("invitations")
      .withIndex("by_org", (q) => q.eq("organizationID", orgId))
      .collect();
  },
});

export const getInvitationByToken = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();

    if (!invitation) return null;

    const org = await ctx.db.get(invitation.organizationID);
    if (!org) return null;

    const invitedBy = await ctx.db.get(invitation.createdByUserID);

    return {
      invitation,
      org: { name: org.name, slug: org.slug },
      invitedBy: invitedBy
        ? { name: (invitedBy as { name?: string }).name ?? "Someone" }
        : { name: "Someone" },
    };
  },
});

export const createInvitation = mutation({
  args: {
    orgId: v.id("organizations"),
    label: v.optional(v.string()),
    maxUses: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, { orgId, label, maxUses, expiresAt }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const org = await ctx.db.get(orgId);
    if (!org) throw new Error("Organization not found");
    if (org.ownerID !== userId) throw new Error("Only the owner can create invitations");

    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const token = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const now = Date.now();
    const invitationId = await ctx.db.insert("invitations", {
      organizationID: orgId,
      token,
      createdByUserID: userId,
      label,
      isActive: true,
      expiresAt,
      maxUses,
      uses: 0,
      createdAt: now,
      updatedAt: now,
    });

    return { invitationId, token };
  },
});

export const revokeInvitation = mutation({
  args: { invitationId: v.id("invitations") },
  handler: async (ctx, { invitationId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const invitation = await ctx.db.get(invitationId);
    if (!invitation) throw new Error("Invitation not found");

    const org = await ctx.db.get(invitation.organizationID);
    if (!org) throw new Error("Organization not found");
    if (org.ownerID !== userId) throw new Error("Only the owner can revoke invitations");

    await ctx.db.patch(invitationId, { isActive: false, updatedAt: Date.now() });
  },
});

export const acceptInvitation = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();

    if (!invitation) throw new Error("Invitation not found");
    if (!invitation.isActive) throw new Error("This invitation has been revoked");

    if (invitation.expiresAt && Date.now() > invitation.expiresAt) {
      throw new Error("This invitation has expired");
    }

    if (invitation.maxUses !== undefined && invitation.uses >= invitation.maxUses) {
      throw new Error("Invitation link is no longer available");
    }

    const org = await ctx.db.get(invitation.organizationID);
    if (!org) throw new Error("Organization not found");

    const slug = org.slug;

    // Owner attempting to join their own org
    if (org.ownerID === userId) {
      return { slug, alreadyMember: true };
    }

    // Already a member
    const existing = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_and_user", (q) =>
        q.eq("organizationID", invitation.organizationID).eq("userID", userId),
      )
      .first();

    if (existing) {
      return { slug, alreadyMember: true };
    }

    const now = Date.now();
    await ctx.db.insert("organizationMembers", {
      organizationID: invitation.organizationID,
      userID: userId,
      roleID: undefined,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(invitation._id, {
      uses: invitation.uses + 1,
      updatedAt: now,
    });

    return { slug, alreadyMember: false };
  },
});
