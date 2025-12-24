"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter, useParams } from 'next/navigation';

const DeleteUserPage = () => {
  const params = useParams();
  const id = params.id;
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/agents?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete agent')
      }

      window.location.href = '/dashboard/agents';
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center">
      <div className="space-y-4 border container max-w-2xl p-10 shadow-md mt-20">
        <h1 className="text-2xl">Are you sure you want to delete this agent?</h1>
        <p>This action cannot be undone.</p>

        {error && <div className="text-red-600">{error}</div>}

        <div className="flex space-x-4">
          <Button variant="outline" onClick={() => window.location.href = '/dashboard/agents'}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Agent'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default DeleteUserPage
