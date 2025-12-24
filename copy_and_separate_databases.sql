-- ============================================================================
-- Database Copy and Separation Script
-- ============================================================================
-- This script copies the current database to create two separate databases:
-- 1. video_archiving - Contains video archiving tables + shared tables
-- 2. efiling - Contains efiling tables + shared tables
--
-- IMPORTANT: 
-- 1. Backup your database before running this script
-- 2. Run this during a maintenance window
-- 3. Test in a development environment first
-- 4. Verify data integrity after migration
-- 5. Replace 'your_current_database' with your actual database name
-- ============================================================================

-- ============================================================================
-- PART 1: BACKUP CURRENT DATABASE
-- ============================================================================
-- Run this command outside of psql:
-- pg_dump -h localhost -U postgres -d your_current_database -F c -f backup_$(date +%Y%m%d_%H%M%S).dump

-- ============================================================================
-- PART 2: CREATE DATABASE COPIES
-- ============================================================================

-- Connect to postgres database to create new databases
\c postgres

-- Create video_archiving database (copy from current database)
-- Method 1: Using pg_dump and pg_restore (Recommended)
-- Run these commands outside of psql:
-- pg_dump -h localhost -U postgres -d your_current_database | psql -h localhost -U postgres -d video_archiving

-- Method 2: Using CREATE DATABASE with template (if current database is template)
-- CREATE DATABASE video_archiving WITH TEMPLATE your_current_database;

-- Create efiling database (copy from current database)
-- pg_dump -h localhost -U postgres -d your_current_database | psql -h localhost -U postgres -d efiling

-- ============================================================================
-- PART 3: CLEAN UP VIDEO ARCHIVING DATABASE
-- ============================================================================

\c video_archiving

-- Drop all E-Filing specific tables
-- Note: CASCADE will automatically drop dependent objects (indexes, constraints, etc.)

-- E-Filing core tables
DROP TABLE IF EXISTS public.efiling_files CASCADE;
DROP TABLE IF EXISTS public.efiling_users CASCADE;
DROP TABLE IF EXISTS public.efiling_departments CASCADE;
DROP TABLE IF EXISTS public.efiling_roles CASCADE;
DROP TABLE IF EXISTS public.efiling_role_groups CASCADE;
DROP TABLE IF EXISTS public.efiling_role_group_members CASCADE;
DROP TABLE IF EXISTS public.efiling_role_locations CASCADE;
DROP TABLE IF EXISTS public.efiling_role_group_locations CASCADE;
DROP TABLE IF EXISTS public.efiling_file_categories CASCADE;
DROP TABLE IF EXISTS public.efiling_file_types CASCADE;
DROP TABLE IF EXISTS public.efiling_file_status CASCADE;
DROP TABLE IF EXISTS public.efiling_file_attachments CASCADE;
DROP TABLE IF EXISTS public.efiling_file_movements CASCADE;
DROP TABLE IF EXISTS public.efiling_file_workflow_states CASCADE;
DROP TABLE IF EXISTS public.efiling_file_page_additions CASCADE;
DROP TABLE IF EXISTS public.efiling_document_pages CASCADE;
DROP TABLE IF EXISTS public.efiling_document_comments CASCADE;
DROP TABLE IF EXISTS public.efiling_document_signatures CASCADE;
DROP TABLE IF EXISTS public.efiling_documents CASCADE;
DROP TABLE IF EXISTS public.efiling_comments CASCADE;
DROP TABLE IF EXISTS public.efiling_notifications CASCADE;
DROP TABLE IF EXISTS public.efiling_signatures CASCADE;
DROP TABLE IF EXISTS public.efiling_sla_matrix CASCADE;
DROP TABLE IF EXISTS public.efiling_sla_policies CASCADE;
DROP TABLE IF EXISTS public.efiling_sla_pause_history CASCADE;
DROP TABLE IF EXISTS public.efiling_templates CASCADE;
DROP TABLE IF EXISTS public.efiling_template_departments CASCADE;
DROP TABLE IF EXISTS public.efiling_template_roles CASCADE;
DROP TABLE IF EXISTS public.efiling_permissions CASCADE;
DROP TABLE IF EXISTS public.efiling_role_permissions CASCADE;
DROP TABLE IF EXISTS public.efiling_permission_audit_log CASCADE;
DROP TABLE IF EXISTS public.efiling_user_actions CASCADE;
DROP TABLE IF EXISTS public.efiling_user_signatures CASCADE;
DROP TABLE IF EXISTS public.efiling_user_teams CASCADE;
DROP TABLE IF EXISTS public.efiling_user_tools CASCADE;
DROP TABLE IF EXISTS public.efiling_daak CASCADE;
DROP TABLE IF EXISTS public.efiling_daak_categories CASCADE;
DROP TABLE IF EXISTS public.efiling_daak_recipients CASCADE;
DROP TABLE IF EXISTS public.efiling_daak_acknowledgments CASCADE;
DROP TABLE IF EXISTS public.efiling_daak_attachments CASCADE;
DROP TABLE IF EXISTS public.efiling_meetings CASCADE;
DROP TABLE IF EXISTS public.efiling_meeting_attendees CASCADE;
DROP TABLE IF EXISTS public.efiling_meeting_external_attendees CASCADE;
DROP TABLE IF EXISTS public.efiling_meeting_attachments CASCADE;
DROP TABLE IF EXISTS public.efiling_meeting_reminders CASCADE;
DROP TABLE IF EXISTS public.efiling_meeting_settings CASCADE;
DROP TABLE IF EXISTS public.efiling_otp_codes CASCADE;
DROP TABLE IF EXISTS public.efiling_tools CASCADE;
DROP TABLE IF EXISTS public.efiling_department_locations CASCADE;
DROP TABLE IF EXISTS public.efiling_zone_locations CASCADE;

-- CE Users (E-Filing specific)
DROP TABLE IF EXISTS public.ce_users CASCADE;
DROP TABLE IF EXISTS public.ce_user_districts CASCADE;
DROP TABLE IF EXISTS public.ce_user_towns CASCADE;
DROP TABLE IF EXISTS public.ce_user_zones CASCADE;
DROP TABLE IF EXISTS public.ce_user_divisions CASCADE;
DROP TABLE IF EXISTS public.ce_user_departments CASCADE;

-- Remove FK constraint from divisions.department_id
-- (divisions will be accessed via API, not direct FK)
ALTER TABLE public.divisions DROP CONSTRAINT IF EXISTS divisions_department_id_fkey;

-- Remove FK constraints that reference divisions (we'll access via API)
ALTER TABLE public.work_requests DROP CONSTRAINT IF EXISTS work_requests_division_id_fkey;
ALTER TABLE public.videos DROP CONSTRAINT IF EXISTS videos_division_id_fkey;
ALTER TABLE public.images DROP CONSTRAINT IF EXISTS images_division_id_fkey;
ALTER TABLE public.before_content DROP CONSTRAINT IF EXISTS before_content_division_id_fkey;
ALTER TABLE public.final_videos DROP CONSTRAINT IF EXISTS final_videos_division_id_fkey;
ALTER TABLE public.agents DROP CONSTRAINT IF EXISTS agents_division_id_fkey;
ALTER TABLE public.complaint_types DROP CONSTRAINT IF EXISTS complaint_types_division_id_fkey;
ALTER TABLE public.complaint_type_divisions DROP CONSTRAINT IF EXISTS complaint_type_divisions_division_id_fkey;

-- Remove FK constraints that reference efiling_zones (we'll access via API)
ALTER TABLE public.work_requests DROP CONSTRAINT IF EXISTS work_requests_zone_id_fkey;
ALTER TABLE public.videos DROP CONSTRAINT IF EXISTS videos_zone_id_fkey;
ALTER TABLE public.images DROP CONSTRAINT IF EXISTS images_zone_id_fkey;
ALTER TABLE public.before_content DROP CONSTRAINT IF EXISTS before_content_zone_id_fkey;
ALTER TABLE public.final_videos DROP CONSTRAINT IF EXISTS final_videos_zone_id_fkey;

-- Remove FK constraint from complaint_types.efiling_department_id
ALTER TABLE public.complaint_types DROP CONSTRAINT IF EXISTS complaint_types_efiling_department_id_fkey;

-- ============================================================================
-- IMPORTANT: Keep divisions and efiling_zones tables as READ-ONLY copies
-- ============================================================================
-- These tables will be synced from E-Filing database via API.
-- We keep them locally for performance (fast queries) and resilience
-- (Video Archiving works even if E-Filing API is temporarily down).
-- 
-- DO NOT DROP these tables - they are needed for local queries.
-- ============================================================================

-- Add sync metadata columns to track when data was last synced (optional)
ALTER TABLE public.divisions ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP;
ALTER TABLE public.efiling_zones ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP;

-- Add table comments to document they are read-only copies
COMMENT ON TABLE public.divisions IS 
    'Read-only copy of divisions table. Synced from E-Filing database via API. Do not modify directly. Master copy is in efiling database.';
COMMENT ON TABLE public.efiling_zones IS 
    'Read-only copy of efiling_zones table. Synced from E-Filing database via API. Do not modify directly. Master copy is in efiling database.';

-- Add column comments to document the change
COMMENT ON COLUMN public.work_requests.division_id IS 
    'Reference to division. Data synced from E-Filing database. FK constraint removed for independence.';
COMMENT ON COLUMN public.work_requests.zone_id IS 
    'Reference to zone. Data synced from E-Filing database. FK constraint removed for independence.';
COMMENT ON COLUMN public.videos.division_id IS 
    'Reference to division. Data synced from E-Filing database. FK constraint removed for independence.';
COMMENT ON COLUMN public.videos.zone_id IS 
    'Reference to zone. Data synced from E-Filing database. FK constraint removed for independence.';
COMMENT ON COLUMN public.images.division_id IS 
    'Reference to division. Data synced from E-Filing database. FK constraint removed for independence.';
COMMENT ON COLUMN public.images.zone_id IS 
    'Reference to zone. Data synced from E-Filing database. FK constraint removed for independence.';
COMMENT ON COLUMN public.before_content.division_id IS 
    'Reference to division. Data synced from E-Filing database. FK constraint removed for independence.';
COMMENT ON COLUMN public.before_content.zone_id IS 
    'Reference to zone. Data synced from E-Filing database. FK constraint removed for independence.';
COMMENT ON COLUMN public.final_videos.division_id IS 
    'Reference to division. Data synced from E-Filing database. FK constraint removed for independence.';
COMMENT ON COLUMN public.final_videos.zone_id IS 
    'Reference to zone. Data synced from E-Filing database. FK constraint removed for independence.';
COMMENT ON COLUMN public.agents.division_id IS 
    'Reference to division. Data synced from E-Filing database. FK constraint removed for independence.';
COMMENT ON COLUMN public.complaint_types.division_id IS 
    'Reference to division. Data synced from E-Filing database. FK constraint removed for independence.';

-- ============================================================================
-- PART 4: CLEAN UP EFILING DATABASE
-- ============================================================================
-- IMPORTANT: We are cleaning up the E-FILING database here.
-- We drop Video Archiving tables because:
-- 1. E-Filing doesn't need these tables (they belong to Video Archiving)
-- 2. E-Filing only stores work_request_id as external reference (no FK)
-- 3. E-Filing will access work request data via API from Video Archiving
-- ============================================================================

\c efiling

-- Drop all Video Archiving specific tables
-- These tables belong to Video Archiving system, not E-Filing
-- E-Filing will access work request data via API: http://localhost:3000/api/external/work-requests
DROP TABLE IF EXISTS public.work_requests CASCADE;
DROP TABLE IF EXISTS public.work_request_approvals CASCADE;
DROP TABLE IF EXISTS public.work_request_locations CASCADE;
DROP TABLE IF EXISTS public.work_request_soft_approvals CASCADE;
DROP TABLE IF EXISTS public.work_request_subtowns CASCADE;
DROP TABLE IF EXISTS public.videos CASCADE;
DROP TABLE IF EXISTS public.images CASCADE;
DROP TABLE IF EXISTS public.before_content CASCADE;
DROP TABLE IF EXISTS public.final_videos CASCADE;
DROP TABLE IF EXISTS public.request_assign_smagent CASCADE;
DROP TABLE IF EXISTS public.request_assign_agent CASCADE;
DROP TABLE IF EXISTS public.work CASCADE;
DROP TABLE IF EXISTS public.main CASCADE;

-- ============================================================================
-- NOTE: After dropping work_requests table, efiling_files.work_request_id
-- becomes an external reference (no FK constraint). E-Filing will:
-- 1. Store work_request_id as integer (no FK)
-- 2. Validate work_request_id via API: POST /api/external/work-requests/verify
-- 3. Fetch work request data via API: GET /api/external/work-requests/{id}
-- ============================================================================

-- Remove FK constraint from efiling_files.work_request_id
-- (work_request_id will be external reference, validated via API)
ALTER TABLE public.efiling_files DROP CONSTRAINT IF EXISTS efiling_files_work_request_id_fkey;

-- Add comment to document the change
COMMENT ON COLUMN public.efiling_files.work_request_id IS 
    'External reference to work_request in video_archiving database. Validated via API call to Video Archiving system.';

-- Keep divisions and efiling_zones (these are managed by E-Filing)
-- These tables remain in the E-Filing database and will be exposed via API

-- ============================================================================
-- PART 5: VERIFICATION QUERIES
-- ============================================================================

-- Verify Video Archiving Database
\c video_archiving

SELECT 'Video Archiving Database - Remaining Tables' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check for any remaining efiling_* tables (should be none)
SELECT 'Remaining efiling_* tables (should be empty)' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'efiling_%'
ORDER BY table_name;

-- Check video archiving core tables exist
SELECT 'Video Archiving Core Tables' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'work_requests', 'videos', 'images', 'before_content', 
    'final_videos', 'work_request_approvals', 'work_request_locations',
    'work_request_soft_approvals', 'work_request_subtowns',
    'request_assign_agent', 'request_assign_smagent'
  )
ORDER BY table_name;

-- Verify E-Filing Database
\c efiling

SELECT 'E-Filing Database - Remaining Tables' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check for any remaining video archiving tables (should be none)
SELECT 'Remaining video archiving tables (should be empty)' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'work_requests', 'videos', 'images', 'before_content', 
    'final_videos', 'work_request_approvals', 'work_request_locations',
    'work_request_soft_approvals', 'work_request_subtowns',
    'request_assign_agent', 'request_assign_smagent', 'work'
  )
ORDER BY table_name;

-- Check efiling core tables exist
SELECT 'E-Filing Core Tables' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'efiling_%'
ORDER BY table_name;

-- Verify divisions and efiling_zones exist in E-Filing database (master copies)
SELECT 'Divisions and Zones in E-Filing Database (Master Copies)' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('divisions', 'efiling_zones')
ORDER BY table_name;

-- Verify divisions and efiling_zones exist in Video Archiving database (read-only copies)
\c video_archiving
SELECT 'Divisions and Zones in Video Archiving Database (Read-Only Copies)' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('divisions', 'efiling_zones')
ORDER BY table_name;

-- ============================================================================
-- PART 6: DATA INTEGRITY CHECKS
-- ============================================================================

\c video_archiving

-- Count records in video archiving tables
SELECT 'Video Archiving - Record Counts' as info;
SELECT 'work_requests' as table_name, COUNT(*) as row_count FROM public.work_requests
UNION ALL
SELECT 'videos', COUNT(*) FROM public.videos
UNION ALL
SELECT 'images', COUNT(*) FROM public.images
UNION ALL
SELECT 'before_content', COUNT(*) FROM public.before_content
UNION ALL
SELECT 'final_videos', COUNT(*) FROM public.final_videos
UNION ALL
SELECT 'work_request_approvals', COUNT(*) FROM public.work_request_approvals
UNION ALL
SELECT 'work_request_locations', COUNT(*) FROM public.work_request_locations
UNION ALL
SELECT 'work_request_soft_approvals', COUNT(*) FROM public.work_request_soft_approvals
UNION ALL
SELECT 'work_request_subtowns', COUNT(*) FROM public.work_request_subtowns
UNION ALL
SELECT 'request_assign_agent', COUNT(*) FROM public.request_assign_agent
UNION ALL
SELECT 'request_assign_smagent', COUNT(*) FROM public.request_assign_smagent
ORDER BY table_name;

-- Check for orphaned division_id references (these will be validated via API)
SELECT 'Work requests with division_id (will be validated via API)' as info;
SELECT COUNT(*) as total, 
       COUNT(DISTINCT division_id) as unique_divisions,
       COUNT(CASE WHEN division_id IS NOT NULL THEN 1 END) as with_division
FROM public.work_requests;

-- Check for orphaned zone_id references (these will be validated via API)
SELECT 'Work requests with zone_id (will be validated via API)' as info;
SELECT COUNT(*) as total, 
       COUNT(DISTINCT zone_id) as unique_zones,
       COUNT(CASE WHEN zone_id IS NOT NULL THEN 1 END) as with_zone
FROM public.work_requests;

\c efiling

-- Count records in efiling tables
SELECT 'E-Filing - Record Counts' as info;
SELECT 'efiling_files' as table_name, COUNT(*) as row_count FROM public.efiling_files
UNION ALL
SELECT 'efiling_users', COUNT(*) FROM public.efiling_users
UNION ALL
SELECT 'efiling_departments', COUNT(*) FROM public.efiling_departments
UNION ALL
SELECT 'efiling_roles', COUNT(*) FROM public.efiling_roles
UNION ALL
SELECT 'divisions', COUNT(*) FROM public.divisions
UNION ALL
SELECT 'efiling_zones', COUNT(*) FROM public.efiling_zones
ORDER BY table_name;

-- Check efiling_files with work_request_id (external references)
SELECT 'E-Filing files with work_request_id (external references)' as info;
SELECT COUNT(*) as total_files,
       COUNT(CASE WHEN work_request_id IS NOT NULL THEN 1 END) as with_work_request
FROM public.efiling_files;

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
-- 
-- NEXT STEPS:
-- 1. Verify all data migrated correctly
-- 2. Create API endpoints in E-Filing for divisions and zones
-- 3. Create API endpoints in Video Archiving for work-requests
-- 4. Update application code to use external APIs
-- 5. Test both systems independently
-- 6. Deploy video archiving on port 3000 (internet)
-- 7. Deploy E-Filing on port 5000 (intranet)
-- 
-- ============================================================================

