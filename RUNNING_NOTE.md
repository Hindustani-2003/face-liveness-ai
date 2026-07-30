# Quick Running Reference: Face Liveness Detection

This is a cheat-sheet to get the website running locally, either natively or via Docker.

---

## Option A: Running the Whole Project via Docker (Recommended)

We have provided a [Dockerfile](file:///d:/PROJECTS/My_Project/face_liveness_detection/Dockerfile) and [docker-compose.yml](file:///d:/PROJECTS/My_Project/face_liveness_detection/docker-compose.yml) to start both the application and database together in isolated containers.

```bash
# 1. Build and start the services
docker compose up --build

# 2. Access the site
# Open http://localhost:3000
```

*Note: The Docker Compose setup automatically spins up a MySQL container, runs the database migrations, and exposes the app on port 3000.*

---

## Option B: Native Setup (Local Node & Database)

### Commands
```bash
# 1. Install dependencies
pnpm install

# 2. Database setup (ensure local MySQL is running)
pnpm db:push

# 3. Start development server
pnpm run dev
```

### Local Configuration
Ensure `.env.local` exists in the root directory:
```env
DATABASE_URL=mysql://root:root@localhost:3306/face_liveness
JWT_SECRET=your_jwt_secret_here_at_least_32_chars
VITE_APP_TITLE=FaceLiveness AI
```

---

## Running & Test Flow
1. **Access Website**: Go to [http://localhost:3000](http://localhost:3000).
2. **Register**: Go to `/register`, fill in the form, and capture your face photo.
3. **Login**: Go to `/login`, start your camera, and **blink twice** to trigger the liveness check and authenticate.

