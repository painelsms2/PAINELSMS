# Implementação de Múltiplos Fornecedores (Multi-Provider)

O objetivo desta arquitetura é permitir que você configure múltiplos fornecedores de SMS (ex: Fornecedor A, Fornecedor B) e, no painel de Admin, você consiga visualizar o estoque e preço de cada um, escolhendo qual deles será o ativo para aquele serviço específico.

> [!IMPORTANT]
> **User Review Required**
> Precisamos definir qual é o segundo fornecedor que você quer integrar. Alguns fornecedores usam a mesma estrutura de API (tipo SMSHub e SMS-Activate), o que é mais fácil. Outros usam APIs completamente diferentes (tipo 5SIM). 

## Open Questions
1. Qual é o nome/site desse segundo fornecedor que você está olhando? 
2. Você já tem a chave de API (API Key) e a URL dele?
3. O modelo ideal para você no admin seria ter um "Dropdown/Select" em cada serviço onde você escolhe "Fornecedor 1" ou "Fornecedor 2", e ao trocar, ele puxa o estoque real dele na hora?

## Proposed Changes

### Banco de Dados
Precisaremos atualizar a tabela `services` para suportar essa escolha de fornecedores:
- Adicionar coluna `active_provider` (ex: `sms-activate`, `fornecedor2`).
- Adicionar coluna `provider_service_code` (caso o código do serviço mude dependendo do fornecedor).

### `src/services/numberProviderService.js`
- Refatorar o `callProvider` para aceitar a URL e a API_KEY dinamicamente dependendo do `active_provider` salvo no banco para aquele serviço.
- Criar a lógica de consultar o saldo e estoque para os dois fornecedores simultaneamente no painel admin.

### `src/pages/admin/Servicos.jsx` (Painel Admin)
- Na edição rápida do serviço, adicionar um Dropdown "Fornecedor Atual".
- Ao lado, exibir o estoque e preço de custo nos dois fornecedores, para facilitar sua decisão.

## Verification Plan
1. Configurar os dois fornecedores no arquivo de ambiente (`.env`).
2. Entrar no Painel Admin e trocar o WhatsApp do Fornecedor 1 para o Fornecedor 2.
3. Simular uma compra de número no Painel do Cliente e verificar nos logs (ou na tela) se a API acionada foi a do Fornecedor 2.
