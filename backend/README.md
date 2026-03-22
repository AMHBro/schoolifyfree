# SMS Backend

This is the backend service for the School Management System built with Elysia and Prisma.

## Features

- Teacher management and authentication
- Student and stage management
- Subject and exam handling
- Backup/restore functionality
- Mobile authentication endpoints

## Setup

1. Install dependencies: `bun install`
2. Set up database: Copy `.env.example` to `.env` and configure your database URL
3. Generate Prisma client: `bun run db:generate`
4. Run migrations: `bun run db:migrate`
5. Start the server: `bun run dev`

## Production Deployment

This app is configured for Railway deployment using Bun runtime.

1. Push to main branch
2. Connect to Railway
3. Set environment variables
4. Deploy

## API Documentation

Available at `/swagger` endpoint when running.

## Mobile Authentication

See `MOBILE_AUTH_API.md` for detailed mobile authentication endpoints documentation.

<!-- Last updated: 2025-01-26 23:52 GMT - Force Railway deployment -->
# Force deployment to run seed
