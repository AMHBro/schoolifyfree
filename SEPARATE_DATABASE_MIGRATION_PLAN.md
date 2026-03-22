# Separate Database Migration Plan

## Overview

Migrate from shared database architecture to separate databases per school for complete data isolation.

## Benefits

- ✅ **Complete Data Isolation**: Zero risk of cross-school data leakage
- ✅ **Enhanced Security**: Breach isolation between schools
- ✅ **Performance Independence**: One school's load doesn't affect others
- ✅ **Compliance Ready**: Better for educational data privacy regulations
- ✅ **Customization**: Each school can have unique schema modifications

## Current Architecture vs Target Architecture

### Current: Shared Database

```
┌─────────────────────────────────────┐
│           Single Database           │
├─────────────────────────────────────┤
│ School A data (schoolId filter)     │
│ School B data (schoolId filter)     │
│ School C data (schoolId filter)     │
└─────────────────────────────────────┘
         ↑ Risk of data leakage
```

### Target: Separate Databases

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  School A   │  │  School B   │  │  School C   │
│  Database   │  │  Database   │  │  Database   │
└─────────────┘  └─────────────┘  └─────────────┘
    ↑ Complete isolation
```

## Migration Strategy

### Phase 1: Setup Infrastructure (1-2 days)

1. **Create separate databases**

   ```bash
   # Example for PostgreSQL
   createdb sms_school_default
   createdb sms_school_testing
   createdb sms_school_test
   ```

2. **Update connection configuration**
   - Dynamic database connection based on school
   - Connection pooling per school
   - Environment variable configuration

### Phase 2: Update Application Code (2-3 days)

1. **Prisma Configuration Updates**

   - Multiple database URLs
   - Dynamic Prisma client instantiation
   - Schema deployment per database

2. **Authentication Updates**

   - Include database identifier in JWT
   - Route requests to correct database
   - Update middleware for database switching

3. **API Endpoint Updates**
   - Remove schoolId filtering (no longer needed)
   - Update error handling for database selection
   - Add database health checks

### Phase 3: Data Migration (1 day)

1. **Export school-specific data**
2. **Import to respective databases**
3. **Validate data integrity**
4. **Remove cross-school references**

### Phase 4: Testing & Deployment (1-2 days)

1. **End-to-end testing**
2. **Performance testing**
3. **Security validation**
4. **Gradual rollout**

## Implementation Details

### 1. Database Connection Configuration

```typescript
// backend/src/database.ts
interface DatabaseConfig {
  [schoolId: string]: {
    url: string;
    name: string;
  };
}

const DATABASE_CONFIGS: DatabaseConfig = {
  "00000000-0000-0000-0000-000000000001": {
    url: process.env.DATABASE_URL_SCHOOL_DEFAULT!,
    name: "default_school",
  },
  "1edfafb8-df70-461e-bfa5-102e83f2263b": {
    url: process.env.DATABASE_URL_SCHOOL_TESTING!,
    name: "testing_school",
  },
  "e6feba80-9e04-4b0a-bf69-056eb0d87100": {
    url: process.env.DATABASE_URL_SCHOOL_TEST!,
    name: "test_school",
  },
};

export function getPrismaClient(schoolId: string) {
  const config = DATABASE_CONFIGS[schoolId];
  if (!config) {
    throw new Error(`No database configuration for school: ${schoolId}`);
  }

  return new PrismaClient({
    datasources: {
      db: { url: config.url },
    },
  });
}
```

### 2. Updated Authentication Middleware

```typescript
const verifyTeacherAuth = async (headers: any, jwt: any) => {
  try {
    const token = headers.authorization?.replace("Bearer ", "");
    if (!token) throw new Error("No token provided");

    const payload = await jwt.verify(token);
    if (!payload.teacherId || !payload.schoolId) {
      throw new Error("Invalid token structure");
    }

    // Get Prisma client for this school's database
    const prisma = getPrismaClient(payload.schoolId);

    // Fetch teacher data (no schoolId filtering needed!)
    const teacher = await prisma.teacher.findUnique({
      where: { id: payload.teacherId },
      include: {
        stages: {
          include: {
            stage: {
              include: {
                students: true,
              },
            },
          },
        },
        subjects: {
          include: {
            subject: true,
          },
        },
      },
    });

    return teacher;
  } catch (error) {
    throw new Error("Authentication failed");
  }
};
```

### 3. Environment Variables

```bash
# .env
# Central database for school management
DATABASE_URL_CENTRAL="postgresql://user:pass@localhost:5432/sms_central"

# School-specific databases
DATABASE_URL_SCHOOL_DEFAULT="postgresql://user:pass@localhost:5432/sms_school_default"
DATABASE_URL_SCHOOL_TESTING="postgresql://user:pass@localhost:5432/sms_school_testing"
DATABASE_URL_SCHOOL_TEST="postgresql://user:pass@localhost:5432/sms_school_test"
```

## Migration Script Example

```typescript
// scripts/migrate-to-separate-databases.ts
async function migrateSchoolData(schoolId: string, targetDbUrl: string) {
  const sourcePrisma = new PrismaClient(); // Current shared DB
  const targetPrisma = new PrismaClient({
    datasources: { db: { url: targetDbUrl } },
  });

  try {
    // 1. Deploy schema to target database
    console.log(`Deploying schema for school ${schoolId}...`);
    // Run: npx prisma db push --schema=./prisma/schema.prisma

    // 2. Export data from source
    const schoolData = await sourcePrisma.school.findUnique({
      where: { id: schoolId },
      include: {
        teachers: {
          include: {
            stages: { include: { stage: true } },
            subjects: { include: { subject: true } },
          },
        },
        students: { include: { stage: true } },
        stages: { include: { subjects: true } },
        subjects: true,
        schedules: true,
        exams: true,
      },
    });

    // 3. Import to target database
    console.log(`Importing data for school ${schoolId}...`);
    await targetPrisma.school.create({
      data: {
        // ... school data without schoolId references
      },
    });

    console.log(`✅ Migration completed for school ${schoolId}`);
  } catch (error) {
    console.error(`❌ Migration failed for school ${schoolId}:`, error);
  } finally {
    await sourcePrisma.$disconnect();
    await targetPrisma.$disconnect();
  }
}
```

## Deployment Considerations

### Development Environment

- Use separate local databases or Docker containers
- Update docker-compose.yml for multiple database services

### Production Environment

- Use separate database instances/schemas
- Consider cloud database services (AWS RDS, Google Cloud SQL)
- Implement proper backup strategies per school
- Set up monitoring per database

### Central Management Database

Keep a lightweight central database for:

- School registration and authentication
- Central dashboard functionality
- Cross-school analytics (if needed)
- Billing and subscription management

## Cost Considerations

### Shared Database (Current)

- ✅ Lower infrastructure costs
- ❌ High risk of data breaches
- ❌ Compliance issues
- ❌ Performance bottlenecks

### Separate Databases (Proposed)

- ❌ Higher infrastructure costs (~3x database hosting)
- ✅ Zero data breach risk between schools
- ✅ Compliance ready
- ✅ Independent performance
- ✅ Better for school-specific customizations

## Recommendation

**For educational institutions, the security and compliance benefits of separate databases outweigh the cost considerations.** This is especially important given:

1. **FERPA Compliance** (US educational data privacy)
2. **GDPR Requirements** (EU data protection)
3. **School district policies** requiring data isolation
4. **Liability reduction** in case of security incidents

## Timeline

- **Week 1**: Infrastructure setup + Code changes
- **Week 2**: Data migration + Testing
- **Week 3**: Deployment + Validation

**Total Effort**: 2-3 weeks for complete migration
