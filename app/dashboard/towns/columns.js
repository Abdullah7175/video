"use client";

import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

export const columns = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "town",
    header: "Town Name",
  },
  {
    accessorKey: "district_name",
    header: "District",
    cell: ({ row }) => {
      const districtName = row.getValue("district_name");
      return <span>{districtName || "No District"}</span>;
    },
  },
  {
    accessorKey: "created_date",
    header: "Created Date",
    cell: ({ row }) => {
      const date = row.getValue("created_date");
      return <span>{date ? new Date(date).toLocaleDateString() : "-"}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const town = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>
              <Link href={`/dashboard/towns/edit/${town.id}`} className="flex items-center">
                <Edit className="w-4 h-4 mr-2" />
                Edit Town
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href={`/dashboard/subtowns?town_id=${town.id}`} className="flex items-center">
                <Edit className="w-4 h-4 mr-2" />
                Manage Subtowns
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <button 
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this town?')) {
                    // This will be handled by the parent component
                    window.deleteTownId = town.id;
                  }
                }}
                className="flex items-center w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Town
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
]; 