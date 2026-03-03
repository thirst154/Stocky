"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, PencilIcon, Trash2Icon } from "lucide-react";

export type LocationStockRow = Doc<"locationStocks"> & {
  item: Doc<"stockItems"> | null;
};

// Inner cell component so each row owns its own confirm-dialog state
function ActionCell({
  row,
  onEditQuantity,
  onRemove,
}: {
  row: LocationStockRow;
  onEditQuantity: (row: LocationStockRow) => void;
  onRemove: (id: Id<"locationStocks">) => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onEditQuantity(row)}>
            <PencilIcon className="mr-2 h-4 w-4" />
            Edit quantity
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2Icon className="mr-2 h-4 w-4" />
            Remove from location
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from location?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove{" "}
              <strong>{row.item?.name ?? "this item"}</strong> from the location.
              The stock item itself will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onRemove(row._id)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function buildLocationStockColumns(
  onEditQuantity: (row: LocationStockRow) => void,
  onRemove: (id: Id<"locationStocks">) => void,
): ColumnDef<LocationStockRow>[] {
  return [
    {
      id: "name",
      accessorFn: (row) => row.item?.name ?? "—",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Item Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      id: "SKU",
      accessorFn: (row) => row.item?.SKU ?? "—",
      header: "SKU",
    },
    {
      id: "unit",
      accessorFn: (row) => row.item?.unit ?? "—",
      header: "Unit",
    },
    {
      accessorKey: "locationInLocation",
      header: "Sub-location",
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Qty at Location
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-right font-mono">{row.original.quantity}</div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <ActionCell
          row={row.original}
          onEditQuantity={onEditQuantity}
          onRemove={onRemove}
        />
      ),
    },
  ];
}
