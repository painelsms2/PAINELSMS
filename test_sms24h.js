const SMS24H_API_KEY = "77d360e350e2d0671e26b8ec68c82eba";
const baseUrl = "https://api.sms24h.org/stubs/handler_api.php";

async function run() {
  const fetch = (await import('node-fetch')).default;
  const url = `${baseUrl}?api_key=${SMS24H_API_KEY}&action=getPrices&country=73`;
  console.log("Fetching:", url);
  const res = await fetch(url);
  const text = await res.text();
  console.log(`Length: ${text.length}, text start: ${text.substring(0, 100)}`);
  
  try {
    const data = JSON.parse(text);
    const countryData = data['73'];
    if (!countryData) {
      console.log(`Country 73 not found in response keys: ${Object.keys(data)}`);
      return;
    }
    
    const services = [];
    for (const [code, info] of Object.entries(countryData)) {
      const priceKeys = Object.keys(info);
      if (priceKeys.length > 0) {
        const price = parseFloat(priceKeys[0]);
        const quantity = info[priceKeys[0]];
        services.push({ providerServiceCode: code, price, quantity });
      }
    }
    console.log(`Parsed ${services.length} offers successfully.`);
    console.log("Sample offers:", services.slice(0, 5));
    
    // Check WhatsApp (wa)
    const wa = services.find(s => s.providerServiceCode === 'wa');
    console.log("WhatsApp offer:", wa);
  } catch(e) {
    console.error("Parse Error:", e.message);
  }
}
run();
