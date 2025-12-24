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
    accessorKey: "title",
    header: "District Name",
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
    accessorKey: "updated_date",
    header: "Updated Date",
    cell: ({ row }) => {
      const date = row.getValue("updated_date");
      return <span>{date ? new Date(date).toLocaleDateString() : "-"}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const district = row.original;

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
              <Link href={`/dashboard/districts/edit/${district.id}`} className="flex items-center">
                <Edit className="w-4 h-4 mr-2" />
                Edit District
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <button 
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this district?')) {
                    // This will be handled by the parent component
                    window.deleteDistrictId = district.id;
                  }
                }}
                className="flex items-center w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete District
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
]; 