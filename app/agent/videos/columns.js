"use client"

import { MoreHorizontal ,MapPin  } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

export const columns = [
  {
    accessorKey: "work_request_id",
    header: "Work Request ID",
  },
  {
    accessorKey: "address",
    header: "Address",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
  accessorKey: "location", 
  header: "Location",
  cell: ({ row }) => {
    const lat = row.original.latitude;
    const lng = row.original.longitude;

    if (lat && lng) {
      return (
        <a 
          href={`https://www.google.com/maps?q=${lat},${lng}`} 
          target="_blank" 
          rel="noopener noreferrer"
        >
          <Button variant="outline" size="sm">
            <MapPin className="h-4 w-4 mr-2" />
            View Map
          </Button>
        </a>
      );
    }

    return <span className="text-gray-400">No location</span>;
  }
},
  {
    accessorKey: "created_at",
    header: "Uploaded On",
    cell: ({ getValue }) => {
      const date = new Date(getValue());
      return date.toLocaleDateString();
    },
  },
]