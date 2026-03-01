import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  organizations: defineTable({
    name: v.string(),
    // Slug is the organization's unique identifier. URL-safe
    slug: v.string(),

    // Default True
    isActive: v.boolean(),

    email: v.string(),
    phone: v.string(),
    address: v.string(),

    ownerID: v.id("users"),

    currency: v.string(),
    timezone: v.string(),

    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    // Uniqueness: slug must be globally unique — check this index before inserting
    .index("by_slug", ["slug"])
    .index("by_owner", ["ownerID"]),

  organizationMembers: defineTable({
    organizationID: v.id("organizations"),
    userID: v.id("users"),
    roleID: v.optional(v.id("roles")),

    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_org", ["organizationID"])
    .index("by_user", ["userID"])
    // Uniqueness: a user can only have one membership per org — check this index before inserting
    .index("by_org_and_user", ["organizationID", "userID"]),

  roles: defineTable({
    organizationID: v.id("organizations"),
    name: v.string(),
    description: v.string(),
  })
    .index("by_org", ["organizationID"])
    // Uniqueness: role names must be unique per org — check this index before inserting
    .index("by_org_and_name", ["organizationID", "name"]),

  permissions: defineTable({
    key: v.string(),
    // inventory.read
    // inventory.write
    // stock.move
    // users.manage

    organizationID: v.id("organizations"),
    description: v.string(),
  })
    .index("by_org", ["organizationID"])
    // Uniqueness: permission key must be unique per org — check this index before inserting
    .index("by_org_and_key", ["organizationID", "key"]),

  rolePermissions: defineTable({
    roleID: v.id("roles"),
    permissionID: v.id("permissions"),
  })
    .index("by_role", ["roleID"])
    // Uniqueness: a permission can only be assigned to a role once — check this index before inserting
    .index("by_role_and_permission", ["roleID", "permissionID"]),

  stockItems: defineTable({
    organizationID: v.id("organizations"),

    SKU: v.string(),
    name: v.string(),
    description: v.string(),
    categories: v.array(v.string()),

    barcode: v.optional(v.string()),
    // e.g. 50ml or 100g
    quantity: v.number(),
    unit: v.string(),

    reorderPoint: v.number(),

    costPrice: v.number(),
    sellingPrice: v.number(),

    isActive: v.boolean(),

    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_org", ["organizationID"])
    // Uniqueness: SKU must be unique per org — check this index before inserting
    .index("by_org_and_sku", ["organizationID", "SKU"])
    // Uniqueness: barcode must be unique per org — check this index before inserting
    .index("by_org_and_barcode", ["organizationID", "barcode"]),

  stockMovement: defineTable({
    organizationID: v.id("organizations"),
    itemID: v.id("stockItems"),

    fromLocationID: v.optional(v.id("locations")),
    toLocationID: v.optional(v.id("locations")),

    type: v.union(
      v.literal("MovementTypeIn"),
      v.literal("MovementTypeOut"),
      v.literal("MovementTypeTransfer"),
      v.literal("MovementTypeAdjustment"),
    ),

    quantity: v.number(),

    unitCost: v.number(),

    reference: v.string(),
    notes: v.string(),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["organizationID"])
    .index("by_org_and_item", ["organizationID", "itemID"])
    .index("by_from_location", ["organizationID", "fromLocationID"])
    .index("by_to_location", ["organizationID", "toLocationID"]),

  locationStocks: defineTable({
    organizationID: v.id("organizations"),
    locationID: v.id("locations"),
    itemID: v.id("stockItems"),

    quantity: v.number(),
    locationInLocation: v.string(),

    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_org", ["organizationID"])
    .index("by_location", ["organizationID", "locationID"])
    .index("by_item", ["organizationID", "itemID"])
    // Uniqueness: only one stock record per item per location — check this index before inserting
    .index("by_location_and_item", ["locationID", "itemID"]),

  locations: defineTable({
    organizationID: v.id("organizations"),
    name: v.string(),
    description: v.string(),
    code: v.string(),
    // Example: "MAIN", "WH-01", "LON-DC"

    isActive: v.boolean(),
    isDefault: v.boolean(),

    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_org", ["organizationID"])
    // Uniqueness: location code must be unique per org — check this index before inserting
    .index("by_org_and_code", ["organizationID", "code"]),

  invitations: defineTable({
    organizationID: v.id("organizations"),
    token: v.string(),
    createdByUserID: v.id("users"),
    label: v.optional(v.string()),
    isActive: v.boolean(),
    expiresAt: v.optional(v.number()),
    maxUses: v.optional(v.number()),
    uses: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["organizationID"])
    .index("by_token", ["token"]),
});
