/**
 * E-Filing API Client
 * Used by Video Archiving to fetch divisions and zones from E-Filing system
 */

const EFILING_API_URL = process.env.EFILING_API_URL || 'http://localhost:5000/api/external';
const EFILING_API_KEY = process.env.EFILING_API_KEY;

/**
 * Get divisions from E-Filing system
 * @param {Object} filters - Filter options
 * @param {boolean} filters.active - Filter by active status
 * @param {number} filters.department_id - Filter by department ID
 * @returns {Promise<Object>} Response with divisions data
 */
export async function getDivisions(filters = {}) {
    try {
        const params = new URLSearchParams();
        
        if (filters.active !== undefined) {
            params.append('active', filters.active.toString());
        }
        if (filters.department_id) {
            params.append('department_id', filters.department_id.toString());
        }
        
        const url = `${EFILING_API_URL}/divisions${params.toString() ? `?${params.toString()}` : ''}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-API-Key': EFILING_API_KEY,
                'Content-Type': 'application/json'
            },
            // Timeout after 5 seconds
            signal: AbortSignal.timeout(5000)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(`E-Filing API error: ${errorData.error || response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching divisions from E-Filing:', error);
        
        // Return empty result on error (graceful degradation)
        return {
            success: false,
            error: error.message,
            data: []
        };
    }
}

/**
 * Get specific division by ID from E-Filing system
 * @param {number} id - Division ID
 * @returns {Promise<Object>} Division data
 */
export async function getDivisionById(id) {
    try {
        const url = `${EFILING_API_URL}/divisions/${id}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-API-Key': EFILING_API_KEY,
                'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(5000)
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                return { success: false, error: 'Division not found', data: null };
            }
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(`E-Filing API error: ${errorData.error || response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching division from E-Filing:', error);
        return {
            success: false,
            error: error.message,
            data: null
        };
    }
}

/**
 * Get zones from E-Filing system
 * @param {Object} filters - Filter options
 * @param {boolean} filters.active - Filter by active status
 * @returns {Promise<Object>} Response with zones data
 */
export async function getZones(filters = {}) {
    try {
        const params = new URLSearchParams();
        
        if (filters.active !== undefined) {
            params.append('active', filters.active.toString());
        }
        
        const url = `${EFILING_API_URL}/zones${params.toString() ? `?${params.toString()}` : ''}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-API-Key': EFILING_API_KEY,
                'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(5000)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(`E-Filing API error: ${errorData.error || response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching zones from E-Filing:', error);
        
        // Return empty result on error (graceful degradation)
        return {
            success: false,
            error: error.message,
            data: []
        };
    }
}

/**
 * Get specific zone by ID from E-Filing system
 * @param {number} id - Zone ID
 * @returns {Promise<Object>} Zone data
 */
export async function getZoneById(id) {
    try {
        const url = `${EFILING_API_URL}/zones/${id}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-API-Key': EFILING_API_KEY,
                'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(5000)
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                return { success: false, error: 'Zone not found', data: null };
            }
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(`E-Filing API error: ${errorData.error || response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching zone from E-Filing:', error);
        return {
            success: false,
            error: error.message,
            data: null
        };
    }
}

/**
 * Test E-Filing API connection
 * @returns {Promise<boolean>} True if connection is successful
 */
export async function testConnection() {
    try {
        const result = await getDivisions({ active: true });
        return result.success !== false;
    } catch (error) {
        return false;
    }
}

