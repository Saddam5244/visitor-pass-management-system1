# Deployment Guide — PassPulse Visitor Pass Management System

## 🌐 Live Deployed Environments

| Service | Environment | URL |
| :--- | :--- | :--- |
| **Production Web App** | Firebase Hosting (Global CDN) | [https://visitor-pass-5244.web.app](https://visitor-pass-5244.web.app) |
| **Firebase Mirror** | Firebase App Domain | [https://visitor-pass-5244.firebaseapp.com](https://visitor-pass-5244.firebaseapp.com) |
| **Self-Service Kiosk** | Visitor Pre-Registration | [https://visitor-pass-5244.web.app/public-register](https://visitor-pass-5244.web.app/public-register) |
| **Staff Registration** | Employee / Host Onboarding | [https://visitor-pass-5244.web.app/register](https://visitor-pass-5244.web.app/register) |
| **Security Gate Desk** | Live Webcam QR Scanner | [https://visitor-pass-5244.web.app/security](https://visitor-pass-5244.web.app/security) |

---

This guide explains how to deploy **PassPulse** to production across different environments:
1. **Firebase Hosting & Cloud Functions** (Current Live Setup)
2. **Cloud Single-Service Deployment** (Render / Railway / AWS EC2 / DigitalOcean)
3. **Containerized Deployment** (Docker Compose + Nginx Reverse Proxy)
4. **Decoupled Cloud Deployment** (Vercel for Frontend + Render for Backend)

---

## Option 1: Cloud Single-Service Deployment (Render / Railway)

Because the Express backend is configured to automatically build and serve the React Single Page Application from `frontend/dist`, you can deploy the entire stack as a **single web service** on platforms like [Render](https://render.com) or [Railway](https://railway.app).

### Step 1: Set Up MongoDB Atlas (Free Cloud Database)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free account.
2. Create a new **Free (M0)** Shared Cluster.
3. Under **Database Access**, create a database user (e.g., username: `admin`, password: `YourStrongPassword`).
4. Under **Network Access**, click **Add IP Address** and select **Allow Access From Anywhere** (`0.0.0.0/0`).
5. Click **Connect** -> **Drivers** -> Copy your connection string:
   ```text
   mongodb+srv://admin:<password>@cluster0.abcde.mongodb.net/visitor_pass_db?retryWrites=true&w=majority
   ```
   > **Note on Special Characters**: If your MongoDB password contains special characters like `@`, `#`, or `%`, URL-encode them (e.g. `@` becomes `%40`, so `pass@123` becomes `pass%40123`), or use an alphanumeric password like `saddam12345` to avoid URI parsing conflicts.


### Step 2: Deploy to Render.com
1. Push this repository to **GitHub**.
2. Sign in to [Render](https://render.com) and click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Fill in the settings:
   - **Name**: `passpulse-visitor-system`
   - **Environment**: `Node`
   - **Region**: Closest to your users (e.g., Singapore, Frankfurt, Oregon)
   - **Branch**: `main`
   - **Build Command**:
     ```bash
     npm run install:all && npm run build
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
5. Add **Environment Variables** under the "Environment" tab:
   | Key | Value |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `MONGO_URI` | *Your MongoDB Atlas connection string from Step 1* |
   | `JWT_SECRET` | *A random 32+ character secure key* |
6. Click **Create Web Service**.
7. Once deployed, Render provides an SSL-enabled public URL (e.g., `https://passpulse-visitor-system.onrender.com`).
8. *(Optional)* Seed initial demo data:
   - In the Render service dashboard, click **Shell** and run:
     ```bash
     npm run seed
     ```

---

## Option 2: Containerized Deployment (Docker + Nginx)

If deploying to a self-hosted Linux VPS (Ubuntu, Debian, RHEL) or on-premise server:

### Prerequisites
- Docker Engine & Docker Compose installed:
  ```bash
  sudo apt-get update && sudo apt-get install docker-compose-plugin docker.io -y
  ```

### Build and Run
From the root directory:
```bash
docker compose up -d --build
```

### Services Launched:
- **MongoDB**: Container `passpulse-mongo` on port `27017`
- **Backend API**: Container `passpulse-backend` on internal port `5000`
- **Nginx Web Server**: Container `passpulse-frontend` on port `80` (reverse proxies `/api/` to backend and serves frontend SPA)

### Access:
Open `http://<your-server-ip>` in your browser.

To seed the containerized database:
```bash
docker exec -it passpulse-backend npm run seed
```

To stop:
```bash
docker compose down
```

---

## Option 3: Decoupled Cloud Deployment (Vercel + Render)

If you prefer hosting the React frontend on Vercel's global CDN and the Express backend on Render:

### Part A: Deploy Backend to Render
1. Create a Web Service with:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment Variables**:
     - `MONGO_URI`: *MongoDB Atlas URI*
     - `JWT_SECRET`: *Your JWT key*
     - `NODE_ENV`: `production`
2. Note your backend URL: `https://your-api.onrender.com`

### Part B: Deploy Frontend to Vercel
1. Sign in to [Vercel](https://vercel.com) and import the repository.
2. Set **Root Directory** to `frontend`.
3. Set **Environment Variable**:
   - `VITE_API_URL`: `https://your-api.onrender.com/api`
4. Click **Deploy**.

---

## Environment Variables Reference

| Variable | Description | Example |
| :--- | :--- | :--- |
| `PORT` | Port the backend server listens on | `5000` (Render/Railway sets this automatically) |
| `NODE_ENV` | Application environment | `production` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/visitor_pass_db` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `super_secret_visitor_pass_jwt_key_2026` |
| `CLIENT_URL` | Allowed client URL for CORS | `http://localhost:5173` or `*` |
| `SMTP_HOST` | *(Optional)* SMTP mail server host | `smtp.ethereal.email` or `smtp.sendgrid.net` |
| `SMTP_PORT` | *(Optional)* SMTP port | `587` |
| `SMTP_USER` | *(Optional)* SMTP username | `apikey` |
| `SMTP_PASS` | *(Optional)* SMTP password | `SG.xxxxxxxx` |
