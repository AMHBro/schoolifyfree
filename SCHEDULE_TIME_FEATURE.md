# Schedule Start/End Time Feature

## Overview
This feature adds the ability to specify start and end times for each subject in the stage schedule. The implementation is production-safe and preserves all existing data.

## What Was Changed

### 1. Database Schema
- **File**: `backend/prisma/schema.prisma`
- **Changes**: Added two optional fields to the `Schedule` model:
  - `startTime String?` - Time in HH:mm format (e.g., "08:00")
  - `endTime String?` - Time in HH:mm format (e.g., "09:00")

### 2. Database Migration
- **File**: `backend/prisma/migrations/20251101110043_add_schedule_times/migration.sql`
- **Changes**: Adds two nullable columns to the `schedules` table
- **Safety**: This migration is production-safe because:
  - Columns are nullable (optional)
  - No data is deleted or modified
  - Existing schedules will continue to work without times
  - You can gradually add times to schedules as needed

### 3. Backend API
- **File**: `backend/index.ts`
- **Changes**:
  - Updated `POST /api/schedules` to accept `startTime` and `endTime`
  - Updated `PUT /api/schedules/:id` to accept `startTime` and `endTime`
  - Updated `GET /api/schedules` and `GET /api/schedules/stage/:stageId` to return these fields

### 4. Frontend TypeScript Types
- **File**: `src/types/api.ts`
- **Changes**:
  - Added `startTime?: string | null` to `Schedule` interface
  - Added `endTime?: string | null` to `Schedule` interface
  - Updated `CreateScheduleRequest` to include optional time fields
  - Updated `UpdateScheduleRequest` to include optional time fields

### 5. Schedule Component
- **File**: `src/views/stages/StageSchedule.tsx`
- **Changes**:
  - Added `TimePicker` component from Ant Design
  - Added time picker inputs in the schedule modal
  - Updated schedule cells to display time ranges when available
  - Times are shown in format: "08:00 - 09:00" below the teacher name

## How to Apply the Migration

### Option 1: Using Prisma Migrate (Recommended)
If you have access to the production database:

```bash
cd backend
npx prisma migrate deploy
```

### Option 2: Manual SQL Execution
If you need to run the SQL manually on your production database:

```sql
-- Add optional startTime and endTime columns to schedules table
ALTER TABLE "schedules" ADD COLUMN "startTime" TEXT;
ALTER TABLE "schedules" ADD COLUMN "endTime" TEXT;
```

### Option 3: Railway/Cloud Platform
If your database is on Railway or another cloud platform:

1. Access your database console
2. Run the SQL from the migration file
3. Or, if you have a deployment pipeline, the migration will run automatically on next deploy

## Verification Steps

After applying the migration:

1. Check that the migration was applied:
```bash
cd backend
npx prisma migrate status
```

2. Regenerate Prisma client (if not already done):
```bash
cd backend
npx prisma generate
```

3. Restart your backend server

4. Test the feature:
   - Navigate to any stage schedule in the dashboard
   - Click on a time slot
   - You should see two new time picker fields: "Start Time" and "End Time"
   - Add times and save
   - The schedule cell should now display the time range

## User Experience

### Before Adding Times
- Schedule cells show only subject name and teacher name
- Works exactly as before

### After Adding Times
- Schedule cells display:
  - Subject name (bold)
  - Teacher name (secondary)
  - Time range (e.g., "08:00 - 09:00") in smaller text

### UI Features
- Time pickers use 24-hour format (HH:mm)
- Times are optional - you can leave them empty
- Existing schedules without times continue to work
- Times are displayed in the schedule grid when available

## Backwards Compatibility

✅ **Fully backwards compatible**
- Existing schedules work without modification
- Old API calls without time fields still work
- Database migration is additive only
- No breaking changes

## Future Enhancements

Potential improvements you might want to add:

1. **Validation**: Ensure end time is after start time
2. **Auto-fill**: Suggest times based on time slot number
3. **Bulk Update**: Set times for all time slots at once
4. **Duration Display**: Show class duration
5. **Conflict Detection**: Warn if teacher has overlapping schedules

## Rollback (If Needed)

If you need to rollback the migration:

```sql
-- Remove the columns (this will delete all time data)
ALTER TABLE "schedules" DROP COLUMN "startTime";
ALTER TABLE "schedules" DROP COLUMN "endTime";
```

**Note**: Rollback will delete all stored time information. Only do this if necessary.

## Support

The migration is production-safe and has been tested to ensure:
- No data loss
- No disruption to existing functionality
- Optional adoption (can add times gradually)
- Clean rollback path if needed

