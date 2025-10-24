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

    const rows = data.flatMap(roomEntry => {
      const roomName = roomEntry.room?.text || "Onbekende locatie";
      const brusselsNow = DateTime.now().setZone('Europe/Brussels');
      const slots = roomEntry.slots || [];

      // Vind momenteel actieve slot
      const currentIndex = slots.findIndex(slot => {
        const start = DateTime.fromISO(slot.startDate).setZone('Europe/Brussels');
        const end = DateTime.fromISO(slot.endDate).setZone('Europe/Brussels');
        return brusselsNow >= start && brusselsNow < end;
      });

      const relevantSlots = [];
      if (currentIndex >= 0) {
        relevantSlots.push(slots[currentIndex]); // huidige slot
        if (slots[currentIndex + 1]) {
          relevantSlots.push(slots[currentIndex + 1]); // volgende slot
        }
      }

      // Als er geen actief slot is, toon alleen de eerstvolgende
      if (relevantSlots.length === 0 && slots.length > 0) {
        const nextSlot = slots.find(slot => {
          const start = DateTime.fromISO(slot.startDate).setZone('Europe/Brussels');
          return start > brusselsNow;
        });
        if (nextSlot) relevantSlots.push(nextSlot);
      }

      // Genereer rijen
      return relevantSlots.map(slot => {
        const start = DateTime.fromISO(slot.startDate).setZone('Europe/Brussels');
        const end = DateTime.fromISO(slot.endDate).setZone('Europe/Brussels');
        const slotTime = `${start.toFormat('HH:mm')} - ${end.toFormat('HH:mm')}`;
        const subject = slot.subject || "-";
        const isAvailable = slot.available;
        const statusText = isAvailable ? "✅ Beschikbaar" : "❌ Bezet";
        const statusColor = isAvailable ? "green" : "red";

        return `<tr>
          <td>${brusselsNow.toFormat('dd/MM/yyyy')}</td>
          <td>${roomName}</td>
          <td>${slotTime}</td>
          <td>${subject}</td>
          <td style="color:${statusColor}; font-weight:bold;">${statusText}</td>
        </tr>`;
      });
    });

    // Lees HTML-template
    const template = fs.readFileSync('template.html', 'utf8');
    const html = template.replace('{{tableRows}}', rows.join('\n'));

    // Schrijf naar index.html
    fs.writeFileSync('index.html', html);
    console.log("✅ index.html gegenereerd met huidige + volgende slot");

  } catch (err) {
    console.error("❌ Error generating HTML:", err);
  }
})();
