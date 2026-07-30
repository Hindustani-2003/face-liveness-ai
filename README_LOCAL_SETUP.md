# Face Liveness Detection - Local Setup Guide

## Overview
This is a full-stack face liveness detection website built with React, Express, tRPC, and MySQL. It allows users to register with face capture and login using real-time face recognition with blink-based liveness detection.

## System Requirements
- Node.js 18+ (https://nodejs.org/)
- pnpm package manager (https://pnpm.io/)
- MySQL 8.0+ (https://www.mysql.com/downloads/mysql/)
- Webcam/Camera for face capture

## Installation Steps

### 1. Extract the Project
```bash
unzip face_liveness_detection.zip
cd face_liveness_detection
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Setup MySQL Database

#### Option A: Using Docker (Recommended)
```bash
docker run --name face_liveness_db \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=face_liveness \
  -p 3306:3306 \
  -d mysql:8.0
```

#### Option B: Manual MySQL Setup
1. Create a new database:
```sql
CREATE DATABASE face_liveness;
```

2. Create a user (optional):
```sql
CREATE USER 'face_user'@'localhost' IDENTIFIED BY 'password123';
GRANT ALL PRIVILEGES ON face_liveness.* TO 'face_user'@'localhost';
FLUSH PRIVILEGES;
```

### 4. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# Database Configuration
DATABASE_URL=mysql://root:root@localhost:3306/face_liveness

# JWT Secret (generate a random string)
JWT_SECRET=your_random_jwt_secret_key_here_min_32_chars

# OAuth Configuration (optional - for Manus OAuth)
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# Owner Configuration
OWNER_OPEN_ID=owner_id
OWNER_NAME=Owner Name

# Storage Configuration (optional - for S3)
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your_api_key
VITE_FRONTEND_FORGE_API_KEY=your_frontend_api_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im

# Analytics (optional)
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
VITE_ANALYTICS_WEBSITE_ID=your_website_id

# App Configuration
VITE_APP_TITLE=FaceLiveness AI
VITE_APP_LOGO=https://example.com/logo.png
```

### 5. Setup Database Schema

Run the database migrations:
```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

Or manually execute the migration SQL:
```bash
mysql -u root -p face_liveness < drizzle/migrations/0001_abnormal_tusk.sql
```

### 6. Start the Development Server

```bash
pnpm run dev
```

The application will be available at: **http://localhost:3000**

## Project Structure

```
face_liveness_detection/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── pages/         # Page components (Home, Register, Login, Profile)
│   │   ├── components/    # Reusable UI components
│   │   ├── lib/           # Utilities (face detection, tRPC client)
│   │   └── index.css      # Global styles with dark theme
│   └── public/            # Static assets
├── server/                 # Backend Express server
│   ├── routers.ts         # tRPC procedure definitions
│   ├── db.ts              # Database query helpers
│   ├── auth.ts            # Authentication utilities
│   ├── storage.ts         # S3 storage helpers
│   └── _core/             # Framework core (OAuth, context, etc.)
├── drizzle/               # Database schema and migrations
│   ├── schema.ts          # Table definitions
│   └── migrations/        # SQL migration files
├── shared/                # Shared types and constants
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite build configuration
```

## Features

### Home Page
- Hero section with feature highlights
- "Register Now" and "Login with Face" CTA buttons
- Dark futuristic UI with gradient backgrounds

### Registration Flow
1. Fill in user details (name, email, password, DOB, department)
2. Capture face photo via webcam
3. Face embedding extraction (automatic)
4. User data and face image stored in database
5. Redirect to login page

### Login Flow
1. Activate webcam
2. Real-time face detection using face-api.js
3. Blink detection for liveness verification (2+ blinks required)
4. Face matching against stored user images
5. If match found → navigate to profile page
6. If no match → display "Invalid User" alert

### Profile Page
- Display user details (name, email, DOB, department)
- Logout button
- Navigation back to home

## Key Technologies

- **Frontend**: React 19, Tailwind CSS 4, shadcn/ui
- **Backend**: Express 4, tRPC 11, Node.js
- **Database**: MySQL with Drizzle ORM
- **Face Detection**: face-api.js (TensorFlow.js based)
- **Authentication**: JWT-based sessions
- **Storage**: S3 compatible storage for face images
- **Build Tool**: Vite
- **Package Manager**: pnpm

## API Endpoints

All API calls go through tRPC at `/api/trpc`

### Authentication Procedures
- `auth.register` - Register new user with face
- `auth.me` - Get current user info
- `auth.logout` - Logout user

### Face Recognition Procedures
- `auth.getAllUsers` - Get all users with face images
- `auth.verifyFaceMatch` - Match captured face against database

## Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
**Solution**: Ensure MySQL is running and DATABASE_URL is correct

### Camera Access Denied
**Solution**: Check browser permissions for camera access. Allow camera access in browser settings.

### Face Detection Models Not Loading
**Solution**: Ensure internet connection is available. Models are loaded from CDN on first use.

### Port 3000 Already in Use
**Solution**: Change port in `server/_core/index.ts` or kill the process using port 3000

## Development Commands

```bash
# Start development server
pnpm run dev

# Build for production
pnpm run build

# Start production server
pnpm start

# Run tests
pnpm test

# Type check
pnpm check

# Format code
pnpm format

# Generate database migrations
pnpm drizzle-kit generate

# Run database migrations
pnpm drizzle-kit migrate
```

## Production Deployment

### Build for Production
```bash
pnpm run build
```

### Environment Variables for Production
Set all environment variables in your hosting platform's configuration.

### Database Backup
```bash
mysqldump -u root -p face_liveness > backup.sql
```

### Restore from Backup
```bash
mysql -u root -p face_liveness < backup.sql
```

## Security Considerations

1. **JWT Secret**: Use a strong, random secret (min 32 characters)
2. **Database**: Use strong passwords for MySQL users
3. **HTTPS**: Always use HTTPS in production
4. **CORS**: Configure CORS properly for your domain
5. **Face Data**: Face images and embeddings are stored securely in S3
6. **Passwords**: Passwords are hashed using bcrypt

## Performance Tips

1. **Face Detection**: First detection takes 3-4 seconds (models loading). Subsequent detections are faster.
2. **Database Indexing**: Email and userId are indexed for fast lookups
3. **Image Compression**: Face images are compressed to JPEG at 95% quality
4. **Caching**: Face-api.js models are cached in browser

## Support & Documentation

- Face-api.js: https://github.com/justadudewhohacks/face-api.js
- Drizzle ORM: https://orm.drizzle.team/
- tRPC: https://trpc.io/
- Tailwind CSS: https://tailwindcss.com/

## License

This project is provided as-is for educational and development purposes.

---

**Last Updated**: July 14, 2026
**Version**: 1.0.0
