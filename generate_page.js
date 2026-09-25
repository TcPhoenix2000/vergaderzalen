// Bouwt _site/index.html met de actuele slots erin (statische pagina).
const fs = require('fs');
const { buildRows, fetchSlots, fmtTime } = require('./js/vergaderzaal.js');

(async () => {
  const now = new Date();
  console.log("🔍 Fetching booking slots for", now.toISOString());
  const data = await fetchSlots(now);

  const html = fs.readFileSync('template.html', 'utf8')
    .replace('{{tableRows}}', buildRows(data, now))
    .replace('{{updated}}', `Laatst bijgewerkt: ${fmtTime.format(now)}`);

  fs.mkdirSync('_site', { recursive: true });
  fs.writeFileSync('_site/index.html', html);
  fs.cpSync('css', '_site/css', { recursive: true });
  fs.cpSync('js', '_site/js', { recursive: true });
  console.log("✅ _site/index.html gegenereerd");
})().catch(err => {
  // Faal hard, zodat er geen kapotte pagina gedeployed wordt.
  console.error("❌ Error generating HTML:", err);
  process.exit(1);
});
