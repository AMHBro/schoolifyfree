# Teacher App Troubleshooting Guide

## Issue: Teacher App Shows Nothing

If the teacher mobile app shows no data (empty screens) even though there are stages and subjects in the school dashboard, follow this troubleshooting guide.

## Quick Diagnosis

### Step 1: Check Teacher Assignments

```bash
cd backend
bun check-teacher-assignments.ts
```

This will show you if teachers are properly assigned to stages and subjects.

### Step 2: Test Teacher Login and Data

```bash
# Update credentials in the script first
node test-teacher-data-visibility.js
```

## Common Causes & Solutions

### ❌ Cause 1: Teacher Not Assigned to Stages/Subjects

**Problem**: Teacher was created but not assigned to any stages or subjects.

**Solution**:

1. Go to school dashboard: `http://localhost:5174`
2. Login as school admin
3. Navigate to **Teachers** section
4. Edit the teacher
5. Assign the teacher to:
   - At least one **Stage** (to see students)
   - At least one **Subject** (to see class content)
6. Save the changes

**Auto-fix** (assigns to first available stage/subject):

```bash
cd backend
bun check-teacher-assignments.ts --fix
```

### ❌ Cause 2: Teacher Authentication Issues

**Problem**: Teacher can't login or token is invalid.

**Diagnosis**:

```bash
node test-teacher-data-visibility.js
```

**Solutions**:

- Verify teacher credentials are correct
- Check backend server is running
- Ensure teacher exists in database

### ❌ Cause 3: Multi-Tenancy Data Isolation

**Problem**: Teacher sees data from wrong school or no data due to filtering issues.

**Check**: The authentication should only return data from teacher's own school.

**Verify**:

- Teacher's `schoolId` matches the school they were created in
- Teacher only sees students from their school
- Teacher only sees stages/subjects from their school

### ❌ Cause 4: Database Relationship Issues

**Problem**: Teacher-Stage or Teacher-Subject relationships are broken.

**Check**:

```sql
-- Check TeacherStage relationships
SELECT ts.*, t.name as teacher_name, s.name as stage_name
FROM teacher_stages ts
JOIN teachers t ON ts.teacherId = t.id
JOIN stages s ON ts.stageId = s.id;

-- Check TeacherSubject relationships
SELECT ts.*, t.name as teacher_name, s.name as subject_name
FROM teacher_subjects ts
JOIN teachers t ON ts.teacherId = t.id
JOIN subjects s ON ts.subjectId = s.id;
```

## Verification Steps

### 1. Backend Health Check

```bash
curl http://localhost:3000/hello
# Should return: {"message":"Hello from Elysia!","timestamp":"..."}
```

### 2. Teacher Login Test

```bash
curl -X POST "http://localhost:3000/api/mobile/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"TEACHER_PHONE","password":"TEACHER_PASSWORD"}'
```

### 3. Check Teacher Data Structure

The response should include:

```json
{
  "success": true,
  "data": {
    "teacher": {
      "id": "uuid",
      "name": "Teacher Name",
      "stages": [
        {
          "id": "stage-uuid",
          "name": "Stage 1",
          "students": [...]
        }
      ],
      "subjects": [
        {
          "id": "subject-uuid",
          "name": "Mathematics"
        }
      ]
    }
  }
}
```

## Expected Teacher Data Flow

1. **Teacher Login** → Backend validates credentials
2. **Fetch Teacher Data** → Include assigned stages and subjects only
3. **Filter by School** → Only show data from teacher's school
4. **Return to App** → Teacher sees their assigned classes and students

## Manual Database Fix

If auto-fix doesn't work, manually assign teachers:

```sql
-- Find teacher and available stages/subjects
SELECT t.id as teacher_id, t.name, t.schoolId
FROM teachers t
WHERE t.phoneNumber = 'TEACHER_PHONE';

SELECT s.id as stage_id, s.name
FROM stages s
WHERE s.schoolId = 'TEACHER_SCHOOL_ID';

SELECT s.id as subject_id, s.name
FROM subjects s
WHERE s.schoolId = 'TEACHER_SCHOOL_ID';

-- Assign teacher to stage
INSERT INTO teacher_stages (teacherId, stageId)
VALUES ('TEACHER_ID', 'STAGE_ID');

-- Assign teacher to subject
INSERT INTO teacher_subjects (teacherId, subjectId)
VALUES ('TEACHER_ID', 'SUBJECT_ID');
```

## Prevention

### When Creating Teachers:

1. ✅ Always assign to at least one stage
2. ✅ Always assign to at least one subject
3. ✅ Verify assignments are saved
4. ✅ Test teacher login after creation

### Regular Maintenance:

1. Run assignment check monthly: `bun check-teacher-assignments.ts`
2. Monitor teacher login success rates
3. Verify new teachers can access the app

## Debug Mode

Enable detailed logging in the backend to see what data is being returned:

```typescript
// Add to backend/index.ts after teacher fetch
console.log("Teacher data:", JSON.stringify(teacher, null, 2));
```

## Support Checklist

When reporting issues, include:

- [ ] Output of `bun check-teacher-assignments.ts`
- [ ] Teacher phone number and school name
- [ ] Backend server logs
- [ ] Teacher app error messages (if any)
- [ ] Results of manual login test

## Related Files

- `backend/index.ts` - Teacher authentication and data fetching
- `backend/check-teacher-assignments.ts` - Assignment checker script
- `test-teacher-data-visibility.js` - Data visibility test
- `MULTI_TENANCY_FIX_SUMMARY.md` - Multi-tenancy implementation details

---

**Remember**: Teachers need both stage AND subject assignments to see full functionality in the app. Missing either will cause empty screens or limited functionality.
