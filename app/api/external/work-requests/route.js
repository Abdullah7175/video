import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { validateApiKey, checkRateLimit } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/external/work-requests
 * List/search work requests for E-Filing integration
 * 
 * Query params:
 * - search: Search term (address, description)
 * - status: Status ID filter
 * - limit: Number of results (default: 100, max: 500)
 * - offset: Pagination offset (default: 0)
 * - scope: Must be 'efiling' to access this endpoint
 */
export async function GET(request) {
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
    const rateLimitResult = checkRateLimit(apiKey, 100, 60000); // 100 requests per minute
    if (!rateLimitResult.allowed) {
        return NextResponse.json(
            { 
                error: 'Rate limit exceeded',
                resetAt: new Date(rateLimitResult.resetAt).toISOString()
            },
            { 
                status: 429,
                headers: {
                    'X-RateLimit-Limit': '100',
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': rateLimitResult.resetAt.toString()
                }
            }
        );
    }
    
    const { searchParams } = new URL(request.url);
    
    // Support both 'search' and 'filter' parameters (filter is alias for search)
    const search = searchParams.get('search') || searchParams.get('filter') || '';
    const status = searchParams.get('status'); // Can be status name or ID
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    
    let client;
    try {
        client = await connectToDatabase();
        
        // Build query
        let whereClauses = [];
        let params = [];
        let paramIndex = 1;
        
        // Search filter - search in address, description, ID, or complaint type
        if (search) {
            const searchNum = parseInt(search, 10);
            if (!isNaN(searchNum)) {
                // If search is a number, search by ID
                whereClauses.push(`(wr.id = $${paramIndex} OR wr.address ILIKE $${paramIndex + 1} OR wr.description ILIKE $${paramIndex + 1} OR ct.type_name ILIKE $${paramIndex + 1})`);
                params.push(searchNum, `%${search}%`);
                paramIndex += 2;
            } else {
                // Text search in address, description, or complaint type
                whereClauses.push(`(wr.address ILIKE $${paramIndex} OR wr.description ILIKE $${paramIndex} OR ct.type_name ILIKE $${paramIndex})`);
                params.push(`%${search}%`);
                paramIndex++;
            }
        }
        
        // Status filter - can be status name or ID
        if (status) {
            const statusNum = parseInt(status, 10);
            if (!isNaN(statusNum)) {
                // Status ID
                whereClauses.push(`wr.status_id = $${paramIndex}`);
                params.push(statusNum);
                paramIndex++;
            } else {
                // Status name
                whereClauses.push(`s.name ILIKE $${paramIndex}`);
                params.push(`%${status}%`);
                paramIndex++;
            }
        }
        
        const whereClause = whereClauses.length > 0 
            ? `WHERE ${whereClauses.join(' AND ')}`
            : '';
        
        // Count query
        const countQuery = `
            SELECT COUNT(*) as total
            FROM work_requests wr
            ${whereClause}
        `;
        
        const countResult = await client.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total, 10);
        
        // Data query - return fields matching specification
        const dataQuery = `
            SELECT 
                wr.id,
                wr.request_date,
                wr.address,
                wr.description,
                wr.zone_id,
                wr.division_id,
                wr.town_id,
                ST_Y(wr.geo_tag) as latitude,
                ST_X(wr.geo_tag) as longitude,
                s.name as status_name,
                ct.type_name as complaint_type,
                t.town as town_name,
                d.title as district_name,
                COALESCE(u.name, ag.name, sm.name) as creator_name,
                wr.created_date
            FROM work_requests wr
            LEFT JOIN complaint_types ct ON wr.complaint_type_id = ct.id
            LEFT JOIN status s ON wr.status_id = s.id
            LEFT JOIN town t ON wr.town_id = t.id
            LEFT JOIN district d ON t.district_id = d.id
            LEFT JOIN users u ON wr.creator_type = 'user' AND wr.creator_id = u.id
            LEFT JOIN agents ag ON wr.creator_type = 'agent' AND wr.creator_id = ag.id
            LEFT JOIN socialmediaperson sm ON wr.creator_type = 'socialmedia' AND wr.creator_id = sm.id
            ${whereClause}
            ORDER BY wr.created_date DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        
        params.push(limit, offset);
        const dataResult = await client.query(dataQuery, params);
        
        return NextResponse.json({
            data: dataResult.rows,
            total,
            limit,
            offset,
            hasMore: offset + limit < total
        }, {
            headers: {
                'X-RateLimit-Limit': '100',
                'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
                'X-RateLimit-Reset': rateLimitResult.resetAt.toString()
            }
        });
        
    } catch (error) {
        console.error('Error fetching work requests:', error);
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

