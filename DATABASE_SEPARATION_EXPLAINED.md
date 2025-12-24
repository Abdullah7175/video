# Database Separation Explained

## Current State (Before Separation)

```
┌─────────────────────────────────────────┐
│     SINGLE DATABASE (Current)          │
├─────────────────────────────────────────┤
│                                         │
│  Video Archiving Tables:               │
│  • work_requests                       │
│  • videos                               │
│  • images                               │
│  • before_content                       │
│  • ... (all video archiving tables)     │
│                                         │
│  E-Filing Tables:                      │
│  • efiling_files                        │
│  • efiling_users                        │
│  • efiling_departments                  │
│  • ... (all efiling tables)             │
│                                         │
│  Shared Tables:                         │
│  • divisions                            │
│  • efiling_zones                        │
│  • users, agents, districts, etc.       │
│                                         │
└─────────────────────────────────────────┘
```

## After Separation

### Video Archiving Database
```
┌─────────────────────────────────────────┐
│   VIDEO ARCHIVING DATABASE              │
├─────────────────────────────────────────┤
│                                         │
│  Video Archiving Tables:               │
│  ✅ work_requests                       │
│  ✅ videos                               │
│  ✅ images                               │
│  ✅ before_content                       │
│  ✅ ... (all video archiving tables)     │
│                                         │
│  Read-Only Copies (Synced from E-Filing):│
│  ✅ divisions (read-only, synced)         │
│  ✅ efiling_zones (read-only, synced)    │
│                                         │
│  Shared Tables:                         │
│  ✅ users, agents, districts, etc.       │
│                                         │
│  ❌ NO efiling_* tables (except zones)   │
│                                         │
└─────────────────────────────────────────┘
```

### E-Filing Database
```
┌─────────────────────────────────────────┐
│      E-FILING DATABASE                  │
├─────────────────────────────────────────┤
│                                         │
│  E-Filing Tables:                       │
│  ✅ efiling_files                        │
│  ✅ efiling_users                        │
│  ✅ efiling_departments                  │
│  ✅ ... (all efiling tables)             │
│                                         │
│  Master Copies (Managed by E-Filing):   │
│  ✅ divisions (master copy)              │
│  ✅ efiling_zones (master copy)          │
│                                         │
│  Shared Tables:                         │
│  ✅ users, agents, districts, etc.       │
│                                         │
│  ❌ NO video archiving tables            │
│     (work_requests, videos, etc.)       │
│                                         │
└─────────────────────────────────────────┘
```

## Why Drop Video Archiving Tables from E-Filing?

### ❌ Question: "Why drop work_requests from E-Filing database?"

### ✅ Answer: Because E-Filing doesn't need the table!

**E-Filing's relationship with work_requests:**

1. **E-Filing only stores the ID:**
   ```sql
   -- efiling_files table
   work_request_id INT  -- Just stores the ID, no FK constraint
   ```

2. **E-Filing doesn't query work_requests table directly:**
   - It doesn't JOIN with work_requests
   - It doesn't need work request data in its database
   - It only needs to display work request info in UI

3. **E-Filing will fetch data via API:**
   ```javascript
   // Instead of: SELECT * FROM work_requests WHERE id = ?
   // E-Filing will do:
   const response = await fetch('http://localhost:3000/api/external/work-requests/123');
   const workRequest = await response.json();
   ```

## Data Flow After Separation

### When E-Filing needs work request data:

```
┌──────────────┐                    ┌──────────────────────┐
│   E-Filing   │                    │  Video Archiving     │
│   System     │                    │     System           │
│              │                    │                      │
│  efiling_    │  API Call          │  work_requests       │
│  files       │ ──────────────────>│  table              │
│  (stores ID) │                    │                      │
│              │ <──────────────────│  Returns data        │
│              │  JSON Response     │                      │
└──────────────┘                    └──────────────────────┘
```

### When Video Archiving needs division/zone data:

```
┌──────────────┐                    ┌──────────────────────┐
│   Video      │                    │      E-Filing        │
│  Archiving   │                    │      System          │
│   System     │                    │                      │
│              │                    │  divisions           │
│  Local copy  │  Sync Job          │  (master copy)       │
│  (synced)    │ <───────────────────│                      │
│              │  Every 5-15 min    │  efiling_zones       │
│              │                    │  (master copy)       │
└──────────────┘                    └──────────────────────┘
```

## Summary

| Aspect | Video Archiving DB | E-Filing DB |
|--------|-------------------|-------------|
| **Has work_requests table?** | ✅ YES (master) | ❌ NO (access via API) |
| **Has efiling_files table?** | ❌ NO | ✅ YES (master) |
| **Has divisions table?** | ✅ YES (read-only copy, synced) | ✅ YES (master copy) |
| **Has efiling_zones table?** | ✅ YES (read-only copy, synced) | ✅ YES (master copy) |

## Key Points

1. ✅ **Each system keeps its own tables** (work_requests in Video Archiving, efiling_files in E-Filing)
2. ✅ **Shared data accessed via API** (work_requests from Video Archiving API, divisions/zones synced from E-Filing)
3. ✅ **No FK constraints** between systems (for independence)
4. ✅ **Systems work independently** (can function even if other system is down temporarily)

## Why This Approach?

- **Independence**: Each system can be deployed/updated independently
- **Performance**: Local queries are fast (no API calls for every query)
- **Resilience**: Systems work even if API is temporarily down
- **Scalability**: Each system scales independently
- **Security**: E-Filing not exposed to internet, Video Archiving is

