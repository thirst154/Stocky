import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireOrgMember } from "./utils";

export const getDashboardStats = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, { orgId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    await requireOrgMember(ctx, userId, orgId);

    const org = await ctx.db.get(orgId);
    if (!org) return null;

    // ── Stock items ────────────────────────────────────────────
    const allItems = await ctx.db
      .query("stockItems")
      .withIndex("by_org", (q) => q.eq("organizationID", orgId))
      .collect();

    const activeItems = allItems.filter((i) => i.isActive && i.deletedAt === undefined);
    const inactiveItems = allItems.filter((i) => !i.isActive && i.deletedAt === undefined);

    // ── Location stocks ────────────────────────────────────────
    const locationStocks = await ctx.db
      .query("locationStocks")
      .withIndex("by_org", (q) => q.eq("organizationID", orgId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    // Sum total quantity across all locations per item
    const qtyByItem = new Map<string, number>();
    for (const ls of locationStocks) {
      qtyByItem.set(ls.itemID, (qtyByItem.get(ls.itemID) ?? 0) + ls.quantity);
    }

    // ── Inventory value ────────────────────────────────────────
    let totalCostValue = 0;
    let totalSellingValue = 0;
    for (const item of activeItems) {
      const qty = qtyByItem.get(item._id) ?? 0;
      totalCostValue += qty * item.costPrice;
      totalSellingValue += qty * item.sellingPrice;
    }

    // ── Low stock items ────────────────────────────────────────
    // Items where total qty across all locations is at or below their reorder point
    const lowStockItems = activeItems
      .filter(
        (item) =>
          item.reorderPoint > 0 &&
          (qtyByItem.get(item._id) ?? 0) <= item.reorderPoint,
      )
      .map((item) => ({
        _id: item._id,
        name: item.name,
        SKU: item.SKU,
        unit: item.unit,
        currentQty: qtyByItem.get(item._id) ?? 0,
        reorderPoint: item.reorderPoint,
        // Ratio: lower = more urgent
        urgency: (qtyByItem.get(item._id) ?? 0) / item.reorderPoint,
      }))
      .sort((a, b) => a.urgency - b.urgency)
      .slice(0, 10);

    // ── Locations ──────────────────────────────────────────────
    const locations = await ctx.db
      .query("locations")
      .withIndex("by_org", (q) => q.eq("organizationID", orgId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    const activeLocations = locations.filter((l) => l.isActive);

    const locationStats = activeLocations
      .map((loc) => {
        const locStocks = locationStocks.filter((ls) => ls.locationID === loc._id);
        const totalQty = locStocks.reduce((sum, ls) => sum + ls.quantity, 0);
        return {
          _id: loc._id,
          name: loc.name,
          code: loc.code,
          isDefault: loc.isDefault,
          itemCount: locStocks.length,
          totalQty,
        };
      })
      .sort((a, b) => b.totalQty - a.totalQty);

    // ── Members ────────────────────────────────────────────────
    const members = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org", (q) => q.eq("organizationID", orgId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    // owner always counts as +1
    const memberCount = members.length + 1;

    // ── Top stocked items ──────────────────────────────────────
    const topItems = activeItems
      .map((item) => ({
        _id: item._id,
        name: item.name,
        SKU: item.SKU,
        unit: item.unit,
        totalQty: qtyByItem.get(item._id) ?? 0,
      }))
      .filter((i) => i.totalQty > 0)
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 5);

    return {
      currency: org.currency,
      totalActiveItems: activeItems.length,
      totalInactiveItems: inactiveItems.length,
      totalCostValue,
      totalSellingValue,
      potentialMargin: totalSellingValue - totalCostValue,
      lowStockItems,
      activeLocationCount: activeLocations.length,
      totalLocationCount: locations.length,
      locationStats,
      memberCount,
      topItems,
      totalLocationStockEntries: locationStocks.length,
    };
  },
});
