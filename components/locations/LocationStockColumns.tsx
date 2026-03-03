"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Trash2Icon } from "lucide-react";

export type LocationStockRow = Doc<"locationStocks"> & {
  item: Doc<"stockItems"> | null;
};

export function buildLocationStockColumns(
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
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onRemove(row.original._id)}
            >
              <Trash2Icon className="mr-2 h-4 w-4" />
              Remove from location
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
