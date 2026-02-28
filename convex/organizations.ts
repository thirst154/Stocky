import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getUserOrganizations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Orgs the user owns
    const ownedOrgs = await ctx.db
      .query("organizations")
      .withIndex("by_owner", (q) => q.eq("ownerID", userId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    const ownedOrgIds = new Set(ownedOrgs.map((o) => o._id));

    // Memberships in orgs the user does not own
    const memberships = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user", (q) => q.eq("userID", userId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    const memberOrgs = (
      await Promise.all(
        memberships
          .filter((m) => !ownedOrgIds.has(m.organizationID))
          .map((m) => ctx.db.get(m.organizationID)),
      )
    ).filter((o) => o !== null && o.deletedAt === undefined);

    return {
      owned: ownedOrgs,
      member: memberOrgs,
    };
  },
});

export const getOrgBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
  },
});

export const createOrganization = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, { name, slug }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (existing) throw new Error("That slug is already taken");

    const now = Date.now();

    const orgId = await ctx.db.insert("organizations", {
      name,
      slug,
      isActive: true,
      email: "",
      phone: "",
      address: "",
      ownerID: userId,
      currency: "USD",
      timezone: "UTC",
      createdAt: now,
      updatedAt: now,
    });

    return orgId;
  },
});

export const updateOrganization = mutation({
  args: {
    orgId: v.id("organizations"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    currency: v.optional(v.string()),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, { orgId, ...fields }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const org = await ctx.db.get(orgId);
    if (!org) throw new Error("Organization not found");
    if (org.ownerID !== userId) throw new Error("Only the owner can update organization details");

    const patch = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v !== undefined),
    );

    await ctx.db.patch(orgId, { ...patch, updatedAt: Date.now() });
  },
});

export const getOrganizationUsers = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, { orgId }) => {
    const callerId = await getAuthUserId(ctx);
    if (!callerId) return null;

    const org = await ctx.db.get(orgId);
    if (!org) return null;

    const memberships = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org", (q) => q.eq("organizationID", orgId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    const memberUserIds = new Set(memberships.map((m) => m.userID));

    const members = await Promise.all(
      memberships.map(async (m) => {
        const user = await ctx.db.get(m.userID);
        if (!user) return null;
        return {
          user,
          isOwner: m.userID === org.ownerID,
          membershipId: m._id as string,
          roleId: m.roleID as string,
          joinedAt: m.createdAt,
        };
      }),
    );

    // Owner has no membership row yet — include them directly from the org
    if (!memberUserIds.has(org.ownerID)) {
      const owner = await ctx.db.get(org.ownerID);
      if (owner) {
        members.push({
          user: owner,
          isOwner: true,
          membershipId: null as unknown as string,
          roleId: null as unknown as string,
          joinedAt: org.createdAt,
        });
      }
    }

    return members.filter((u) => u !== null);
  },
});
