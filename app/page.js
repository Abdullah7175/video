"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
    const router = useRouter();
    
    useEffect(() => {
        // Redirect to login page
        router.replace("/login");
    }, [router]);
    
    return null;
}
