const TRANSACTIONS_KEY = 'painelsms_transactions';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getInternalTransactions = () => {
  const data = localStorage.getItem(TRANSACTIONS_KEY);
  return data ? JSON.parse(data) : [];
};

const saveTransactions = (transactions) => {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
};

export const paymentService = {
  async createPixCharge(amount, userId) {
    await delay(800);

    const chargeId = `chg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const mockCopyPaste = `00020126580014br.gov.bcb.pix0136mock-pix-key-${chargeId}5204000053039865405${amount}5802BR5911PainelSMS6009Sao Paulo62070503***6304ABCD`;
    const mockQrCode = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y5ZmFmYiIvPjxyZWN0IHg9IjIwIiB5PSIyMCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSJub25lIiBzdHJva2U9IiMzYjgyZjYiIHN0cm9rZS13aWR0aD0iNCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjE1IiBmaWxsPSIjM2I4MmY2Ii8+PC9zdmc+`;

    const transaction = {
      id: chargeId,
      userId,
      amount,
      type: 'deposit',
      description: 'Recarga via Pix',
      status: 'pending',
      timestamp: Date.now()
    };

    const txs = getInternalTransactions();
    txs.push(transaction);
    saveTransactions(txs);

    return {
      id: chargeId,
      qrCode: mockQrCode,
      pixCode: mockCopyPaste,
      amount,
      status: 'pending',
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 mins
    };
  },

  async checkPaymentStatus(chargeId) {
    await delay(300);

    // Random 20% chance to simulate user paying on each poll
    const isPaid = Math.random() < 0.2;

    if (isPaid) {
      return 'completed';
    }

    return 'pending';
  },

  async updateTransactionStatus(chargeId, status) {
    const txs = getInternalTransactions();
    const index = txs.findIndex(t => t.id === chargeId);
    if (index !== -1) {
      txs[index].status = status;
      if (status === 'completed') {
        txs[index].completedAt = Date.now();
      }
      saveTransactions(txs);
    }
  },

  async getTransactions(userId) {
    await delay(200);
    return getInternalTransactions()
      .filter(t => t.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }
};
