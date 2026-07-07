# Booking AI Voice Agent

AI receptionist for service businesses using **Retell AI**, **Python (FastAPI)**, and **Next.js**.

## Architecture

```
Browser (Next.js on Vercel)
    ├── Web call UI → Retell Web SDK
    ├── /api/create-web-call → Retell API
    └── /api/bookings → Python backend (Railway)

Retell AI Agent
    ├── LLM prompt (receptionist flow)
    ├── create_booking custom function → Railway /bookings/create
    └── call webhooks → Railway /webhook
```

## Prerequisites

- [Retell AI](https://www.retellai.com/) account and API key
- Python 3.11+
- Node.js 20+
- Railway account (backend)
- Vercel account (frontend)

## Local setup

### 1. Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env` with your `RETELL_API_KEY`. For local dev:

```env
WEBHOOK_BASE_URL=http://localhost:8000
CORS_ORIGINS=http://localhost:3000
SKIP_WEBHOOK_VERIFY=true
```

Start the API:

```bash
uvicorn app.main:app --reload --port 8000
```

### 2. Create the Retell agent

With the backend running (or using your Railway URL as `WEBHOOK_BASE_URL`):

```bash
python -m scripts.setup_agent
```

Copy the printed `RETELL_AGENT_ID` into both backend and frontend `.env` files.

For local custom functions, expose the backend with [ngrok](https://ngrok.com/) and re-run setup with the public URL.

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
```

Set in `.env.local`:

```env
RETELL_API_KEY=...
RETELL_AGENT_ID=...
BACKEND_URL=http://localhost:8000
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Start Call**.

## Deploy to Railway (backend)

1. Push this repo to GitHub.
2. In [Railway](https://railway.app/), create a new project → **Deploy from GitHub**.
3. Set the **root directory** to `backend`.
4. Add environment variables:
   - `RETELL_API_KEY`
   - `RETELL_AGENT_ID` (after running setup)
   - `WEBHOOK_BASE_URL` = your Railway public URL (e.g. `https://xxx.up.railway.app`)
   - `CORS_ORIGINS` = your Vercel URL (e.g. `https://xxx.vercel.app`)
5. Add a **PostgreSQL** plugin for persistent bookings and set `DATABASE_URL` from Railway.
6. Deploy and note the public URL.

Re-run `setup_agent` with the Railway URL as `WEBHOOK_BASE_URL` so Retell points custom functions and webhooks to production.

## Deploy to Vercel (frontend)

1. Import the repo in [Vercel](https://vercel.com/).
2. Set **root directory** to `frontend`.
3. Add environment variables:
   - `RETELL_API_KEY`
   - `RETELL_AGENT_ID`
   - `BACKEND_URL` = Railway URL
4. Deploy.

Update backend `CORS_ORIGINS` to include the Vercel URL.

## Agent prompt

The receptionist prompt lives in `backend/app/prompts/receptionist.txt`. After editing, update the LLM in Retell (re-run `setup_agent` or update via dashboard/API).

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/webhook` | Retell call events |
| POST | `/bookings/create` | Retell custom function — create booking |
| GET | `/bookings` | List all bookings |
| POST | `/calls/web` | Create web call (optional, frontend uses Next.js route) |

## Phone calls

For inbound phone calls, buy a number in the Retell dashboard and assign your agent. Webhooks and custom functions use the same Railway backend.
