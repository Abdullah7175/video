-- ============================================================================
-- Video Archiving Database Cleanup Script
-- ============================================================================
-- Purpose: Remove all E-Filing related tables from Video Archiving database
-- 
-- This script will:
-- 1. Drop all efiling_* tables (E-Filing specific)
-- 2. Drop all ce_* tables (E-Filing CE users)
-- 3. Remove FK constraints that reference E-Filing tables
-- 4. Keep divisions and efiling_zones as read-only copies (will be synced from E-Filing)
-- 5. Keep all Video Archiving tables (work_requests, videos, images, etc.)
-- 6. Keep all shared tables (users, agents, districts, towns, etc.)
--
-- IMPORTANT:
-- 1. Backup your database before running this script
-- 2. Run this during a maintenance window
-- 3. Test in a development environment first
-- 4. Verify data integrity after cleanup
-- 5. This script can be run on your current database or video_archiving database
-- ============================================================================

-- ============================================================================
-- PART 1: DROP ALL E-FILING TABLES
-- ============================================================================

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

-- ============================================================================
-- PART 2: REMOVE FOREIGN KEY CONSTRAINTS
-- ============================================================================
-- Remove FK constraints that reference E-Filing tables or that need to be
-- removed for independence (divisions/zones will be synced, not FK linked)
-- ============================================================================

-- Remove FK constraint from divisions.department_id
-- (divisions table will be kept as read-only copy, synced from E-Filing)
ALTER TABLE public.divisions DROP CONSTRAINT IF EXISTS divisions_department_id_fkey;

-- Remove FK constraints from Video Archiving tables that reference divisions
-- (We'll keep divisions table but remove FK for independence)
ALTER TABLE public.work_requests DROP CONSTRAINT IF EXISTS work_requests_division_id_fkey;
ALTER TABLE public.videos DROP CONSTRAINT IF EXISTS videos_division_id_fkey;
ALTER TABLE public.images DROP CONSTRAINT IF EXISTS images_division_id_fkey;
ALTER TABLE public.before_content DROP CONSTRAINT IF EXISTS before_content_division_id_fkey;
ALTER TABLE public.final_videos DROP CONSTRAINT IF EXISTS final_videos_division_id_fkey;
ALTER TABLE public.agents DROP CONSTRAINT IF EXISTS agents_division_id_fkey;
ALTER TABLE public.complaint_types DROP CONSTRAINT IF EXISTS complaint_types_division_id_fkey;
ALTER TABLE public.complaint_type_divisions DROP CONSTRAINT IF EXISTS complaint_type_divisions_division_id_fkey;

-- Remove FK constraints from Video Archiving tables that reference efiling_zones
-- (We'll keep efiling_zones table but remove FK for independence)
ALTER TABLE public.work_requests DROP CONSTRAINT IF EXISTS work_requests_zone_id_fkey;
ALTER TABLE public.videos DROP CONSTRAINT IF EXISTS videos_zone_id_fkey;
ALTER TABLE public.images DROP CONSTRAINT IF EXISTS images_zone_id_fkey;
ALTER TABLE public.before_content DROP CONSTRAINT IF EXISTS before_content_zone_id_fkey;
ALTER TABLE public.final_videos DROP CONSTRAINT IF EXISTS final_videos_zone_id_fkey;

-- Remove FK constraint from complaint_types.efiling_department_id
-- (efiling_departments table has been dropped)
ALTER TABLE public.complaint_types DROP CONSTRAINT IF EXISTS complaint_types_efiling_department_id_fkey;

-- ============================================================================
-- PART 3: CONFIGURE DIVISIONS AND ZONES AS READ-ONLY COPIES
-- ============================================================================
-- Keep divisions and efiling_zones tables as read-only copies.
-- These will be synced from E-Filing database via API.
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
-- PART 4: VERIFICATION QUERIES
-- ============================================================================

-- Check for any remaining efiling_* tables (should be none, except efiling_zones)
SELECT 'Remaining efiling_* tables (should only show efiling_zones)' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'efiling_%'
ORDER BY table_name;

-- Check for any remaining ce_* tables (should be none)
SELECT 'Remaining ce_* tables (should be empty)' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'ce_%'
ORDER BY table_name;

-- Verify Video Archiving core tables exist
SELECT 'Video Archiving Core Tables' as info;
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

-- Verify divisions and efiling_zones still exist (read-only copies)
SELECT 'Divisions and Zones (Read-Only Copies)' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('divisions', 'efiling_zones')
ORDER BY table_name;

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

-- Check divisions and zones data
SELECT 'Divisions and Zones Data' as info;
SELECT 'divisions' as table_name, COUNT(*) as row_count FROM public.divisions
UNION ALL
SELECT 'efiling_zones', COUNT(*) FROM public.efiling_zones
ORDER BY table_name;

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
-- 
-- SUMMARY:
-- ✅ All efiling_* tables dropped (except efiling_zones which is kept as read-only copy)
-- ✅ All ce_* tables dropped
-- ✅ FK constraints removed for independence
-- ✅ Divisions and efiling_zones kept as read-only copies (will be synced from E-Filing)
-- ✅ All Video Archiving tables preserved
-- ✅ All shared tables preserved
-- 
-- NEXT STEPS:
-- 1. Verify all data is intact
-- 2. Set up sync mechanism to sync divisions/zones from E-Filing
-- 3. Update application code to use API for divisions/zones validation (optional)
-- 4. Test Video Archiving system independently
-- 
-- ============================================================================

