// Gedeelde code: generate_page.js gebruikt dit om de statische index.html te bouwen,
// in de browser ververst hetzelfde script de tabel elke minuut live (de API staat CORS toe).
const API_URL = "https://api.agsoknokke-heist.be/api/v1/booking/slots";
const REFRESH_MS = 60 * 1000;
const TZ = "Europe/Brussels";

const fmtTime = new Intl.DateTimeFormat("nl-BE", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const fmtDate = new Intl.DateTimeFormat("nl-BE", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" });

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Huidige slot + volgende; is er geen actief slot, dan enkel de eerstvolgende.
function relevantSlots(slots, now) {
  const i = slots.findIndex(s => now >= new Date(s.startDate) && now < new Date(s.endDate));
  if (i >= 0) return slots.slice(i, i + 2);
  const next = slots.find(s => new Date(s.startDate) > now);
  return next ? [next] : [];
}

function renderRow(roomName, slot) {
  const start = new Date(slot.startDate);
  const end = new Date(slot.endDate);
  const status = slot.available
    ? '<td class="available">✅ Beschikbaar</td>'
    : '<td class="busy">❌ Bezet</td>';
  return `<tr>
    <td>${fmtDate.format(start)}</td>
    <td>${escapeHtml(roomName)}</td>
    <td>${fmtTime.format(start)} - ${fmtTime.format(end)}</td>
    <td>${escapeHtml(slot.subject || "-")}</td>
    ${status}
  </tr>`;
}

function buildRows(data, now) {
  const rows = data.flatMap(entry => {
    const roomName = entry.room?.text || "Onbekende locatie";
    const slots = relevantSlots(entry.slots || [], now);
    return slots.length
      ? slots.map(slot => renderRow(roomName, slot))
      : [`<tr><td>${fmtDate.format(now)}</td><td>${escapeHtml(roomName)}</td><td>-</td><td>-</td><td class="none">Geen slots meer vandaag</td></tr>`];
  });
  return rows.length ? rows.join("\n") :"<tr><td colspan='5'>Geen slots gevonden.</td></tr>";
}

async function fetchSlots(now) {
  const res = await fetch(`${API_URL}?date=${encodeURIComponent(now.toISOString())}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function loadSlots() {
  const updated = document.getElementById("updated");
  const now = new Date();
  try {
    const data = await fetchSlots(now);
    document.querySelector("#slotsTable tbody").innerHTML = buildRows(data, now);
    updated.textContent = `Laatst bijgewerkt: ${fmtTime.format(now)}`;
  } catch (err) {
    // Laat de vorige (statische) data staan bij een tijdelijke fout; toon enkel een melding.
    console.error("Fout bij ophalen slots:", err);
    updated.textContent = `Bijwerken mislukt (${err.message}), nieuwe poging binnen een minuut.`;
  }
}

if (typeof module !== "undefined") {
  module.exports = { buildRows, fetchSlots, fmtTime };
} else {
  loadSlots();
  setInterval(loadSlots, REFRESH_MS);
}
