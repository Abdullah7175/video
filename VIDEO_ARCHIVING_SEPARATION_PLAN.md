# Video Archiving System Separation Plan (Updated)

## Overview

This document outlines the plan to separate the Video Archiving system from the E-Filing system into independent projects with separate databases, using a database copy approach.

**Target Architecture:**
- **Video Archiving System**: Port 3000 (Internet-facing, standalone)
- **E-Filing System**: Port 5000 (Intranet-only, standalone)
- **Communication**: RESTful APIs on localhost (not exposed to internet)
- **Infrastructure**: VMware with separate VMs for apps, databases, and file storage

---

## Infrastructure Setup

### VMware Architecture

**Server 1: Video Archiving Application Server**
- Runs Video Archiving Next.js app (Port 3000)
- Exposed to internet
- Connects to Video Archiving Database Server
- Connects to File Storage Server

**Server 2: E-Filing Application Server**
- Runs E-Filing Next.js app (Port 5000)
- Intranet only (organization network)
- Connects to E-Filing Database Server
- Connects to File Storage Server

**Server 3: Video Archiving Database Server**
- PostgreSQL database: `video_archiving`
- Contains video archiving tables + shared tables
- Accessible only from Video Archiving App Server (localhost)

**Server 4: E-Filing Database Server**
- PostgreSQL database: `efiling`
- Contains efiling tables + shared tables
- Accessible only from E-Filing App Server (localhost)

**Server 5: File Storage Server**
- Shared file storage (uploads, videos, images)
- Accessible from both app servers via network mount or API
- Path configured via environment variables

### Network Configuration

- **Internal APIs**: All cross-system APIs use `localhost` or internal IPs
- **No External Exposure**: E-Filing APIs never exposed to internet
- **API Authentication**: API keys or JWT tokens for internal communication
- **File Storage**: Network mount or shared storage API

---

## Phase 1: Database Strategy

### 1.1 Database Copy Approach

Instead of creating new databases from scratch, we will:

1. **Backup current database** to a safe location
2. **Create two database copies**:
   - `video_archiving` - Copy of current database
   - `efiling` - Copy of current database
3. **Clean up each database**:
   - In `video_archiving`: Delete all `efiling_*` tables
   - In `efiling`: Delete all video archiving tables
4. **Handle shared tables** (see section 1.2)

### 1.2 Shared Tables Classification

#### Category A: Fully Shared (Duplicated in Both Databases)
These tables are independent and can be duplicated:
- `district` - Districts
- `town` - Towns  
- `subtown` - Subtowns
- `status` - Status values
- `complaint_types` - Complaint types (but see note below)
- `complaint_subtypes` - Complaint subtypes
- `users` - User accounts (separated by system usage)
- `agents` - Agent records (separated by system usage)
- `socialmediaperson` - Social media agents
- `notifications` - Notifications (can be separated)
- `user_actions` - User action logs (can be separated)

#### Category B: E-Filing Managed, Video Archiving Read-Only (API Access)
These tables are **managed by E-Filing** but **used by Video Archiving**:
- **`divisions`** ⚠️ - Managed by E-Filing, has FK to `efiling_departments`
- **`efiling_zones`** ⚠️ - Managed by E-Filing

**Solution for Category B:**
- Keep `divisions` and `efiling_zones` in **E-Filing database only**
- Video Archiving will access these via **internal API calls**
- Remove FK constraints in Video Archiving database
- Create read-only API endpoints in E-Filing for these tables

#### Category C: Video Archiving Specific
- `work_requests` - Main work request table
- `work_request_approvals` - Work request approval records
- `work_request_locations` - Additional locations
- `work_request_soft_approvals` - Soft approval records
- `work_request_subtowns` - Work request subtown associations
- `videos` - Video records
- `images` - Image records
- `before_content` - Before images/videos content
- `final_videos` - Final processed videos
- `request_assign_smagent` - Social media agent assignments
- `request_assign_agent` - Agent assignments
- `work` - Legacy work table

#### Category D: E-Filing Specific
- All `efiling_*` tables (except `efiling_zones` which is Category B)
- `efiling_files` - Has `work_request_id` (external reference, no FK)

#### Category E: Security & Logging (Can be Separated)
- `security_events`
- `security_audit_log`
- `security_config`
- `access_control`
- `rate_limiting`
- `suspicious_activity`
- `public_access_log`
- `secure_files`

### 1.3 Special Handling: Divisions Table

**Problem:**
- `divisions` table has FK to `efiling_departments` (E-Filing managed)
- Video archiving uses `divisions` in:
  - `work_requests.division_id`
  - `videos.division_id`
  - `images.division_id`
  - `before_content.division_id`
  - `final_videos.division_id`
  - `agents.division_id`
  - `complaint_types.division_id`

**Solution:**
1. Keep `divisions` table **only in E-Filing database**
2. Remove FK constraint `divisions.department_id` in Video Archiving (if copied)
3. Video Archiving will:
   - Store `division_id` as integer (no FK constraint)
   - Fetch division data via API: `GET /api/external/divisions`
   - Cache division data locally (optional)
4. E-Filing will expose read-only API: `/api/external/divisions`

### 1.4 Special Handling: E-Filing Zones

**Problem:**
- `efiling_zones` is managed by E-Filing
- Video archiving uses `efiling_zones` in:
  - `work_requests.zone_id`
  - `videos.zone_id`
  - `images.zone_id`
  - `before_content.zone_id`
  - `final_videos.zone_id`

**Solution:**
1. Keep `efiling_zones` table **only in E-Filing database**
2. Video Archiving will:
   - Store `zone_id` as integer (no FK constraint)
   - Fetch zone data via API: `GET /api/external/zones`
3. E-Filing will expose read-only API: `/api/external/zones`

---

## Phase 2: Database Separation SQL Script

### 2.1 Script Overview

The SQL script will:
1. Create database backups
2. Create two new databases from template
3. Copy all data from current database
4. Delete unwanted tables from each database
5. Remove/modify FK constraints for shared tables
6. Update sequences and indexes

### 2.2 Key Operations

**For Video Archiving Database:**
```sql
-- Delete all efiling_* tables (except efiling_zones which we'll handle differently)
DROP TABLE IF EXISTS efiling_files CASCADE;
DROP TABLE IF EXISTS efiling_users CASCADE;
DROP TABLE IF EXISTS efiling_departments CASCADE;
-- ... (all other efiling_* tables)

-- Remove FK constraint from divisions.department_id (if exists)
ALTER TABLE divisions DROP CONSTRAINT IF EXISTS divisions_department_id_fkey;

-- Remove FK constraints from work_requests, videos, images, etc. that reference divisions
-- (We'll access divisions via API instead)
ALTER TABLE work_requests DROP CONSTRAINT IF EXISTS work_requests_division_id_fkey;
ALTER TABLE videos DROP CONSTRAINT IF EXISTS videos_division_id_fkey;
-- ... (similar for other tables)

-- Remove FK constraint from efiling_zones references
-- (We'll access zones via API instead)
ALTER TABLE work_requests DROP CONSTRAINT IF EXISTS work_requests_zone_id_fkey;
ALTER TABLE videos DROP CONSTRAINT IF EXISTS videos_zone_id_fkey;
-- ... (similar for other tables)
```

**For E-Filing Database:**
```sql
-- Delete video archiving tables
DROP TABLE IF EXISTS work_requests CASCADE;
DROP TABLE IF EXISTS work_request_approvals CASCADE;
DROP TABLE IF EXISTS work_request_locations CASCADE;
DROP TABLE IF EXISTS work_request_soft_approvals CASCADE;
DROP TABLE IF EXISTS work_request_subtowns CASCADE;
DROP TABLE IF EXISTS videos CASCADE;
DROP TABLE IF EXISTS images CASCADE;
DROP TABLE IF EXISTS before_content CASCADE;
DROP TABLE IF EXISTS final_videos CASCADE;
DROP TABLE IF EXISTS request_assign_smagent CASCADE;
DROP TABLE IF EXISTS request_assign_agent CASCADE;
DROP TABLE IF EXISTS work CASCADE;

-- Remove FK constraint from efiling_files.work_request_id
ALTER TABLE efiling_files DROP CONSTRAINT IF EXISTS efiling_files_work_request_id_fkey;

-- Keep divisions and efiling_zones (these are managed by E-Filing)
```

---

## Phase 3: Code Separation

### 3.1 Video Archiving Files to Extract

**API Routes:**
- `app/api/videos/**`
- `app/api/requests/**`
- `app/api/images/**`
- `app/api/before-content/**`
- `app/api/final-videos/**`
- `app/api/verify-work-request/**`
- `app/api/agents/**` (if video archiving specific)
- `app/api/socialmediaperson/**`
- `app/api/status/**`
- `app/api/complaint-types/**`
- `app/api/complaints/**`
- `app/api/towns/**`
- `app/api/subtowns/**`
- `app/api/districts/**`
- `app/api/dashboard/**` (video archiving dashboard)
- `app/api/ce/**`
- `app/api/ceo/**`
- `app/api/coo/**`
- `app/api/admin/**` (video archiving admin)

**Frontend Pages:**
- `app/videos/**`
- `app/requests/**`
- `app/images/**`
- `app/before-images/**`
- `app/agent/**`
- `app/smagent/**`
- `app/dashboard/**` (video archiving dashboard)
- `app/ce/**`
- `app/ceo/**`
- `app/coo/**`
- `app/admin/**` (video archiving admin)

**Components:**
- Video/image management components
- Request form components
- Dashboard components (video archiving)

**Libraries:**
- `lib/videoArchivingSecurity.js`
- `lib/publicAccessSecurity.js`
- Geography filters (extract/duplicate, but modify to use API for divisions/zones)

### 3.2 E-Filing Files to Keep

**API Routes:**
- All `app/api/efiling/**` routes
- `app/api/external/**` (new - for video archiving integration)

**Frontend Pages:**
- `app/efiling/**`
- `app/efilinguser/**`

**Components:**
- All efiling-specific components

**Libraries:**
- All efiling-specific libraries
- `lib/efilingGeographicRouting.js`
- `lib/efilingGeographyFilters.js`

### 3.3 Files to Modify

#### E-Filing Files:

1. **`app/api/efiling/files/route.js`**
   - Remove direct `work_requests` table queries
   - Keep `work_request_id` as external reference
   - Validate `work_request_id` via API call to Video Archiving

2. **`app/efilinguser/files/new/page.js`**
   - Replace `/api/requests` with external API: `http://localhost:3000/api/external/work-requests`
   - Update SearchableDropdown to use external API

3. **`app/efilinguser/files/[id]/page.js`**
   - Replace `/api/before-content` with external API: `http://localhost:3000/api/external/work-requests/{id}/before-content`
   - Replace `/api/requests` with external API

4. **`app/efiling/files/[id]/page.js`**
   - Replace `/api/requests` with external API

5. **Create new API routes in E-Filing:**
   - `app/api/external/divisions/route.js` - Read-only divisions API
   - `app/api/external/zones/route.js` - Read-only zones API

#### Video Archiving Files:

1. **Modify all files that query `divisions` or `efiling_zones`:**
   - Replace direct database queries with API calls to E-Filing
   - Create API client library: `lib/efilingApiClient.js`
   - Cache division/zone data (optional, with TTL)

2. **Create new API routes in Video Archiving:**
   - `app/api/external/work-requests/route.js` - List/search work requests
   - `app/api/external/work-requests/[id]/route.js` - Get work request details
   - `app/api/external/work-requests/[id]/before-content/route.js` - Get before content
   - `app/api/external/work-requests/verify/route.js` - Verify work request exists

3. **Update geography filter libraries:**
   - Modify `lib/efilingGeographyFilters.js` (or create new version)
   - Fetch divisions/zones from API instead of database

---

## Phase 4: API Integration Points

### 4.1 Video Archiving → E-Filing APIs

**Base URL:** `http://localhost:5000/api/external` (internal only)

1. **GET /api/external/divisions**
   - List all divisions
   - Query params: `active=true`, `department_id=123`
   - Returns: `{ data: [{ id, name, code, ce_type, department_id, ... }] }`
   - Used in: Work request forms, filters, dropdowns

2. **GET /api/external/divisions/{id}**
   - Get specific division details
   - Returns: `{ id, name, code, ce_type, department_id, ... }`

3. **GET /api/external/zones**
   - List all zones
   - Query params: `active=true`
   - Returns: `{ data: [{ id, name, ce_type, description, ... }] }`
   - Used in: Work request forms, filters

4. **GET /api/external/zones/{id}**
   - Get specific zone details
   - Returns: `{ id, name, ce_type, description, ... }`

**Authentication:**
- API key in environment variable: `EFILING_API_KEY`
- Header: `X-API-Key: <key>`
- Rate limiting: 100 requests/minute per API key

### 4.2 E-Filing → Video Archiving APIs

**Base URL:** `http://localhost:3000/api/external` (internal only)

1. **GET /api/external/work-requests**
   - List/search work requests
   - Query params: `search=term`, `status=1`, `limit=100`, `offset=0`, `scope=efiling`
   - Returns: `{ data: [{ id, address, complaint_type, status, ... }] }`
   - Used in: File creation dropdown

2. **GET /api/external/work-requests/{id}**
   - Get specific work request details
   - Returns: `{ id, address, description, status, dates, ... }`
   - Used in: File detail page

3. **GET /api/external/work-requests/{id}/before-content**
   - Get before content for work request
   - Returns: `{ data: [{ id, link, content_type, description, ... }] }`
   - Used in: File detail page

4. **GET /api/external/work-requests/{id}/videos**
   - Get videos for work request (optional)
   - Returns: `{ data: [{ id, link, description, ... }] }`

5. **GET /api/external/work-requests/{id}/images**
   - Get images for work request (optional)
   - Returns: `{ data: [{ id, link, description, ... }] }`

6. **POST /api/external/work-requests/verify**
   - Verify work request exists
   - Body: `{ work_request_id: 123 }`
   - Returns: `{ exists: true, valid: true, data: {...} }`
   - Used in: File creation/update validation

**Authentication:**
- API key in environment variable: `VIDEO_ARCHIVING_API_KEY`
- Header: `X-API-Key: <key>`
- Rate limiting: 100 requests/minute per API key

### 4.3 API Client Library

Create `lib/efilingApiClient.js` in Video Archiving:

```javascript
const EFILING_API_URL = process.env.EFILING_API_URL || 'http://localhost:5000/api/external';
const EFILING_API_KEY = process.env.EFILING_API_KEY;

export async function getDivisions(filters = {}) {
  const params = new URLSearchParams(filters);
  const response = await fetch(`${EFILING_API_URL}/divisions?${params}`, {
    headers: { 'X-API-Key': EFILING_API_KEY }
  });
  return response.json();
}

export async function getZones(filters = {}) {
  // Similar implementation
}
```

Create `lib/videoArchivingApiClient.js` in E-Filing:

```javascript
const VIDEO_ARCHIVING_API_URL = process.env.VIDEO_ARCHIVING_API_URL || 'http://localhost:3000/api/external';
const VIDEO_ARCHIVING_API_KEY = process.env.VIDEO_ARCHIVING_API_KEY;

export async function getWorkRequests(filters = {}) {
  // Implementation
}

export async function verifyWorkRequest(workRequestId) {
  // Implementation
}
```

---

## Phase 5: Environment Configuration

### 5.1 Video Archiving System (.env)

```env
# Database
DATABASE_URL=postgresql://user:pass@video-archiving-db-server:5432/video_archiving

# Server
PORT=3000
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://your-video-archiving-domain.com

# E-Filing API Integration (Internal)
EFILING_API_URL=http://localhost:5000/api/external
EFILING_API_KEY=your_efiling_api_key_here

# File Storage
FILE_STORAGE_PATH=/mnt/shared-storage/video-archiving
UPLOAD_MAX_SIZE=500MB

# Security
JWT_SECRET=your_jwt_secret
API_RATE_LIMIT=100
ALLOWED_ORIGINS=https://your-video-archiving-domain.com

# NextAuth
NEXTAUTH_URL=http://your-video-archiving-domain.com
NEXTAUTH_SECRET=your_nextauth_secret
```

### 5.2 E-Filing System (.env)

```env
# Database
DATABASE_URL=postgresql://user:pass@efiling-db-server:5432/efiling

# Server
PORT=5000
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://internal-efiling-server:5000

# Video Archiving API Integration (Internal)
VIDEO_ARCHIVING_API_URL=http://localhost:3000/api/external
VIDEO_ARCHIVING_API_KEY=your_video_archiving_api_key_here

# File Storage
FILE_STORAGE_PATH=/mnt/shared-storage/efiling
UPLOAD_MAX_SIZE=500MB

# Security
JWT_SECRET=your_jwt_secret
API_RATE_LIMIT=100
ALLOWED_ORIGINS=http://internal-efiling-server:5000

# NextAuth
NEXTAUTH_URL=http://internal-efiling-server:5000
NEXTAUTH_SECRET=your_nextauth_secret
```

---

## Phase 6: Implementation Steps

### Step 1: Database Preparation
- [ ] Backup current database
- [ ] Create `video_archiving` database copy
- [ ] Create `efiling` database copy
- [ ] Run SQL script to clean up tables
- [ ] Verify data integrity

### Step 2: Database Cleanup
- [ ] Delete efiling tables from video_archiving database
- [ ] Delete video archiving tables from efiling database
- [ ] Remove FK constraints for shared tables
- [ ] Update sequences

### Step 3: API Development
- [ ] Create E-Filing external API routes (divisions, zones)
- [ ] Create Video Archiving external API routes (work-requests)
- [ ] Implement API authentication
- [ ] Add rate limiting
- [ ] Test API endpoints

### Step 4: Code Updates
- [ ] Create API client libraries
- [ ] Update Video Archiving to use API for divisions/zones
- [ ] Update E-Filing to use API for work-requests
- [ ] Update geography filter libraries
- [ ] Test all integrations

### Step 5: File Storage Setup
- [ ] Set up shared file storage server
- [ ] Configure network mounts or API access
- [ ] Update file upload paths
- [ ] Migrate existing files (if needed)

### Step 6: Testing
- [ ] Test Video Archiving standalone
- [ ] Test E-Filing standalone
- [ ] Test API integration
- [ ] Test file storage access
- [ ] Test error handling
- [ ] Performance testing

### Step 7: Deployment
- [ ] Deploy Video Archiving on port 3000 (internet)
- [ ] Deploy E-Filing on port 5000 (intranet)
- [ ] Configure firewall rules
- [ ] Set up monitoring
- [ ] Document API endpoints

---

## Phase 7: Migration Checklist

### Pre-Migration
- [ ] Backup existing database
- [ ] Document all current integrations
- [ ] Test database backup restoration
- [ ] Review all code dependencies
- [ ] Set up VMware infrastructure
- [ ] Configure network settings

### Migration
- [ ] Copy database to create `video_archiving` and `efiling`
- [ ] Run SQL cleanup scripts
- [ ] Verify data integrity
- [ ] Remove FK constraints
- [ ] Create API endpoints
- [ ] Update code to use APIs
- [ ] Test API integration
- [ ] Set up file storage

### Post-Migration
- [ ] Verify both systems work independently
- [ ] Test API integration
- [ ] Monitor error logs
- [ ] Update documentation
- [ ] Train team on new architecture
- [ ] Set up monitoring and alerts

---

## Phase 8: Rollback Plan

If issues occur during migration:

1. **Immediate Rollback:**
   - Restore database from backup
   - Revert code changes
   - Restore original database structure

2. **Partial Rollback:**
   - Keep new databases but don't use them
   - Revert code changes
   - Continue using original database

3. **Data Recovery:**
   - Export data from new databases
   - Import back to original database
   - Verify data integrity

---

## Phase 9: Security Considerations

### API Security
- All internal APIs use API keys
- APIs only accessible from localhost/internal network
- Rate limiting on all API endpoints
- Request logging for audit

### Network Security
- E-Filing server not exposed to internet
- Video Archiving server behind firewall
- Database servers only accessible from app servers
- File storage server secured

### Data Security
- Encrypted connections between servers
- Secure file storage access
- Regular security audits
- Access control on all APIs

---

## Notes

- The SQL script should be run during a maintenance window
- Both systems should be tested thoroughly before going live
- API rate limiting should be configured to prevent abuse
- Monitoring should be set up for both systems
- Documentation should be updated for API endpoints
- File storage should be backed up regularly
- Database backups should be automated
