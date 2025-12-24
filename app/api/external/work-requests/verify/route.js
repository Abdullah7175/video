import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { validateApiKey, checkRateLimit } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/external/work-requests/verify
 * Verify work request exists and return basic info
 * Used by E-Filing to validate work_request_id before creating files
 */
export async function POST(request) {
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
    
    let client;
    try {
        const body = await request.json();
        const { work_request_id } = body;
        
        if (!work_request_id) {
            return NextResponse.json(
                { error: 'work_request_id is required' },
                { status: 400 }
            );
        }
        
        const workRequestId = parseInt(work_request_id, 10);
        
        if (isNaN(workRequestId)) {
            return NextResponse.json(
                { error: 'Invalid work_request_id format' },
                { status: 400 }
            );
        }
        
        client = await connectToDatabase();
        
        // Get work request with basic info
        const query = `
            SELECT 
                wr.id,
                wr.address,
                wr.description,
                wr.status_id,
                wr.request_date,
                wr.created_date,
                s.name as status_name,
                ct.type_name as complaint_type
            FROM work_requests wr
            LEFT JOIN status s ON wr.status_id = s.id
            LEFT JOIN complaint_types ct ON wr.complaint_type_id = ct.id
            WHERE wr.id = $1
        `;
        
        const result = await client.query(query, [workRequestId]);
        
        if (result.rows.length === 0) {
            return NextResponse.json({
                exists: false,
                valid: false,
                message: 'Work request not found'
            });
        }
        
        const workRequest = result.rows[0];
        
        return NextResponse.json({
            exists: true,
            valid: true,
            data: {
                id: workRequest.id,
                address: workRequest.address,
                description: workRequest.description,
                status: workRequest.status_name,
                status_id: workRequest.status_id,
                request_date: workRequest.request_date,
                created_date: workRequest.created_date
            }
        });
        
    } catch (error) {
        console.error('Error verifying work request:', error);
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

