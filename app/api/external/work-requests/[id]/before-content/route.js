import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { validateApiKey, checkRateLimit } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/external/work-requests/{id}/before-content
 * Get before content (images/videos) for a work request
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
        
        // Get before content with all required fields
        const query = `
            SELECT 
                bc.id,
                bc.work_request_id,
                bc.description,
                bc.link,
                bc.content_type,
                bc.file_name,
                bc.file_size,
                bc.file_type,
                bc.created_at,
                bc.creator_id,
                bc.creator_type,
                bc.creator_name,
                ST_Y(bc.geo_tag) as latitude,
                ST_X(bc.geo_tag) as longitude
            FROM before_content bc
            WHERE bc.work_request_id = $1
            ORDER BY bc.created_at DESC
        `;
        
        const result = await client.query(query, [workRequestId]);
        
        return NextResponse.json({
            data: result.rows,
            count: result.rows.length,
            work_request_id: workRequestId
        });
        
    } catch (error) {
        console.error('Error fetching before content:', error);
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

