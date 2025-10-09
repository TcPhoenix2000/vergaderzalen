// generate_page.js
const fs = require('fs');
const fetch = require('node-fetch');

(async () => {
  try {
    const now = new Date();
    const apiUrl = `https://api.agsoknokke-heist.be/api/v1/booking/slots?date=${encodeURIComponent(now.toUTCString())}`;

    console.log("🔍 Fetching booking slots from:", apiUrl);
    const res = await fetch(apiUrl);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log("✅ API data received");

    // Genereer tabelrijen
    const rows = data.flatMap(roomEntry => {
      const roomName = roomEntry.room?.text || "Onbekende locatie";

      // 🔄 Huidige tijd in Brussels timezone
      const brusselsNow = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Europe/Brussels" })
      );
      
      // Vind momenteel actieve slot
      const currentSlot = (roomEntry.slots || []).find(slot => {
        const start = new Date(slot.startDate);
        const end = new Date(slot.endDate);
        return brusselsNow >= start && brusselsNow < end;
      });


      let statusText = "Geen slot actief";
      let statusColor = "#999";
      let slotTime = "-";

      if (currentSlot) {
        const start = new Date(currentSlot.startDate);
        const end = new Date(currentSlot.endDate);
        slotTime = `${start.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} - ${end.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;
        statusText = currentSlot.available ? "✅ Beschikbaar" : "❌ Bezet";
        statusColor = currentSlot.available ? "green" : "red";
      }

      return `<tr>
        <td>${now.toLocaleDateString()}</td>
        <td>${roomName}</td>
        <td>${slotTime}</td>
        <td style="color:${statusColor}; font-weight:bold;">${statusText}</td>
      </tr>`;
    });

    // Lees HTML-template
    const template = fs.readFileSync('template.html', 'utf8');
    const html = template.replace('{{tableRows}}', rows.join('\n'));

    // Schrijf naar index.html
    fs.writeFileSync('index.html', html);
    console.log("✅ index.html gegenereerd met API data");

  } catch (err) {
    console.error("❌ Error generating HTML:", err);
  }
})();

