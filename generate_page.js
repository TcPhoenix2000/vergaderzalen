// generate_page.js
const fs = require('fs');
const fetch = require('node-fetch');
const { DateTime } = require('luxon');

(async () => {
  try {
    // 🔄 Use Brussels time for the API date
    const now = DateTime.now().setZone('Europe/Brussels');
    const apiUrl = `https://api.agsoknokke-heist.be/api/v1/booking/slots?date=${encodeURIComponent(now.toUTC().toISO())}`;

    console.log("🔍 Fetching booking slots from:", apiUrl);
    const res = await fetch(apiUrl);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log("✅ API data received");

    // Genereer tabelrijen
    const rows = data.flatMap(roomEntry => {
      const roomName = roomEntry.room?.text || "Onbekende locatie";
      const brusselsNow = DateTime.now().setZone('Europe/Brussels');

      // Vind momenteel actieve slot
      const currentSlot = (roomEntry.slots || []).find(slot => {
        const start = DateTime.fromISO(slot.startDate).setZone('Europe/Brussels');
        const end = DateTime.fromISO(slot.endDate).setZone('Europe/Brussels');
        return brusselsNow >= start && brusselsNow < end;
      });

      let statusText = "Geen slot actief";
      let statusColor = "#999";
      let slotTime = "-";
      let subject = "-";

      if (currentSlot) {
        const start = DateTime.fromISO(currentSlot.startDate).setZone('Europe/Brussels');
        const end = DateTime.fromISO(currentSlot.endDate).setZone('Europe/Brussels');

        slotTime = `${start.toFormat('HH:mm')} - ${end.toFormat('HH:mm')}`;
        statusText = currentSlot.available ? "✅ Beschikbaar" : "❌ Bezet";
        statusColor = currentSlot.available ? "green" : "red";
      }

      return `<tr>
        <td>${brusselsNow.toFormat('dd/MM/yyyy')}</td>
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
