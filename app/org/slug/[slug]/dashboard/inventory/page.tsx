"use client";

import { buildInventoryColumns } from "@/components/inventory/AbstractStockTable/Columns";
import { DataTable } from "@/components/inventory/AbstractStockTable/dataTable";
import { CreateStockDialog } from "@/components/inventory/NewStockDialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Plus } from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

export default function Page() {
  const params = useParams();
  const slug = params.slug as string | undefined;
  const org = useQuery(
    api.organizations.getOrgBySlug,
    slug ? { slug } : "skip",
  );

  const [newStockDialogOpen, setNewStockDialogOpen] = useState(false);
  const columns = useMemo(() => buildInventoryColumns(slug ?? ""), [slug]);

  const StockItems = useQuery(
    api.stockItems.getStockItems,
    org?._id ? { orgId: org._id } : "skip",
  );

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      {/* Header*/}
      <div className="flex flex-col gap-2">
        {/* Org Badges*/}
        <div className="flex items-center gap-2 font-mono capitalize text-sm text-muted-foreground">
          <span className="border rounded p-1">{org?.slug}</span>
        </div>
        <h1 className="text-3xl font-medium tracking-tight">Inventory</h1>
        <p className="text-muted-foreground">
          Manage your primative inventory items here.
        </p>
      </div>
      {/* Inventory items */}
      <div className="flex justify-between items-end">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Stock Primatives
        </p>
        <Button onClick={() => setNewStockDialogOpen(true)}>
          Add Item <Plus />
        </Button>
      </div>

      <Separator />

      <div>
        {StockItems && <DataTable columns={columns} data={StockItems} />}
      </div>
      {org && (
        <CreateStockDialog
          orgId={org._id}
          open={newStockDialogOpen}
          onOpenChange={setNewStockDialogOpen}
        />
      )}
    </div>
  );
}
