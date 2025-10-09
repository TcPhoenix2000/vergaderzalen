<?php
// haal de API op
$apiUrl = "https://api.agsoknokke-heist.be/api/v1/booking/slots?date=" . urlencode(date(DATE_RFC1123));

$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$data = [];
if ($httpCode === 200) {
    $data = json_decode($response, true);
}
?>
<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Booking Slots (This Week)</title>
<style>
body {
  font-family: system-ui, sans-serif;
  background: #F6EBD7;
  color: #333;
  padding: 20px;
}
h1 {
  text-align: center;
}
table {
  border-collapse: collapse;
  width: 100%;
  margin-top: 1em;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}
th, td {
  border-bottom: 1px solid #ddd;
  padding: 10px;
  text-align: left;
}
th {
  background: #939765;
  color: white;
}
tr:hover {
  background: #f1f5ff;
}
</style>
</head>
<body>

<h1>Vergaderzaal Slots Deze Week</h1>

<table id="slotsTable">
  <thead>
    <tr>
      <th>Datum</th>
      <th>Vergaderzaal</th>
      <th>TijdSlot</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
<?php
if (!$data) {
    echo "<tr><td colspan='4'>Geen data gevonden of fout bij ophalen API.</td></tr>";
} else {
    $now = new DateTime();
    foreach ($data as $roomEntry) {
        $roomName = $roomEntry['room']['text'] ?? "Onbekende locatie";
        $slots = $roomEntry['slots'] ?? [];
        if (!$slots) {
            echo "<tr><td>". $now->format('d/m/Y') ."</td><td>$roomName</td><td>-</td><td style='color:#999;'>Geen slot</td></tr>";
            continue;
        }
        foreach ($slots as $slot) {
            $start = new DateTime($slot['startDate']);
            $end = new DateTime($slot['endDate']);
            $slotTime = $start->format('H:i') . " - " . $end->format('H:i');
            $statusText = $slot['available'] ? "✅ Beschikbaar" : "❌ Bezet";
            $statusColor = $slot['available'] ? "green" : "red";
            echo "<tr>
                    <td>". $start->format('d/m/Y') ."</td>
                    <td>$roomName</td>
                    <td>$slotTime</td>
                    <td style='color:$statusColor; font-weight:bold;'>$statusText</td>
                  </tr>";
        }
    }
}
?>
  </tbody>
</table>

</body>
</html>
