export default async function handler(req, res) {
  const { action, service, country, id, status } = req.query;
  const API_URL = process.env.VITE_SMS_API_URL;
  const API_KEY = process.env.VITE_SMS_API_KEY;

  if (!API_URL || !API_KEY) {
    return res.status(500).json({ success: false, error: 'Configuração do servidor ausente (API_URL ou API_KEY)' });
  }

  try {
    // Fix missing protocol if user forgot it
    let cleanApiUrl = API_URL;
    if (!cleanApiUrl.startsWith('http://') && !cleanApiUrl.startsWith('https://')) {
      cleanApiUrl = 'https://' + cleanApiUrl;
    }
    
    // FAILSAFE: sms24h.org blocks .php with Cloudflare. We forcefully remove it if present.
    if (cleanApiUrl.endsWith('.php')) {
      cleanApiUrl = cleanApiUrl.slice(0, -4);
    }

    let url = `${cleanApiUrl}?api_key=${API_KEY}&action=${action}`;
    if (service) url += `&service=${service}`;
    if (country) url += `&country=${country}`;
    if (id) url += `&id=${id}`;
    if (status) url += `&status=${status}`;

    const response = await fetch(url);
    const text = await response.text();
    
    // Retorna JSON para o frontend poder debugar exatamente o que o fornecedor respondeu
    res.status(200).json({
      success: true,
      providerStatus: response.status,
      text: text,
      maskedUrl: url.replace(API_KEY, '***')
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
