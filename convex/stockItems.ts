import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireOrgMember } from "./utils";

export const getStockItems = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, { orgId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    await requireOrgMember(ctx, userId, orgId);

    return await ctx.db
      .query("stockItems")
      .withIndex("by_org", (q) => q.eq("organizationID", orgId))
      .collect();
  },
});

export const newStockItem = mutation({
  args: {
    orgId: v.id("organizations"),
    name: v.string(),
    SKU: v.string(),
    description: v.string(),
    barcode: v.string(),
    quantity: v.number(),
    unit: v.string(),
    reorderPoint: v.number(),
    costPrice: v.number(),
    sellingPrice: v.number(),
  },
  handler: async (
    ctx,
    {
      orgId,
      name,
      SKU,
      description,
      barcode,
      quantity,
      unit,
      reorderPoint,
      costPrice,
      sellingPrice,
    },
  ) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    await requireOrgMember(ctx, userId, orgId);

    const org = await ctx.db.get(orgId);
    if (!org) throw new Error("Organization not found");

    const existing = await ctx.db
      .query("stockItems")
      .withIndex("by_org_and_sku", (q) =>
        q.eq("organizationID", orgId).eq("SKU", SKU),
      )
      .first();

    if (existing) throw new Error("SKU already exists");

    const now = Date.now();

    return await ctx.db.insert("stockItems", {
      organizationID: orgId,
      name: name.trim(),
      SKU: SKU.trim(),
      description: description,
      barcode: barcode,
      quantity: quantity,
      unit: unit,
      reorderPoint: reorderPoint,
      costPrice: costPrice,
      sellingPrice: sellingPrice,
      isActive: true,
      categories: [],
      createdAt: now,
      updatedAt: now,
    });
  },
});
