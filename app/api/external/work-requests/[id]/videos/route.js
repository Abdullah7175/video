import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { validateApiKey, checkRateLimit } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/external/work-requests/{id}/videos
 * Get videos for a work request (optional endpoint)
 */
export async function GET(request, { params }) {
    // Validate API key
    const authResult = validateApiKey(request);
    if (!authResult.valid) {
        return NextResponse.json(
            { error: authResult.error },
            { status: 401 }
        );
    }
    
    // Rate limiting
    const apiKey = request.headers.get('X-API-Key');
    const rateLimitResult = checkRateLimit(apiKey, 100, 60000);
    if (!rateLimitResult.allowed) {
        return NextResponse.json(
            { error: 'Rate limit exceeded' },
            { status: 429 }
        );
    }
    
    const { id } = params;
    const workRequestId = parseInt(id, 10);
    
    if (isNaN(workRequestId)) {
        return NextResponse.json(
            { error: 'Invalid work request ID' },
            { status: 400 }
        );
    }
    
    let client;
    try {
        client = await connectToDatabase();
        
        // Verify work request exists
        const wrCheck = await client.query(
            'SELECT id FROM work_requests WHERE id = $1',
            [workRequestId]
        );
        
        if (wrCheck.rows.length === 0) {
            return NextResponse.json(
                { error: 'Work request not found' },
                { status: 404 }
            );
        }
        
        // Get videos
        const query = `
            SELECT 
                id,
                link,
                description,
                file_name,
                file_size,
                file_type,
                created_at,
                creator_name
            FROM videos
            WHERE work_request_id = $1
            ORDER BY created_at DESC
        `;
        
        const result = await client.query(query, [workRequestId]);
        
        return NextResponse.json({
            success: true,
            data: result.rows
        });
        
    } catch (error) {
        console.error('Error fetching videos:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    } finally {
        if (client) {
            client.release?.();
        }
    }
}

