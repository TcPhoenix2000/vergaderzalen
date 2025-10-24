async function loadSlots() {
  const tableBody = document.querySelector("#slotsTable tbody");
  tableBody.innerHTML = "<tr><td colspan='4'>Loading...</td></tr>";

  // Get Monday of the current week
  const now = new Date();
  
  const dateStr = now.toUTCString();
  const encodedDate = encodeURIComponent(dateStr);
  const url = `https://api.agsoknokke-heist.be/api/v1/booking/slots?date=${encodedDate}`;

  console.log("🔍 Fetching booking slots from:", url);

  try {
    const response = await fetch(url);
    console.log("📡 Response status:", response.status, response.statusText);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    console.log("✅ API data received:", data);

    const rows = [];

    data.forEach(roomEntry => {
      const roomName = roomEntry.room?.text || "Onbekende locatie";
      const slots = roomEntry.slots || [];
      
       

      // Find slot that is currently active
      const currentSlot = slots.find(slot => {
        const start = new Date(slot.startDate);
        const end = new Date(slot.endDate);
        return now >= start && now < end;
      });


      let statusText = "Geen slot actief";
      let statusColor = "#999";
      let slotTime = "-";
      let subject = "-";

      if (currentSlot) {
        const start = new Date(currentSlot.startDate);
        const end = new Date(currentSlot.endDate);
        slotTime = `${start.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} - ${end.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;
        subject = currentSlot.subject || "-";
        statusText = currentSlot.available ? "✅ Beschikbaar" : "❌ Bezet";
        statusColor = currentSlot.available ? "green" : "red";
      }

      rows.push(`
        <tr>
          <td>${now.toLocaleDateString()}</td>
          <td>${roomName}</td>
          <td>${slotTime}</td>
          <td>${subject}</td>
          <td style="color:${statusColor}; font-weight:bold;">${statusText}</td>
        </tr>
      `);
    });

    tableBody.innerHTML = rows.length ? rows.join("") : "<tr><td colspan='4'>Geen slots gevonden.</td></tr>";

  } catch (err) {
    console.error("❌ Error fetching slots:", err);
    tableBody.innerHTML = `<tr><td colspan='4'>Error: ${err.message}</td></tr>`;
  }
}

document.addEventListener("DOMContentLoaded", loadSlots);

