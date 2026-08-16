// Mock delays
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Data
let MOCK_SERVICES = [
  { id: 'whatsapp', name: 'WhatsApp', price: 5.50, country: 'Brasil', icon: 'MessageCircle', stock: 124 },
  { id: 'telegram', name: 'Telegram', price: 4.00, country: 'Brasil', icon: 'Send', stock: 89 },
  { id: 'instagram', name: 'Instagram', price: 2.50, country: 'Brasil', icon: 'Camera', stock: 245 },
  { id: 'facebook', name: 'Facebook', price: 2.00, country: 'Brasil', icon: 'Facebook', stock: 432 },
  { id: 'google', name: 'Google', price: 3.50, country: 'Brasil', icon: 'Chrome', stock: 156 },
  { id: 'tiktok', name: 'TikTok', price: 2.00, country: 'Brasil', icon: 'Music', stock: 320 },
  { id: 'discord', name: 'Discord', price: 1.50, country: 'Brasil', icon: 'MessageSquare', stock: 67 },
  { id: 'uber', name: 'Uber', price: 4.50, country: 'Brasil', icon: 'Car', stock: 12 },
  { id: 'twitter', name: 'X / Twitter', price: 2.50, country: 'Brasil', icon: 'Twitter', stock: 54 },
  { id: 'netflix', name: 'Netflix', price: 1.50, country: 'Brasil', icon: 'Tv', stock: 8 },
];

export const numberProviderService = {
  getAvailableServices() {
    return [...MOCK_SERVICES];
  },

  async purchaseNumber(serviceId) {
    await delay(800); // Simulate network latency

    const serviceIndex = MOCK_SERVICES.findIndex(s => s.id === serviceId);
    if (serviceIndex === -1) throw new Error("Serviço não encontrado");
    
    const service = MOCK_SERVICES[serviceIndex];
    if (service.stock <= 0) throw new Error("Sem estoque disponível");

    // Decrement stock
    MOCK_SERVICES[serviceIndex] = { ...service, stock: service.stock - 1 };

    // Generate mock phone number
    const ddd = Math.floor(Math.random() * 89) + 11;
    const number = Math.floor(Math.random() * 90000000) + 900000000;
    const mockPhone = `+55 ${ddd} ${number}`;

    return {
      activationId: `act_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      phoneNumber: mockPhone,
      service: MOCK_SERVICES[serviceIndex],
      status: 'waiting_sms',
      createdAt: Date.now(),
      // Guardamos o momento exato em que foi gerado para simular o delay do SMS 
      // garantindo que não venha imediatamente, mas sim numa janela de 5s a 30s
      _targetDelaySecs: Math.floor(Math.random() * 25) + 5
    };
  },

  async checkForSms(activation) {
    await delay(300);

    const now = Date.now();
    const elapsedSecs = (now - activation.createdAt) / 1000;

    // Se já passou o tempo sorteado de delay (5 a 30s), enviamos o SMS
    if (elapsedSecs >= (activation._targetDelaySecs || 10)) {
      // Retorna código de 6 dígitos
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      return {
        status: 'completed',
        code: code
      };
    }

    return {
      status: 'waiting_sms',
      code: null
    };
  },

  async cancelNumber(serviceId) {
    await delay(500);
    
    // Increment stock back
    const serviceIndex = MOCK_SERVICES.findIndex(s => s.id === serviceId);
    if (serviceIndex !== -1) {
      MOCK_SERVICES[serviceIndex] = { 
        ...MOCK_SERVICES[serviceIndex], 
        stock: MOCK_SERVICES[serviceIndex].stock + 1 
      };
    }

    return {
      status: 'cancelled'
    };
  }
};
