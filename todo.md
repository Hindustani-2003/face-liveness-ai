# Face Liveness Detection - Project TODO

## Backend API & Database
- [x] Extend database schema with users table (name, dob, department, email, password_hash, face_image_url)
- [x] Add faceImages table to store face embeddings and URLs for matching
- [x] Create registration API endpoint (POST /api/trpc/auth.register)
- [x] Create face upload endpoint (POST /api/trpc/auth.uploadFaceImage)
- [x] Create face matching endpoint (POST /api/trpc/auth.matchFace)
- [x] Create user profile endpoint (GET /api/trpc/auth.getProfile)
- [x] Implement password hashing and validation
- [x] Add face embedding extraction and storage logic

## Frontend - Home Page
- [x] Build dark-themed home page with hero section
- [x] Add "Register Now" CTA button
- [x] Add "Login with Face" CTA button
- [x] Implement navigation to registration and login pages
- [x] Add feature highlights section (liveness detection, anti-spoofing, etc.)

## Frontend - Registration Page
- [x] Build registration form with fields: name, DOB, department, email, password
- [x] Add form validation and error handling
- [x] Implement camera capture component with viewfinder overlay
- [x] Add face capture button and preview
- [x] Implement face image upload to storage
- [x] Add submit button to register user
- [x] Add success/error notifications

## Frontend - Login Page
- [x] Build login page with camera activation
- [x] Integrate face-api.js for real-time face detection
- [x] Implement blink detection (eye open/close) for liveness verification
- [x] Add real-time face detection UI with progress indicator
- [x] Implement face matching against stored images
- [x] Add "Invalid User" alert message box
- [x] Add success navigation to profile page

## Frontend - Profile Page
- [x] Build profile page displaying user details (name, DOB, department, email)
- [x] Add logout button
- [x] Add navigation back to home

## UI & Styling
- [x] Configure dark theme with dark background and accent colors
- [x] Add camera viewfinder overlay styling
- [x] Add loading states and spinners
- [x] Add success/error toast notifications
- [x] Ensure responsive design

## Face Detection Integration
- [x] Create face detection utility module with blink detection state machine
- [x] Implement eye aspect ratio (EAR) calculation
- [x] Add face descriptor extraction
- [x] Implement Euclidean distance calculation for face matching
- [x] Create best match finder with threshold
- [x] Integrate improved blink detection in Login page

## Testing & Deployment
- [x] Test end-to-end registration flow
- [x] Test end-to-end login with face matching
- [x] Test blink detection liveness verification
- [x] Test invalid user scenario
- [x] Deploy and verify all features
