# Fareboard — flight/train/bus price comparison

A price-comparison site that searches flights (live, via Travelpayouts) and
trains/buses (deep-link only for now), and sends users onward to book on the
operator's own site through your affiliate link.

```
fareboard/
├── frontend/
│   └── index.html        ← the whole site (no build step needed)
├── backend/
│   ├── server.js          ← API server
│   ├── links.js           ← builds outbound/affiliate links
│   ├── package.json
│   └── .env.example       ← copy to .env and fill in
└── README.md
```

## 1. Get a Travelpayouts account (free, ~5 min)

1. Sign up at https://www.travelpayouts.com/
2. In your dashboard, find:
   - **API Token** (Tools → API access, or similar)
   - **Marker** (your affiliate ID number — shown on your account/tools page)
3. You don't need approval to start — the flight price API and affiliate
   links both work as soon as you have these two values.

## 2. Run the backend locally

```bash
cd backend
npm install
cp .env.example .env
# open .env and paste in your TRAVELPAYOUTS_TOKEN and TRAVELPAYOUTS_MARKER
npm start
```

You should see `Fareboard backend running on port 3001`. Visit
`http://localhost:3001/api/health` in a browser — it should show
`{"ok":true,"hasToken":true}`.

## 3. Run the frontend locally

The frontend is a single static HTML file — no build step. Easiest way to
test it locally:

```bash
cd frontend
npx serve .
```

Open the URL it gives you (usually `http://localhost:3000`). It will call
your backend at `http://localhost:3001` automatically. If the backend isn't
running, it shows sample data instead of failing silently — so you can tell
the two apart while testing.

## 4. Publish it for real

**Backend** (pick one, both have free tiers):
- **Render** (render.com): New → Web Service → connect your GitHub repo →
  set root directory to `backend` → build command `npm install` → start
  command `npm start` → add your `.env` values under Environment.
- **Railway** (railway.app): similar flow, auto-detects Node.

Once deployed you'll get a URL like `https://fareboard-backend.onrender.com`.

**Frontend**:
- **Netlify** or **Vercel**: drag-and-drop the `frontend` folder, or connect
  the GitHub repo and set the publish directory to `frontend`.
- Before deploying, open `frontend/index.html` and change this line near the
  top of the `<script>` block:
  ```js
  const API_BASE = window.FAREBOARD_API_BASE || "http://localhost:3001";
  ```
  to your live backend URL, e.g. `"https://fareboard-backend.onrender.com"`.

**Domain**: buy one (e.g. via Namecheap, GoDaddy, or a `.in` registrar) and
point it at your Netlify/Vercel site — both have simple "custom domain"
settings that walk you through the DNS steps.

## 5. Put your repo on GitHub first

Both Render/Railway and Netlify/Vercel deploy straight from a GitHub repo,
which is the easiest path:

```bash
cd fareboard
git init
git add .
git commit -m "Initial Fareboard build"
# create a new empty repo on github.com, then:
git remote add origin https://github.com/YOUR-USERNAME/fareboard.git
git branch -M main
git push -u origin main
```

**Important**: never commit your real `.env` file (it has your API token).
Add a `.gitignore` with `.env` in it — see below.

## Extending to trains & buses

Right now trains and buses only send the user to a live search page
(ConfirmTkt / RedBus) — there's no itemized price list like flights have,
because Travelpayouts doesn't offer a simple public price-data API for
those two the way it does for flights. Two ways to add real train/bus
pricing later:

1. Look for a dedicated rail/bus data API (e.g. a paid IRCTC-data reseller,
   or RedBus's affiliate program if/when open to your account) and add a
   new route in `server.js` similar to `/api/search/flights`.
2. Keep deep-link-only for these two, since even without prices shown, you
   can still earn RedBus affiliate commission if your Travelpayouts account
   is later approved for their program — the traffic still flows through
   your marker.

## Notes on cost

- Travelpayouts API + affiliate program: free.
- Render/Railway/Netlify/Vercel free tiers: enough for a new site with low
  traffic. You'll only need to pay once you have meaningful visitors.
- A domain: roughly $10-15/year, optional if you're fine starting on the
  free `*.netlify.app` / `*.vercel.app` subdomain.
