"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Edit } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function EditTownPage() {
  const router = useRouter();
  const params = useParams();
  const townId = params.id;
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [formData, setFormData] = useState({
    town: "",
    district_id: "",
    subtown: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch town data
        const townResponse = await fetch(`/api/towns?id=${townId}`);
        if (townResponse.ok) {
          const townData = await townResponse.json();
          setFormData({
            town: townData.town || "",
            district_id: townData.district_id || "",
            subtown: townData.subtown || ""
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to load town data",
            variant: "destructive"
          });
          router.push('/dashboard/towns');
          return;
        }

        // Fetch districts for dropdown
        const districtsResponse = await fetch('/api/complaints/getinfo');
        const districtsData = await districtsResponse.json();
        if (districtsData.districts) {
          setDistricts(districtsData.districts);
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

    if (townId) {
      fetchData();
    }
  }, [townId, router, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.town.trim()) {
      toast({
        title: "Validation Error",
        description: "Town name is required",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    
    try {
      const response = await fetch(`/api/towns`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: townId,
          ...formData
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Town updated successfully",
          variant: "success"
        });
        router.push('/dashboard/towns');
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to update town",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating town:', error);
      toast({
        title: "Error",
        description: "Failed to update town",
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
    return <div className="flex items-center justify-center h-96 text-lg">Loading town data...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dashboard/towns" className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-4 h-4" />
            Back to Towns
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Edit Town</h1>
            <p className="text-gray-600">
              Update town information and associations
            </p>
          </div>
          <Edit className="w-8 h-8 text-blue-600" />
        </div>
      </div>

      <Card className="max-w-2xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="town" className="block text-sm font-medium text-gray-700 mb-2">
              Town Name *
            </label>
            <input
              type="text"
              id="town"
              name="town"
              value={formData.town}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter town name"
              required
            />
          </div>

          <div>
            <label htmlFor="district_id" className="block text-sm font-medium text-gray-700 mb-2">
              District
            </label>
            <select
              id="district_id"
              name="district_id"
              value={formData.district_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a district (optional)</option>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.district || district.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="subtown" className="block text-sm font-medium text-gray-700 mb-2">
              Subtown
            </label>
            <input
              type="text"
              id="subtown"
              name="subtown"
              value={formData.subtown}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter subtown name (optional)"
            />
            <p className="text-sm text-gray-500 mt-1">
              Note: You can also manage subtowns separately
            </p>
          </div>

          <div className="flex justify-end gap-4">
            <Link href="/dashboard/towns">
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
              {saving ? "Saving..." : "Update Town"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
} 