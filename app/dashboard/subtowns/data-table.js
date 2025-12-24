"use client";

import { useState } from "react";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getFilteredRowModel,
} from "@tanstack/react-table";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Plus } from "lucide-react";
import Link from "next/link";

export function DataTable({ columns, data, children, onDelete }) {
    const [sorting, setSorting] = useState([]);
    const [columnFilters, setColumnFilters] = useState([]);

    // Add onDelete to the global scope for columns to access
    if (typeof window !== 'undefined') {
        window.handleDeleteSubtown = onDelete;
    }

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters,
        },
    });

    return (
        <>
            <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center py-4">
                {children}
                <div className="flex gap-3 items-center justify-end flex-1">
                    <Link href={"/dashboard/subtowns/add"}>
                        <Button variant="primary" className="border px-3">
                            <Plus /> Add Subtown
                        </Button>
                    </Link>
                    <Input
                        placeholder="Search subtowns..."
                        value={table.getColumn("subtown")?.getFilterValue() || ""}
                        onChange={(event) =>
                            table.getColumn("subtown")?.setFilterValue(event.target.value)
                        }
                        className="max-w-sm bg-gray-100 shadow-sm"
                    />
                </div>
            </div>

            <div className="rounded-md border mt-4">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    <div className="flex flex-col items-center justify-center text-gray-500">
                                        <MapPin className="w-8 h-8 mb-2" />
                                        <p>No subtowns found.</p>
                                        <p className="text-sm">Try adjusting your search criteria.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </>
    );
}
