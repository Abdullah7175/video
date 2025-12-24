"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Edit } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function EditSubTownPage() {
  const router = useRouter();
  const params = useParams();
  const subtownId = params.id;
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [towns, setTowns] = useState([]);
  const [formData, setFormData] = useState({
    subtown: "",
    town_id: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch subtown data
        const subtownResponse = await fetch(`/api/subtowns?id=${subtownId}`);
        if (subtownResponse.ok) {
          const subtownData = await subtownResponse.json();
          setFormData({
            subtown: subtownData.subtown || "",
            town_id: subtownData.town_id || ""
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to load subtown data",
            variant: "destructive"
          });
          router.push('/dashboard/subtowns');
          return;
        }

        // Fetch towns for dropdown
        const townsResponse = await fetch('/api/towns?limit=1000');
        const townsData = await townsResponse.json();
        if (townsData.data) {
          setTowns(townsData.data);
        } else if (Array.isArray(townsData)) {
          setTowns(townsData);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive"
        });
        setLoading(false);
      }
    };

    if (subtownId) {
      fetchData();
    }
  }, [subtownId, router, toast]);

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

    setSaving(true);
    
    try {
      const response = await fetch(`/api/subtowns`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: subtownId,
          ...formData
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Subtown updated successfully",
          variant: "success"
        });
        router.push('/dashboard/subtowns');
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to update subtown",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating subtown:', error);
      toast({
        title: "Error",
        description: "Failed to update subtown",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96 text-lg">Loading subtown data...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dashboard/subtowns" className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-4 h-4" />
            Back to Subtowns
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Edit Subtown</h1>
            <p className="text-gray-600">
              Update subtown information and town association
            </p>
          </div>
          <Edit className="w-8 h-8 text-blue-600" />
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
            <Link href="/dashboard/subtowns">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Update Subtown"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
} 