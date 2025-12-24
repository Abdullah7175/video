# Code Modification Checklist

This document lists all files and code locations that need to be modified for the Video Archiving and E-Filing separation.

---

## 1. E-Filing Files to Modify

### 1.1 API Routes - Remove Direct Database Queries

#### `app/api/efiling/files/route.js`
- **Line 37**: Remove direct `work_requests` table validation
- **Line 520, 727, 738, 757**: Update `work_request_id` handling to use external API validation
- **Action**: Replace database queries with API call to Video Archiving: `POST /api/external/work-requests/verify`

#### `app/api/efiling/files/[id]/route.js`
- **Line 99, 109**: Remove direct `work_requests` table join
- **Line 247-249**: Update `work_request_id` update to validate via API
- **Action**: Replace database queries with API call to Video Archiving: `GET /api/external/work-requests/{id}`

#### `app/api/efiling/files/[id]/history/route.js`
- **Line 92**: Remove direct `work_requests` table reference
- **Action**: Replace with API call or remove if not critical

### 1.2 Frontend Pages - Replace API Calls

#### `app/efilinguser/files/new/page.js`
- **Line 119**: Replace `/api/requests` with `http://localhost:3000/api/external/work-requests`
- **Line 337**: Replace `/api/requests` with external API
- **Action**: 
  - Create API client function: `fetchWorkRequestsFromVideoArchiving()`
  - Update SearchableDropdown to use new API endpoint
  - Handle API errors gracefully

#### `app/efilinguser/files/[id]/page.js`
- **Line 81**: Replace `/api/requests` with external API
- **Line 240**: Replace `/api/before-content` with `http://localhost:3000/api/external/work-requests/{id}/before-content`
- **Action**: 
  - Create API client functions
  - Update error handling for API failures

#### `app/efilinguser/files/[id]/view-document/page.js`
- **Line 128**: Replace `/api/requests` with external API
- **Line 134**: Replace `/api/before-content` with external API
- **Action**: Same as above

#### `app/efiling/files/[id]/page.js` (if exists)
- Replace any `/api/requests` calls with external API
- **Action**: Search for and replace all work request API calls

### 1.3 New API Routes to Create

#### `app/api/external/divisions/route.js` (NEW)
- **Purpose**: Expose read-only divisions API for Video Archiving
- **Endpoints**:
  - `GET /api/external/divisions` - List all divisions
  - `GET /api/external/divisions?active=true` - Filter active divisions
  - `GET /api/external/divisions/{id}` - Get specific division
- **Authentication**: API key required
- **Rate Limiting**: 100 requests/minute

#### `app/api/external/zones/route.js` (NEW)
- **Purpose**: Expose read-only zones API for Video Archiving
- **Endpoints**:
  - `GET /api/external/zones` - List all zones
  - `GET /api/external/zones?active=true` - Filter active zones
  - `GET /api/external/zones/{id}` - Get specific zone
- **Authentication**: API key required
- **Rate Limiting**: 100 requests/minute

### 1.4 Libraries to Create

#### `lib/videoArchivingApiClient.js` (NEW)
- **Purpose**: API client for Video Archiving system
- **Functions**:
  - `getWorkRequests(filters)` - Fetch work requests
  - `getWorkRequestById(id)` - Get specific work request
  - `getWorkRequestBeforeContent(id)` - Get before content
  - `verifyWorkRequest(id)` - Verify work request exists
- **Configuration**: Use `VIDEO_ARCHIVING_API_URL` and `VIDEO_ARCHIVING_API_KEY` from env

---

## 2. Video Archiving Files to Modify

### 2.1 API Routes - Replace Direct Database Queries

#### Files that query `divisions` table:
- `app/api/requests/route.js` - Replace divisions queries with API calls
- `app/api/videos/route.js` - Replace divisions queries with API calls
- `app/api/images/route.js` - Replace divisions queries with API calls
- `app/api/before-content/route.js` - Replace divisions queries with API calls
- `app/api/final-videos/route.js` - Replace divisions queries with API calls
- `app/api/agents/route.js` - Replace divisions queries with API calls
- `app/api/complaint-types/route.js` - Replace divisions queries with API calls
- `app/api/dashboard/**` - Replace divisions queries with API calls

#### Files that query `efiling_zones` table:
- `app/api/requests/route.js` - Replace zones queries with API calls
- `app/api/videos/route.js` - Replace zones queries with API calls
- `app/api/images/route.js` - Replace zones queries with API calls
- `app/api/before-content/route.js` - Replace zones queries with API calls
- `app/api/final-videos/route.js` - Replace zones queries with API calls
- `app/api/dashboard/**` - Replace zones queries with API calls

**Action for all above files:**
- Replace `SELECT * FROM divisions` with API call: `getDivisionsFromEfiling()`
- Replace `SELECT * FROM efiling_zones` with API call: `getZonesFromEfiling()`
- Add error handling for API failures
- Consider caching division/zone data (optional, with TTL)

### 2.2 New API Routes to Create

#### `app/api/external/work-requests/route.js` (NEW)
- **Purpose**: Expose work requests API for E-Filing
- **Endpoints**:
  - `GET /api/external/work-requests` - List/search work requests
    - Query params: `search`, `status`, `limit`, `offset`, `scope=efiling`
  - `GET /api/external/work-requests/{id}` - Get specific work request
  - `GET /api/external/work-requests/{id}/before-content` - Get before content
  - `GET /api/external/work-requests/{id}/videos` - Get videos (optional)
  - `GET /api/external/work-requests/{id}/images` - Get images (optional)
  - `POST /api/external/work-requests/verify` - Verify work request exists
- **Authentication**: API key required
- **Rate Limiting**: 100 requests/minute
- **Security**: Only return data if `scope=efiling` is provided

### 2.3 Libraries to Modify

#### `lib/efilingGeographyFilters.js` (MODIFY)
- **Current**: Queries `divisions` and `efiling_zones` directly from database
- **Action**: 
  - Replace database queries with API calls to E-Filing
  - Add caching layer (optional)
  - Update `resolveEfilingScope()` function
  - Update `appendGeographyFilters()` function

#### `lib/efilingGeographicRouting.js` (MODIFY)
- **Current**: May query divisions/zones directly
- **Action**: Replace with API calls if needed

### 2.4 Libraries to Create

#### `lib/efilingApiClient.js` (NEW)
- **Purpose**: API client for E-Filing system
- **Functions**:
  - `getDivisions(filters)` - Fetch divisions from E-Filing
  - `getDivisionById(id)` - Get specific division
  - `getZones(filters)` - Fetch zones from E-Filing
  - `getZoneById(id)` - Get specific zone
- **Configuration**: Use `EFILING_API_URL` and `EFILING_API_KEY` from env
- **Caching**: Optional - cache divisions/zones with TTL (e.g., 5 minutes)

---

## 3. Shared Components to Modify

### 3.1 SearchableDropdown Component

#### `components/SearchableDropdown.jsx`
- **Current**: May use `/api/requests` endpoint
- **Action**: 
  - Add prop to specify API endpoint
  - Support both internal and external APIs
  - Update error handling

---

## 4. Database Schema Changes

### 4.1 Video Archiving Database

**Tables to Remove:**
- All `efiling_*` tables (except handled via API)
- `divisions` table (access via API)
- `efiling_zones` table (access via API)

**FK Constraints to Remove:**
- `work_requests.division_id` → `divisions.id`
- `work_requests.zone_id` → `efiling_zones.id`
- `videos.division_id` → `divisions.id`
- `videos.zone_id` → `efiling_zones.id`
- `images.division_id` → `divisions.id`
- `images.zone_id` → `efiling_zones.id`
- `before_content.division_id` → `divisions.id`
- `before_content.zone_id` → `efiling_zones.id`
- `final_videos.division_id` → `divisions.id`
- `final_videos.zone_id` → `efiling_zones.id`
- `agents.division_id` → `divisions.id`
- `complaint_types.division_id` → `divisions.id`

**Columns to Keep:**
- Keep `division_id` and `zone_id` columns (as integers, no FK)
- Add comments explaining they're external references

### 4.2 E-Filing Database

**Tables to Remove:**
- All video archiving tables (work_requests, videos, images, etc.)

**FK Constraints to Remove:**
- `efiling_files.work_request_id` → `work_requests.id`

**Tables to Keep:**
- `divisions` (managed by E-Filing)
- `efiling_zones` (managed by E-Filing)

---

## 5. Environment Variables

### 5.1 Video Archiving (.env)

```env
# E-Filing API Integration
EFILING_API_URL=http://localhost:5000/api/external
EFILING_API_KEY=your_efiling_api_key_here

# File Storage
FILE_STORAGE_PATH=/mnt/shared-storage/video-archiving
```

### 5.2 E-Filing (.env)

```env
# Video Archiving API Integration
VIDEO_ARCHIVING_API_URL=http://localhost:3000/api/external
VIDEO_ARCHIVING_API_KEY=your_video_archiving_api_key_here

# File Storage
FILE_STORAGE_PATH=/mnt/shared-storage/efiling
```

---

## 6. Testing Checklist

### 6.1 API Integration Tests

- [ ] Test E-Filing → Video Archiving API (work requests)
- [ ] Test Video Archiving → E-Filing API (divisions)
- [ ] Test Video Archiving → E-Filing API (zones)
- [ ] Test API authentication
- [ ] Test API rate limiting
- [ ] Test API error handling

### 6.2 Functionality Tests

- [ ] Test work request creation in Video Archiving
- [ ] Test file creation with work_request_id in E-Filing
- [ ] Test file viewing with linked work request
- [ ] Test division/zone filtering in Video Archiving
- [ ] Test before content display in E-Filing
- [ ] Test API failures and fallbacks

### 6.3 Performance Tests

- [ ] Test API response times
- [ ] Test caching effectiveness (if implemented)
- [ ] Test concurrent API requests
- [ ] Test database query performance after FK removal

---

## 7. Migration Order

1. **Database Migration**
   - Backup current database
   - Create database copies
   - Run SQL cleanup scripts
   - Verify data integrity

2. **API Development**
   - Create E-Filing external APIs (divisions, zones)
   - Create Video Archiving external APIs (work-requests)
   - Test APIs independently

3. **Code Updates**
   - Create API client libraries
   - Update Video Archiving to use API for divisions/zones
   - Update E-Filing to use API for work-requests
   - Update geography filter libraries

4. **Testing**
   - Test each system independently
   - Test API integration
   - Test end-to-end workflows

5. **Deployment**
   - Deploy Video Archiving (port 3000)
   - Deploy E-Filing (port 5000)
   - Configure network and firewall
   - Monitor and verify

---

## 8. Risk Areas

### 8.1 High Risk

- **Divisions/Zones API dependency**: Video Archiving depends on E-Filing API for divisions/zones
  - **Mitigation**: Implement caching, handle API failures gracefully, consider fallback

- **Work Request validation**: E-Filing needs to validate work_request_id
  - **Mitigation**: Implement verify endpoint, cache valid IDs, handle offline scenarios

### 8.2 Medium Risk

- **Performance**: API calls may be slower than direct database queries
  - **Mitigation**: Implement caching, optimize API endpoints, use connection pooling

- **Data consistency**: Divisions/zones may change in E-Filing
  - **Mitigation**: Implement cache invalidation, versioning, or webhooks

### 8.3 Low Risk

- **Code complexity**: More API calls may complicate code
  - **Mitigation**: Use API client libraries, abstract complexity

---

## Notes

- All API endpoints should include proper error handling
- All API endpoints should include rate limiting
- All API endpoints should include authentication
- All API endpoints should include logging for audit
- Consider implementing API response caching where appropriate
- Monitor API performance and adjust as needed

