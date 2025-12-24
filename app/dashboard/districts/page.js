"use client";

import { useState, useEffect } from "react";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { Card } from "@/components/ui/card";
import { Plus, MapPin } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function DistrictsPage() {
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const response = await fetch('/api/districts?limit=1000');
        const data = await response.json();
        
        if (data.data) {
          setDistricts(data.data);
        } else if (Array.isArray(data)) {
          setDistricts(data);
        } else {
          setDistricts([]);
        }
        
        setLoading(false);
      } catch (e) {
        setError("Failed to load districts");
        setLoading(false);
      }
    };

    fetchDistricts();
  }, []);

  const handleDelete = async (districtId) => {
    if (!confirm('Are you sure you want to delete this district?')) return;
    
    try {
      const response = await fetch('/api/districts', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: districtId }),
      });

      if (response.ok) {
        setDistricts(prev => prev.filter(district => district.id !== districtId));
        toast({
          title: "District deleted successfully",
          description: "The district has been removed from the system.",
          variant: "success"
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Failed to delete district",
          description: errorData.error || "An error occurred while deleting the district.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting district:', error);
      toast({
        title: "Error",
        description: "Failed to delete district",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96 text-lg">Loading districts...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-96 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Districts Management</h1>
            <p className="text-gray-600">
              Manage districts and their associated towns
            </p>
          </div>
          <Link href="/dashboard/districts/add">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add District
            </button>
          </Link>
        </div>
      </div>

      <Card className="p-6">
        <DataTable 
          columns={columns} 
          data={districts}
          onDelete={handleDelete}
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span className="font-medium">Districts ({districts.length})</span>
          </div>
        </DataTable>
      </Card>
    </div>
  );
} 