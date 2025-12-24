"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

function AddSubTownPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedTownId = searchParams.get('town_id');
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [towns, setTowns] = useState([]);
  const [formData, setFormData] = useState({
    subtown: "",
    town_id: preSelectedTownId || ""
  });

  useEffect(() => {
    // Fetch towns for dropdown
    const fetchTowns = async () => {
      try {
        const response = await fetch('/api/towns?limit=1000');
        const data = await response.json();
        if (data.data) {
          setTowns(data.data);
        } else if (Array.isArray(data)) {
          setTowns(data);
        }
      } catch (error) {
        console.error('Error fetching towns:', error);
      }
    };

    fetchTowns();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subtown.trim()) {
      toast({
        title: "Validation Error",
        description: "Subtown name is required",
        variant: "destructive"
      });
      return;
    }

    if (!formData.town_id) {
      toast({
        title: "Validation Error",
        description: "Please select a town",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/subtowns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Subtown added successfully",
          variant: "success"
        });
        // Redirect back to the town's subtowns page if we came from there
        if (preSelectedTownId) {
          router.push(`/dashboard/subtowns?town_id=${preSelectedTownId}`);
        } else {
          router.push('/dashboard/subtowns');
        }
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to add subtown",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error adding subtown:', error);
      toast({
        title: "Error",
        description: "Failed to add subtown",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link 
            href={preSelectedTownId ? `/dashboard/subtowns?town_id=${preSelectedTownId}` : "/dashboard/subtowns"} 
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Subtowns
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Add New Subtown</h1>
            <p className="text-gray-600">
              Create a new subtown and associate it with a town
            </p>
          </div>
          <Plus className="w-8 h-8 text-blue-600" />
        </div>
      </div>

      <Card className="max-w-2xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="subtown" className="block text-sm font-medium text-gray-700 mb-2">
              Subtown Name *
            </label>
            <input
              type="text"
              id="subtown"
              name="subtown"
              value={formData.subtown}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter subtown name"
              required
            />
          </div>

          <div>
            <label htmlFor="town_id" className="block text-sm font-medium text-gray-700 mb-2">
              Town *
            </label>
            <select
              id="town_id"
              name="town_id"
              value={formData.town_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a town</option>
              {towns.map((town) => (
                <option key={town.id} value={town.id}>
                  {town.town} {town.district_name && `(${town.district_name})`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-4">
            <Link href={preSelectedTownId ? `/dashboard/subtowns?town_id=${preSelectedTownId}` : "/dashboard/subtowns"}>
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Adding..." : "Add Subtown"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function PageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddSubTownPage />
    </Suspense>
  );
}

export default PageWrapper; 