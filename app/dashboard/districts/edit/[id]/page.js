"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Edit } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function EditDistrictPage() {
  const router = useRouter();
  const params = useParams();
  const districtId = params.id;
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: ""
  });

  useEffect(() => {
    const fetchDistrict = async () => {
      try {
        const response = await fetch(`/api/districts?id=${districtId}`);
        if (response.ok) {
          const districtData = await response.json();
          setFormData({
            title: districtData.title || ""
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to load district data",
            variant: "destructive"
          });
          router.push('/dashboard/districts');
          return;
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching district data:', error);
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive"
        });
        setLoading(false);
      }
    };

    if (districtId) {
      fetchDistrict();
    }
  }, [districtId, router, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "District title is required",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    
    try {
      const response = await fetch(`/api/districts`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: districtId,
          ...formData
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "District updated successfully",
          variant: "success"
        });
        router.push('/dashboard/districts');
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to update district",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating district:', error);
      toast({
        title: "Error",
        description: "Failed to update district",
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
    return <div className="flex items-center justify-center h-96 text-lg">Loading district data...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dashboard/districts" className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-4 h-4" />
            Back to Districts
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Edit District</h1>
            <p className="text-gray-600">
              Update district information
            </p>
          </div>
          <Edit className="w-8 h-8 text-blue-600" />
        </div>
      </div>

      <Card className="max-w-2xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              District Name *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter district name"
              required
            />
          </div>

          <div className="flex justify-end gap-4">
            <Link href="/dashboard/districts">
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
              {saving ? "Saving..." : "Update District"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
} 