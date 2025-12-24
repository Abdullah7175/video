"use client" // Add this directive at the top

// import { RequestForm } from '@/components/RequestForm';
import { RequestForm } from '@/app/agent/requests/add/RequestForm';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const NewRequestPage = () => {
    const router = useRouter();

    return (
        <div className="container mx-auto py-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">New Work Request</h1>
                <Button 
                    variant="outline" 
                    onClick={() => router.push('/agent/requests')}
                >
                    Back to Requests
                </Button>
            </div>
            <RequestForm />
        </div>
    );
};

export default NewRequestPage;