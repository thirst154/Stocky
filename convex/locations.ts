import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getOrgLocations = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, { orgId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("locations")
      .withIndex("by_org", (q) => q.eq("organizationID", orgId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();
  },
});

export const createLocation = mutation({
  args: {
    orgId: v.id("organizations"),
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, { orgId, name, code, description, isDefault }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const org = await ctx.db.get(orgId);
    if (!org) throw new Error("Organization not found");
    if (org.ownerID !== userId)
      throw new Error("Only the owner can create locations");

    const normalizedCode = code.trim().toUpperCase();

    const existing = await ctx.db
      .query("locations")
      .withIndex("by_org_and_code", (q) =>
        q.eq("organizationID", orgId).eq("code", normalizedCode),
      )
      .first();
    if (existing)
      throw new Error(
        `A location with code "${normalizedCode}" already exists`,
      );

    const now = Date.now();

    // If this is the first location or isDefault requested, clear other defaults first
    if (isDefault) {
      const defaults = await ctx.db
        .query("locations")
        .withIndex("by_org", (q) => q.eq("organizationID", orgId))
        .filter((q) => q.eq(q.field("isDefault"), true))
        .collect();
      await Promise.all(
        defaults.map((l) => ctx.db.patch(l._id, { isDefault: false })),
      );
    }

    return await ctx.db.insert("locations", {
      organizationID: orgId,
      name: name.trim(),
      code: normalizedCode,
      description: description?.trim() ?? "",
      isDefault: isDefault ?? false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateLocation = mutation({
  args: {
    locationId: v.id("locations"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { locationId, isDefault, ...fields }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const location = await ctx.db.get(locationId);
    if (!location) throw new Error("Location not found");

    const org = await ctx.db.get(location.organizationID);
    if (!org) throw new Error("Organization not found");
    if (org.ownerID !== userId)
      throw new Error("Only the owner can update locations");

    const patch: Record<string, unknown> = { updatedAt: Date.now() };

    if (fields.name !== undefined) patch.name = fields.name.trim();
    if (fields.description !== undefined)
      patch.description = fields.description.trim();
    if (fields.isActive !== undefined) patch.isActive = fields.isActive;

    if (isDefault === true) {
      // Clear other defaults
      const defaults = await ctx.db
        .query("locations")
        .withIndex("by_org", (q) =>
          q.eq("organizationID", location.organizationID),
        )
        .filter((q) => q.eq(q.field("isDefault"), true))
        .collect();
      await Promise.all(
        defaults.map((l) => ctx.db.patch(l._id, { isDefault: false })),
      );
      patch.isDefault = true;
    } else if (isDefault === false) {
      patch.isDefault = false;
    }

    await ctx.db.patch(locationId, patch);
  },
});

export const deleteLocation = mutation({
  args: {
    locationId: v.id("locations"),
  },
  handler: async (ctx, { locationId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const location = await ctx.db.get(locationId);
    if (!location) throw new Error("Location not found");

    const org = await ctx.db.get(location.organizationID);
    if (!org) throw new Error("Organization not found");
    if (org.ownerID !== userId)
      throw new Error("Only the owner can delete locations");

    await ctx.db.patch(locationId, { deletedAt: Date.now() });
  },
});
