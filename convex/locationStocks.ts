import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireOrgMember } from "./utils";

export const getLocationStocks = query({
  args: {
    locationId: v.id("locations"),
    orgId: v.id("organizations"),
  },
  handler: async (ctx, { locationId, orgId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    await requireOrgMember(ctx, userId, orgId);

    const stocks = await ctx.db
      .query("locationStocks")
      .withIndex("by_location", (q) =>
        q.eq("organizationID", orgId).eq("locationID", locationId),
      )
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    const withItems = await Promise.all(
      stocks.map(async (stock) => {
        const item = await ctx.db.get(stock.itemID);
        return { ...stock, item };
      }),
    );

    return withItems;
  },
});

export const addLocationStock = mutation({
  args: {
    orgId: v.id("organizations"),
    locationId: v.id("locations"),
    itemId: v.id("stockItems"),
    quantity: v.number(),
    locationInLocation: v.string(),
  },
  handler: async (
    ctx,
    { orgId, locationId, itemId, quantity, locationInLocation },
  ) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await requireOrgMember(ctx, userId, orgId);

    const existing = await ctx.db
      .query("locationStocks")
      .withIndex("by_location_and_item", (q) =>
        q.eq("locationID", locationId).eq("itemID", itemId),
      )
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .first();

    if (existing)
      throw new Error("This item already has a stock record at this location");

    const now = Date.now();

    return await ctx.db.insert("locationStocks", {
      organizationID: orgId,
      locationID: locationId,
      itemID: itemId,
      quantity,
      locationInLocation: locationInLocation.trim(),
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateLocationStockQuantity = mutation({
  args: {
    locationStockId: v.id("locationStocks"),
    quantity: v.number(),
  },
  handler: async (ctx, { locationStockId, quantity }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const stock = await ctx.db.get(locationStockId);
    if (!stock) throw new Error("Location stock not found");

    await requireOrgMember(ctx, userId, stock.organizationID);

    await ctx.db.patch(locationStockId, { quantity, updatedAt: Date.now() });
  },
});

export const removeLocationStock = mutation({
  args: {
    locationStockId: v.id("locationStocks"),
  },
  handler: async (ctx, { locationStockId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const stock = await ctx.db.get(locationStockId);
    if (!stock) throw new Error("Location stock not found");

    await requireOrgMember(ctx, userId, stock.organizationID);

    await ctx.db.patch(locationStockId, { deletedAt: Date.now() });
  },
});
