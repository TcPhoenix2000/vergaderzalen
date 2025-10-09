const fs = require('fs');
const fetch = require('node-fetch');

(async () => {
  const apiUrl = `https://api.agsoknokke-heist.be/api/v1/booking/slots?date=${encodeURIComponent(new Date().toUTCString())}`;
  const res = await fetch(apiUrl);
  const data = await res.json();

  const rows = data.flatMap(roomEntry => {
    const roomName = roomEntry.room?.text || "Onbekende locatie";
    return (roomEntry.slots || []).map(slot => {
      const start = new Date(slot.startDate);
      const end = new Date(slot.endDate);
      const slotTime = `${start.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} - ${end.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;
      const statusText = slot.available ? "✅ Beschikbaar" : "❌ Bezet";
      const statusColor = slot.available ? "green" : "red";
      return `<tr>
        <td>${start.toLocaleDateString()}</td>
        <td>${roomName}</td>
        <td>${slotTime}</td>
        <td style="color:${statusColor}; font-weight:bold;">${statusText}</td>
      </tr>`;
    });
  });

  const template = fs.readFileSync('template.html', 'utf8');
  const html = template.replace('{{tableRows}}', rows.join('\n'));
  fs.writeFileSync('index.html', html);
  console.log('✅ index.html gegenereerd met API data');
})();
