# Quick Start Guide - Face Liveness Detection

## 5-Minute Setup

### Prerequisites
- Node.js 18+ installed
- MySQL 8.0+ running
- pnpm installed (`npm install -g pnpm`)

### Step 1: Extract & Install (2 minutes)
```bash
unzip face_liveness_detection.zip
cd face_liveness_detection
pnpm install
```

### Step 2: Setup Database (1 minute)
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE face_liveness;"

# Or with Docker (if you have Docker installed)
docker run --name face_liveness_db -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=face_liveness -p 3306:3306 -d mysql:8.0
```

### Step 3: Configure Environment (1 minute)
Create `.env.local` file in project root with:
```
DATABASE_URL=mysql://root:root@localhost:3306/face_liveness
JWT_SECRET=your_random_secret_key_here_min_32_chars_long
VITE_APP_TITLE=FaceLiveness AI
VITE_APP_LOGO=https://example.com/logo.png
```

### Step 4: Run Database Migrations (1 minute)
```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

### Step 5: Start the Server
```bash
pnpm run dev
```

**🎉 Done!** Open http://localhost:3000 in your browser

---

## Testing the Application

### Test Registration
1. Click "Register Now"
2. Fill in the form:
   - Name: John Doe
   - Email: john@example.com
   - Password: password123
   - DOB: 01/15/1990
   - Department: Engineering
3. Click "Next: Capture Face"
4. Click "Start Camera"
5. Click "Capture Photo" to capture your face
6. Click "Complete Registration"

### Test Login
1. Click "Login with Face"
2. Click "Start Camera"
3. Blink 2+ times (liveness detection)
4. System will match your face and log you in
5. You'll see your profile page

---

## Troubleshooting Quick Fixes

| Issue | Solution |
|-------|----------|
| `ECONNREFUSED 127.0.0.1:3306` | Start MySQL: `mysql.server start` or `service mysql start` |
| Port 3000 in use | Kill process: `lsof -i :3000` then `kill -9 <PID>` |
| Camera not working | Allow camera in browser settings, restart browser |
| Models not loading | Check internet connection, refresh page |
| Database error | Verify DATABASE_URL in .env.local |

---

## File Structure Quick Reference

```
face_liveness_detection/
├── client/src/pages/
│   ├── Home.tsx           ← Landing page
│   ├── Register.tsx       ← Registration with face capture
│   ├── Login.tsx          ← Face recognition login
│   └── Profile.tsx        ← User profile after login
├── server/
│   ├── routers.ts         ← API endpoints
│   ├── db.ts              ← Database queries
│   └── auth.ts            ← Password hashing
├── drizzle/
│   └── schema.ts          ← Database tables
└── .env.local             ← Your configuration
```

---

## Key Features

✅ **Face Registration** - Capture face photo during signup
✅ **Real-time Face Detection** - Uses face-api.js + TensorFlow.js
✅ **Blink Detection** - Liveness verification (prevents spoofing)
✅ **Face Matching** - Compares captured face with stored images
✅ **Secure Authentication** - JWT + bcrypt password hashing
✅ **Dark UI** - Futuristic theme with cyan/purple accents
✅ **Responsive Design** - Works on desktop and mobile

---

## Next Steps

After getting it running locally:

1. **Customize Branding**
   - Edit `VITE_APP_TITLE` in `.env.local`
   - Update logo in `client/public/`

2. **Configure Storage**
   - Setup S3 bucket for face images
   - Add AWS credentials to `.env.local`

3. **Deploy to Production**
   - Build: `pnpm run build`
   - Deploy to your server/cloud platform

4. **Add Features**
   - Email verification
   - Password recovery
   - Admin dashboard
   - User analytics

---

## Support

For issues or questions:
1. Check the main README.md for detailed documentation
2. Review troubleshooting section
3. Check browser console for error messages
4. Verify all environment variables are set correctly

---

**Happy coding! 🚀**
