# Updated Database Separation Strategy

## Problem with Original Plan

The original plan completely removes `divisions` and `efiling_zones` tables from Video Archiving database, requiring all queries to go through API calls. This creates:

1. **Performance Issues**: Every filter, dropdown, and query requires an API call (network latency)
2. **Reliability Issues**: If E-Filing API is down, Video Archiving becomes non-functional
3. **Complexity**: Need to update dozens of files that currently query these tables directly
4. **Scalability**: API calls for every request could overwhelm E-Filing server

## Recommended Approach: Read-Only Replicated Tables

### Strategy

Keep **read-only copies** of `divisions` and `efiling_zones` in Video Archiving database, but:
- Remove FK constraints (since they're managed in E-Filing)
- Sync data periodically or on-demand via API
- Use local tables for queries (performance)
- Validate critical operations via API when needed

### Benefits

✅ **Performance**: Local queries are fast (no network latency)  
✅ **Resilience**: Video Archiving works even if E-Filing API is temporarily down  
✅ **Minimal Code Changes**: Existing queries continue to work  
✅ **Data Consistency**: Sync mechanism ensures data stays current  
✅ **Validation**: Can still validate via API for critical operations  

---

## Updated Database Schema Strategy

### Video Archiving Database

**Keep (Read-Only Copies):**
- `divisions` table (read-only, synced from E-Filing)
- `efiling_zones` table (read-only, synced from E-Filing)

**Remove:**
- All FK constraints to `efiling_departments` (divisions.department_id)
- All FK constraints from Video Archiving tables to divisions/zones
- All `efiling_*` tables (except efiling_zones)

**Columns:**
- Keep `division_id` and `zone_id` columns as integers (no FK constraints)
- Add sync metadata columns (optional): `last_synced_at`, `sync_version`

### E-Filing Database

**Keep (Master Copies):**
- `divisions` table (master, managed by E-Filing)
- `efiling_zones` table (master, managed by E-Filing)
- All `efiling_*` tables

**Remove:**
- All video archiving tables
- FK constraint from `efiling_files.work_request_id`

---

## Sync Strategy Options

### Option 1: Periodic Sync (Recommended for Production)

**How it works:**
- Background job runs every 5-15 minutes
- Fetches divisions/zones from E-Filing API
- Updates Video Archiving database
- Logs sync status

**Pros:**
- Simple to implement
- Predictable load on E-Filing
- Works even if Video Archiving is temporarily offline

**Cons:**
- Data may be slightly stale (5-15 min delay)
- Need to handle sync failures

**Implementation:**
```javascript
// lib/syncDivisionsZones.js
export async function syncDivisionsAndZones() {
  try {
    const divisions = await getDivisionsFromEfilingAPI();
    const zones = await getZonesFromEfilingAPI();
    
    // Upsert into Video Archiving database
    await upsertDivisions(divisions);
    await upsertZones(zones);
    
    return { success: true, synced: new Date() };
  } catch (error) {
    // Log error, retry later
    return { success: false, error: error.message };
  }
}
```

### Option 2: On-Demand Sync with Cache

**How it works:**
- First request triggers API call
- Cache result in database
- Subsequent requests use cached data
- Cache expires after TTL (e.g., 5 minutes)
- Background refresh before expiration

**Pros:**
- Always fresh data when needed
- Reduces API calls (caching)

**Cons:**
- More complex implementation
- First request may be slower

### Option 3: Webhook-Based Sync (Advanced)

**How it works:**
- E-Filing sends webhook when divisions/zones change
- Video Archiving updates database immediately

**Pros:**
- Real-time sync
- No polling needed

**Cons:**
- More complex infrastructure
- Need webhook security
- Need to handle missed webhooks

---

## Updated SQL Script Changes

### For Video Archiving Database

**Instead of:**
```sql
-- Drop divisions table
DROP TABLE IF EXISTS public.divisions CASCADE;
DROP TABLE IF EXISTS public.efiling_zones CASCADE;
```

**Do this:**
```sql
-- Keep divisions and efiling_zones as read-only copies
-- Remove FK constraints only

-- Remove FK constraint from divisions.department_id
ALTER TABLE public.divisions DROP CONSTRAINT IF EXISTS divisions_department_id_fkey;

-- Remove FK constraints from Video Archiving tables to divisions/zones
ALTER TABLE public.work_requests DROP CONSTRAINT IF EXISTS work_requests_division_id_fkey;
ALTER TABLE public.work_requests DROP CONSTRAINT IF EXISTS work_requests_zone_id_fkey;
-- ... (similar for other tables)

-- Add sync metadata columns (optional)
ALTER TABLE public.divisions ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP;
ALTER TABLE public.efiling_zones ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP;

-- Add comments
COMMENT ON TABLE public.divisions IS 
    'Read-only copy of divisions table. Synced from E-Filing database via API. Do not modify directly.';
COMMENT ON TABLE public.efiling_zones IS 
    'Read-only copy of efiling_zones table. Synced from E-Filing database via API. Do not modify directly.';
```

---

## Code Changes Required

### Minimal Changes Needed

Since we're keeping the tables, most existing code continues to work:

1. **No changes needed** for:
   - Most API routes that query divisions/zones
   - Geography filter libraries
   - Dropdown components
   - Filter queries

2. **Add sync mechanism**:
   - Create sync job/function
   - Schedule periodic sync
   - Handle sync errors

3. **Optional validation**:
   - For critical operations (create/update), validate via API
   - Use local data for queries/filters

---

## Implementation Steps

### Step 1: Update SQL Script
- Modify `copy_and_separate_databases.sql` to keep divisions/zones
- Remove only FK constraints
- Add sync metadata columns

### Step 2: Create Sync Library
- `lib/syncDivisionsZones.js` - Sync function
- `lib/efilingApiClient.js` - API client for E-Filing

### Step 3: Create Sync Job
- Next.js API route: `app/api/sync/divisions-zones/route.js`
- Or cron job using node-cron
- Or external cron service

### Step 4: Update Environment Variables
```env
# Video Archiving
EFILING_API_URL=http://localhost:5000/api/external
EFILING_API_KEY=your_key
SYNC_DIVISIONS_ZONES_ENABLED=true
SYNC_INTERVAL_MINUTES=10
```

### Step 5: Testing
- Test sync mechanism
- Test with E-Filing API down (should use cached data)
- Test data consistency
- Test performance

---

## Comparison: Original vs Updated Plan

| Aspect | Original Plan | Updated Plan |
|--------|--------------|--------------|
| **Performance** | API call for every query | Local database query |
| **Reliability** | Depends on E-Filing API | Works independently |
| **Code Changes** | Update many files | Minimal changes |
| **Data Freshness** | Always fresh | 5-15 min delay (acceptable) |
| **Complexity** | High (API calls everywhere) | Low (sync job only) |
| **Scalability** | May overwhelm E-Filing | Predictable load |

---

## Recommendation

**Use the Updated Plan (Read-Only Replicated Tables)** because:

1. ✅ Better performance (local queries)
2. ✅ Better reliability (works independently)
3. ✅ Less code changes (existing queries work)
4. ✅ Easier to implement (sync job vs many API calls)
5. ✅ Better user experience (faster responses)

The 5-15 minute sync delay is acceptable because:
- Divisions and zones don't change frequently
- Most operations are reads, not writes
- Can add on-demand sync for critical operations if needed

---

## Next Steps

1. **Decide on sync strategy** (Option 1 recommended)
2. **Update SQL script** to keep tables, remove only FK constraints
3. **Create sync library** and job
4. **Test sync mechanism**
5. **Deploy and monitor**

