import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireOrgMember } from "./utils";

export const getStockItemById = query({
  args: { itemId: v.id("stockItems"), orgId: v.id("organizations") },
  handler: async (ctx, { itemId, orgId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    await requireOrgMember(ctx, userId, orgId);
    const item = await ctx.db.get(itemId);
    if (!item || item.organizationID !== orgId) return null;
    return item;
  },
});

export const updateStockItem = mutation({
  args: {
    itemId: v.id("stockItems"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    SKU: v.optional(v.string()),
    barcode: v.optional(v.string()),
    quantity: v.optional(v.number()),
    unit: v.optional(v.string()),
    reorderPoint: v.optional(v.number()),
    costPrice: v.optional(v.number()),
    sellingPrice: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { itemId, SKU, ...fields }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const item = await ctx.db.get(itemId);
    if (!item) throw new Error("Stock item not found");
    await requireOrgMember(ctx, userId, item.organizationID);

    // If SKU is changing, check uniqueness
    if (SKU !== undefined && SKU.trim() !== item.SKU) {
      const existing = await ctx.db
        .query("stockItems")
        .withIndex("by_org_and_sku", (q) =>
          q.eq("organizationID", item.organizationID).eq("SKU", SKU.trim()),
        )
        .first();
      if (existing) throw new Error(`SKU "${SKU.trim()}" is already in use`);
    }

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (SKU !== undefined) patch.SKU = SKU.trim();
    if (fields.name !== undefined) patch.name = fields.name.trim();
    if (fields.description !== undefined) patch.description = fields.description.trim();
    if (fields.barcode !== undefined) patch.barcode = fields.barcode.trim();
    if (fields.quantity !== undefined) patch.quantity = fields.quantity;
    if (fields.unit !== undefined) patch.unit = fields.unit;
    if (fields.reorderPoint !== undefined) patch.reorderPoint = fields.reorderPoint;
    if (fields.costPrice !== undefined) patch.costPrice = fields.costPrice;
    if (fields.sellingPrice !== undefined) patch.sellingPrice = fields.sellingPrice;
    if (fields.isActive !== undefined) patch.isActive = fields.isActive;

    await ctx.db.patch(itemId, patch);
  },
});

export const deleteStockItem = mutation({
  args: { itemId: v.id("stockItems") },
  handler: async (ctx, { itemId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const item = await ctx.db.get(itemId);
    if (!item) throw new Error("Stock item not found");
    await requireOrgMember(ctx, userId, item.organizationID);
    await ctx.db.patch(itemId, { deletedAt: Date.now(), isActive: false });
  },
});

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
