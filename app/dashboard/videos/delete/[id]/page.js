"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter, useParams } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";

const DeleteVideoPage = () => {
  const params = useParams();
  const id = params.id;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/videos?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete video');
      }

      toast({
        title: "Video deleted successfully",
        variant: 'success',
      });
      router.push('/dashboard/videos');
    } catch (err) {
      setError(err.message);
      toast({
        title: "Failed to delete video",
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="space-y-4 border container max-w-2xl p-10 shadow-md rounded-lg">
        <h1 className="text-2xl font-semibold">Are you sure you want to delete this video?</h1>
        <p className="text-gray-600">This action cannot be undone. All associated data will be permanently removed.</p>

        {error && <div className="text-red-600 p-3 bg-red-50 rounded-md">{error}</div>}

        <div className="flex space-x-4 pt-4">
          <Button variant="outline" onClick={() => router.push('/dashboard/videos')}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Video'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteVideoPage;