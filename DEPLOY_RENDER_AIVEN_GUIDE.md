# Deployment Guide: Render + Aiven (100% Free & No Card Required)

This guide walks you through deploying your **FaceLiveness AI** application completely for free, **without requiring any credit/debit card verification**.

### 🌟 Why this works perfectly:
1. **No Card Required**: Both platforms allow signups using only your email/GitHub account.
2. **Automatic HTTPS**: Render provides a free `https://*.onrender.com` subdomain, meaning your webcam face-login features will work out-of-the-box.

---

## Step 1: Create a Free MySQL Database on Aiven

1. Go to [Aiven Console](https://console.aiven.io/signup) and sign up for a free account.
2. Click **Create Service**.
3. Select **MySQL** as your service type.
4. Under **Service Plan**, choose the **Free Tier** ($0/month).
5. Choose a cloud provider region close to you (e.g., AWS Mumbai / Singapore).
6. Click **Create Service**.
7. Once the database status changes to **Running**, copy your **Service URI** (connection string). It will look like this:
   ```text
   mysql://avnadmin:password@host:port/defaultdb?ssl-mode=REQUIRED
   ```

---

## Step 2: Push your Code to GitHub

Render deploys directly from a GitHub repository.

1. Create a repository on [GitHub](https://github.com/) (public or private).
2. Push your project code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for deployment"
   git remote add origin <YOUR_GITHUB_REPO_URL>
   git branch -M main
   git push -u origin main
   ```

---

## Step 3: Deploy Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/) and sign up.
2. Click **New +** &rarr; **Web Service**.
3. Connect your GitHub account and select your **face_liveness_detection** repository.
4. Configure the Web Service settings:
   * **Name**: `face-liveness-ai` (or any custom name)
   * **Region**: Select the region closest to your database (e.g., Singapore).
   * **Branch**: `main`
   * **Runtime**: `Node`
   * **Build Command**: `pnpm install && pnpm run build`
   * **Start Command**: `pnpm run start`
   * **Instance Type**: Select **Free** ($0/month).

---

## Step 4: Configure Environment Variables on Render

In the Render configuration dashboard, click the **Environment** tab and add the following keys:

| Key | Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | *Paste your Aiven Service URI* | The MySQL connection string |
| `JWT_SECRET` | *Generate a random 32+ character string* | Security key for signing tokens |
| `NODE_ENV` | `production` | Enforces production optimizations |
| `VITE_APP_TITLE` | `FaceLiveness AI` | Web app title |

Click **Save Changes**. Render will automatically start building and deploying your project!

---

## Step 5: Verify & Access the Site

Once the build logs say `Publishing...` followed by `Live`, your website will be online at the URL provided at the top of the Render dashboard:

`https://face-liveness-ai.onrender.com`

*Open this URL on your mobile phone or laptop browser, register, and test the face-liveness login!*
