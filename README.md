# LostFound+ (LostLink)

LostFound+ (LostLink) is a smart web-based platform that simplifies lost and found management. Users can report, search, and claim lost or found items through one centralized system. With secure authentication, organized search, claim tracking, and MongoDB storage, it helps communities recover belongings faster and more efficiently.

This repository contains a React frontend (`client/`) and an Express + Mongoose backend (`server/`). The project integrates visual AI attribute extraction and a two-pass matching pipeline to surface plausible matches between lost and found reports.

Key features
- AI visual attribute extraction (Groq Vision)
- Two-pass matching (MongoDB filters + weighted similarity)
- File uploads, claim workflow, and notification alerts
- Admin pages and a local-only `.env` editor (`/env-editor`) for development

Quick start (development)

1. Prerequisites
   - Node.js 18+ and npm
   - MongoDB Atlas cluster (or local MongoDB)
   - (Optional) Docker if you want to run a local MongoDB + mongo-express

2. Copy env example and fill secrets
   - Copy `server/.env.example` → `server/.env` and set `MONGODB_URI`, `JWT_SECRET`, and other values.
   - If using Atlas, add your machine IP to Atlas Network Access.

3. Install dependencies
   ```bash
   cd server
   npm install

   cd ../client
   npm install
   ```

4. Run the backend
   ```bash
   cd server
   node server.js
   ```

5. Run the frontend
   ```bash
   cd client
   npm run dev
   # open http://localhost:5173
   ```

6. Local-only env editor (dev)
   - When the backend is running on `localhost`, open `http://localhost:5173/env-editor` to view/edit `server/.env`. This endpoint writes to the local file only and is restricted to localhost requests.

Useful scripts
- Create DB indexes: `node server/scripts/createIndexes.js`
- Seed test data: `node server/scripts/seedData.js`
- Run AI backfill: `node server/scripts/backfillAI.js`

Security notes
- Never commit real secrets (API keys, DB passwords, JWT secrets) to Git. Use `server/.env.example` as a template and keep `server/.env` out of the repository. Use GitHub Secrets or your host's secret management for deployments.

Pushing to GitHub
- Initialize and push (only done locally):
  ```bash
  git init
  git add .
  git commit -m "Initial commit"
  git remote add origin https://github.com/simiyafirdous/LostLink.git
  git branch -M main
  git push -u origin main
  ```

Where to next
- Add your Atlas IP whitelist and I can restart the server and verify connectivity.
- I can also help add CI, Dockerfiles, or deployment guides if you want.

