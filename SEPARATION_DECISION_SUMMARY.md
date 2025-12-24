# Database Separation Decision Summary

## Question
Should we remove `divisions` and `efiling_zones` tables from Video Archiving database, or keep them as read-only copies?

## Decision: **Keep Read-Only Copies** ✅

## Why This Decision?

### Original Plan (Remove Tables)
- ❌ Every query requires API call → Slow performance
- ❌ Video Archiving breaks if E-Filing API is down → Poor reliability
- ❌ Need to update many files → High complexity
- ❌ May overwhelm E-Filing server → Scalability issues

### Updated Plan (Keep Read-Only Copies)
- ✅ Local database queries → Fast performance
- ✅ Works independently → Better reliability
- ✅ Minimal code changes → Lower complexity
- ✅ Predictable sync load → Better scalability

## What Changed?

### SQL Script (`copy_and_separate_databases.sql`)
**Before:**
```sql
-- Drop divisions and efiling_zones tables
DROP TABLE IF EXISTS public.divisions CASCADE;
DROP TABLE IF EXISTS public.efiling_zones CASCADE;
```

**After:**
```sql
-- Keep divisions and efiling_zones as read-only copies
-- Remove only FK constraints
ALTER TABLE public.divisions DROP CONSTRAINT IF EXISTS divisions_department_id_fkey;
-- ... (remove other FK constraints)
-- Add sync metadata
ALTER TABLE public.divisions ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP;
```

### What We Keep
- ✅ `divisions` table in Video Archiving (read-only copy)
- ✅ `efiling_zones` table in Video Archiving (read-only copy)
- ✅ All existing queries continue to work

### What We Remove
- ❌ FK constraints (for independence)
- ❌ All `efiling_*` tables (except efiling_zones)

## What's Next?

### 1. Database Migration
- ✅ SQL script updated (already done)
- ⏳ Run migration script
- ⏳ Verify data integrity

### 2. Create Sync Mechanism
- ⏳ Create `lib/efilingApiClient.js` - API client
- ⏳ Create `lib/syncDivisionsZones.js` - Sync function
- ⏳ Create sync job (cron or API route)
- ⏳ Test sync mechanism

### 3. Code Updates
- ✅ Most code needs NO changes (tables still exist)
- ⏳ Add sync job scheduling
- ⏳ Optional: Add validation for critical operations

### 4. Testing
- ⏳ Test sync mechanism
- ⏳ Test with E-Filing API down (should use cached data)
- ⏳ Test data consistency
- ⏳ Test performance

## Sync Strategy

**Recommended: Periodic Sync (every 5-15 minutes)**

```javascript
// lib/syncDivisionsZones.js
export async function syncDivisionsAndZones() {
  // 1. Fetch from E-Filing API
  const divisions = await getDivisionsFromEfilingAPI();
  const zones = await getZonesFromEfilingAPI();
  
  // 2. Upsert into Video Archiving database
  await upsertDivisions(divisions);
  await upsertZones(zones);
  
  // 3. Update last_synced_at
  await updateSyncTimestamp();
}
```

## Benefits Summary

| Aspect | Result |
|--------|--------|
| **Performance** | Fast (local queries) |
| **Reliability** | High (works independently) |
| **Code Changes** | Minimal (existing queries work) |
| **Data Freshness** | 5-15 min delay (acceptable) |
| **Complexity** | Low (sync job only) |

## Files Updated

1. ✅ `copy_and_separate_databases.sql` - Updated to keep tables
2. ✅ `UPDATED_SEPARATION_STRATEGY.md` - Detailed strategy document
3. ✅ `SEPARATION_DECISION_SUMMARY.md` - This file

## Files to Create (Next Steps)

1. ⏳ `lib/efilingApiClient.js` - API client for E-Filing
2. ⏳ `lib/syncDivisionsZones.js` - Sync function
3. ⏳ `app/api/sync/divisions-zones/route.js` - Sync endpoint (optional)
4. ⏳ Cron job configuration (or use external service)

## Recommendation

**Proceed with the updated plan** - it's better for production use:
- Better performance
- Better reliability  
- Less code changes
- Easier to implement

The 5-15 minute sync delay is acceptable because divisions and zones don't change frequently.

