"use client"

import { useEffect, useState } from "react";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { Input } from '@/components/ui/input';

export default function Page() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const limit = 20;

  useEffect(() => {
    const timeout = setTimeout(() => {
      const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
          let url = `/api/users?page=${page}&limit=${limit}`;
          if (search) url += `&filter=${encodeURIComponent(search)}`;
          if (dateFrom) url += `&date_from=${dateFrom}`;
          if (dateTo) url += `&date_to=${dateTo}`;
          
          const response = await fetch(url);
          if (response.ok) {
            const result = await response.json();
            if (result.data) {
              setUsers(result.data);
              setTotal(result.total);
            } else {
              setUsers(result);
              setTotal(result.length || 0);
            }
          } else {
            const errorData = await response.json().catch(() => ({}));
            setError(errorData.error || 'Failed to fetch users');
          }
        } catch (error) {
          console.error('Error fetching users:', error);
          setError('Error fetching users: ' + error.message);
        } finally {
          setLoading(false);
        }
      };
      fetchUsers();
    }, 300);
    return () => clearTimeout(timeout);
  }, [page, search, dateFrom, dateTo]);

  const totalPages = Math.ceil(total / limit);

  if (loading && users.length === 0) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <DataTable columns={columns} data={users}>
        <h1 className="text-3xl font-semibold">Users</h1>
        <div className="flex flex-wrap gap-4 mb-4 items-end">
          <Input
            placeholder="Search by ID, name, email, contact..."
            value={search}
            onChange={e => { setPage(1); setSearch(e.target.value); }}
            className="w-64"
          />
          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border rounded px-2 py-1" />
          </div>
        </div>
      </DataTable>
      
      {!loading && !error && (
        <div className="flex justify-center mt-6 gap-2">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))} 
            disabled={page === 1} 
            className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-2 py-1">Page {page} of {totalPages || 1}</span>
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
            disabled={page === totalPages} 
            className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
      
      {loading && users.length > 0 && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mx-auto"></div>
          <span className="ml-2 text-sm text-gray-600">Updating...</span>
        </div>
      )}
      
      {error && (
        <div className="text-center py-4">
          <div className="text-red-600 bg-red-50 border border-red-200 rounded p-4 max-w-md mx-auto">
            <p className="font-medium">Error loading users</p>
            <p className="text-sm mt-1">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
