// Builds outbound links for each transport mode.
// Flights: Aviasales/Travelpayouts search deep-link with your affiliate marker attached.
// Trains/buses: direct deep-links into ConfirmTkt / RedBus search pages (no train/bus
// affiliate API is wired in yet - see README "Extending to trains & buses").

const MARKER = process.env.TRAVELPAYOUTS_MARKER || "";

function pad(n) {
  return String(n).padStart(2, "0");
}

// Aviasales expects dates as DDMM in its search-path shorthand.
function ddmm(dateIso) {
  const d = new Date(dateIso + "T00:00:00");
  return `${pad(d.getDate())}${pad(d.getMonth() + 1)}`;
}

function monthName(dateIso) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const d = new Date(dateIso + "T00:00:00");
  return months[d.getMonth()];
}

function ddmmyyyy(dateIso) {
  const d = new Date(dateIso + "T00:00:00");
  return `${pad(d.getDate())}${pad(d.getMonth() + 1)}${d.getFullYear()}`;
}

function ddMonYyyy(dateIso) {
  const d = new Date(dateIso + "T00:00:00");
  return `${pad(d.getDate())}-${monthName(dateIso)}-${d.getFullYear()}`;
}

function buildFlightLink(originIata, destIata, dateIso) {
  const path = `${originIata}${ddmm(dateIso)}${destIata}1`;
  const base = `https://www.aviasales.com/search/${path}`;
  return MARKER ? `${base}?marker=${encodeURIComponent(MARKER)}` : base;
}

function buildTrainLink(fromName, toName, dateIso) {
  return `https://www.confirmtkt.com/train-list/${encodeURIComponent(fromName)}/${encodeURIComponent(toName)}/${ddmmyyyy(dateIso)}`;
}

function buildBusLink(fromName, toName, dateIso) {
  const slug = `${fromName.toLowerCase().replace(/\s+/g, "-")}-to-${toName.toLowerCase().replace(/\s+/g, "-")}`;
  return `https://www.redbus.in/bus-tickets/${encodeURIComponent(slug)}?fromCityName=${encodeURIComponent(fromName)}&toCityName=${encodeURIComponent(toName)}&onward=${ddMonYyyy(dateIso)}`;
}

module.exports = { buildFlightLink, buildTrainLink, buildBusLink };
