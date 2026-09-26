require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const NodeCache = require("node-cache");
const { buildFlightLink, buildTrainLink, buildBusLink } = require("./links");

const app = express();
const PORT = process.env.PORT || 3001;
const TOKEN = process.env.TRAVELPAYOUTS_TOKEN || "";
const cache = new NodeCache({ stdTTL: 600 }); // cache results 10 minutes

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "*" }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true, hasToken: Boolean(TOKEN) });
});

// ---------- FLIGHTS ----------
// Uses Travelpayouts' public "cheapest prices" endpoint. Requires an API token
// (free after signup at travelpayouts.com). Falls back to mock data if no
// token is configured, so the app still works while you're setting up.
app.get("/api/search/flights", async (req, res) => {
  const { from, to, date } = req.query;
  if (!from || !to || !date) {
    return res.status(400).json({ error: "from, to, and date are required" });
  }

  const cacheKey = `flight:${from}:${to}:${date}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  if (!TOKEN) {
    const mock = mockFlights(from, to, date);
    cache.set(cacheKey, mock);
    return res.json(mock);
  }

  try {
    const url = `https://api.travelpayouts.com/v1/prices/cheap?origin=${from}&destination=${to}&depart_date=${date.slice(0, 7)}&currency=inr&token=${TOKEN}`;
    const r = await fetch(url);
    const data = await r.json();

    const raw = data?.data?.[to] || {};
    const results = Object.values(raw).map((f) => ({
      airline: f.airline || "Unknown",
      price: f.price,
      departure_at: f.departure_at,
      return_at: f.return_at || null,
      link: buildFlightLink(from, to, date),
    }));

    if (results.length === 0) {
      const mock = mockFlights(from, to, date);
      cache.set(cacheKey, mock);
      return res.json(mock);
    }

    results.sort((a, b) => a.price - b.price);
    cache.set(cacheKey, results);
    res.json(results);
  } catch (err) {
    console.error("Flight API error:", err.message);
    res.json(mockFlights(from, to, date));
  }
});

// ---------- TRAINS ----------
// No public train price API is wired in yet - this returns a single deep-link
// entry pointing at ConfirmTkt search results for the route. See README.
app.get("/api/search/trains", (req, res) => {
  const { from, to, date } = req.query;
  if (!from || !to || !date) {
    return res.status(400).json({ error: "from, to, and date are required" });
  }
  res.json([
    {
      note: "Live train pricing isn't wired up yet - this opens live search results instead.",
      link: buildTrainLink(from, to, date),
    },
  ]);
});

// ---------- BUSES ----------
// Same situation as trains: deep-link only until a bus pricing source is added.
app.get("/api/search/buses", (req, res) => {
  const { from, to, date } = req.query;
  if (!from || !to || !date) {
    return res.status(400).json({ error: "from, to, and date are required" });
  }
  res.json([
    {
      note: "Live bus pricing isn't wired up yet - this opens live search results instead.",
      link: buildBusLink(from, to, date),
    },
  ]);
});

function mockFlights(from, to, date) {
  const base = 4200 + (from.charCodeAt(0) + to.charCodeAt(0)) * 10;
  const airlines = ["IndiGo", "Air India", "Vistara", "SpiceJet", "Akasa Air"];
  return airlines.map((airline, i) => ({
    airline,
    price: base + i * 380,
    departure_at: `${date}T${String(6 + i * 3).padStart(2, "0")}:15:00`,
    return_at: null,
    link: buildFlightLink(from, to, date),
    mock: true,
  }));
}

app.listen(PORT, () => {
  console.log(`Fareboard backend running on port ${PORT}`);
  console.log(TOKEN ? "Travelpayouts token loaded." : "No token set - serving mock flight data.");
});
