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
    accessorKey: "subtown",
    header: "Subtown Name",
  },
  {
    accessorKey: "town_name",
    header: "Town",
    cell: ({ row }) => {
      const townName = row.getValue("town_name");
      return <span>{townName || "Unknown Town"}</span>;
    },
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
      const subtown = row.original;

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
              <Link href={`/dashboard/subtowns/edit/${subtown.id}`} className="flex items-center">
                <Edit className="w-4 h-4 mr-2" />
                Edit Subtown
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <button 
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this subtown?')) {
                    if (window.handleDeleteSubtown) {
                      window.handleDeleteSubtown(subtown.id);
                    }
                  }
                }}
                className="flex items-center w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Subtown
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
]; 