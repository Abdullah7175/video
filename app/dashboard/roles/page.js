"use client"
import { columns } from "./columns"
import { DataTable } from "./data-table"
import { useEffect, useState } from "react";


export default function Page() {
  const [complaint, setComplaint] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
//   useEffect(() => {
//     const fetchComplaints = async () => {
//       try {
//         const response = await fetch('/api/roles', { method: 'GET' });

//         if (response.ok) {
//           const data = await response.json();
//           console.log('Fetched Complaints:', data);
//           setComplaint(data);
//         } else {
//           setError('Failed to fetch complaints');
//         }
//       } catch (error) {
//         console.error('Error fetching complaints:', error);
//         setError('Error fetching complaints');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchComplaints();
//   }, []);

  
  return (
    <div className="container mx-auto px-4 py-10">
      <DataTable columns={columns} data={complaint}>
        <h1 className="text-3xl font-semibold">Roles Managment</h1>
      </DataTable>
    </div>
  )
}
