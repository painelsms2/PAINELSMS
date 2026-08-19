export default async function handler(req, res) {
  const { action, service, country, id, status } = req.query;
  const API_URL = process.env.VITE_SMS_API_URL;
  const API_KEY = process.env.VITE_SMS_API_KEY;

  if (!API_URL || !API_KEY) {
    return res.status(500).json({ error: 'Configuração do servidor ausente (API_URL ou API_KEY)' });
  }

  try {
    let url = `${API_URL}?api_key=${API_KEY}&action=${action}`;
    if (service) url += `&service=${service}`;
    if (country) url += `&country=${country}`;
    if (id) url += `&id=${id}`;
    if (status) url += `&status=${status}`;

    const response = await fetch(url);
    const text = await response.text();
    
    // Retorna o texto puro do SMS-Activate/SMS24h para o frontend
    res.status(200).send(text);
  } catch (error) {
    res.status(500).send(error.message);
  }
}
