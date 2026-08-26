# PRD/PATCH — Gestão Automática de Fornecedores · v1.0

⚙️ EXECUÇÃO
Ferramenta:            Claude Code (esta sessão)
Modelo recomendado:    Opus (arquitetura + migração de banco + lógica que afeta o fluxo de compra/saldo)
Motivo (1 linha):      Toca RLS, função crítica de compra (purchase_number) e cria mecanismo novo de failover — vale a pena o modelo maior aqui.
Custo estimado:        alto (várias fases, migração de banco, testes end-to-end)

## Contexto
Hoje (`supabase/migrations/08_multi_provider_v2.sql` + `11_price_locked.sql`):
- `providers`: id, key, name, logo_key, active, created_at — **sem noção de saúde/status**.
- `service_offers`: liga service+provider, com cost_price, sale_price, stock, active, is_default, price_locked.
- `AdminProviders.jsx` → "Sincronizar" chama `api/provider.js` (`listServices`) e faz upsert em `service_offers`, mas **cria tudo com `active: false`** — exige revisão manual do admin pra cada oferta.
- `numberProviderService.getAvailableServices()` ordena as offers de cada serviço por `is_default` primeiro, depois menor `sale_price` — mas isso é estático (setado manualmente pelo admin), **não reage a fornecedor instável**.
- O painel do usuário (`Servicos.jsx`) mostra **todas as ofertas ativas lado a lado** (uma linha por fornecedor) — o usuário escolhe manualmente qual fornecedor comprar.
- Não existe hoje nenhum tracking de falhas/sucessos por fornecedor. Erros como `LIMITED_ACTIVATIONS` ou `NO_NUMBERS` já acontecem (vimos no log de erros) mas não deixam rastro nenhum no banco.

## Objetivo
1. **Auto-pricing/auto-ativação**: ao sincronizar um fornecedor, aplicar markup automático (regra configurável, ex: cost × multiplicador) e já deixar a oferta **ativa**, sem exigir revisão manual item a item (admin ainda pode sobrescrever preço e travar com `price_locked`, como já existe).
2. **Failover automático por saúde do fornecedor**: quando um fornecedor começa a falhar de forma consistente (ex: `LIMITED_ACTIVATIONS`, `NO_NUMBERS`, timeout, erro genérico) em compras reais, o sistema marca esse fornecedor como **instável** automaticamente. Enquanto instável, a oferta dele deixa de ser recomendada/priorizada — mesmo que seja mais barata — e o outro fornecedor assume a prioridade, mesmo sendo mais caro. Quando o fornecedor instável volta a funcionar (sucesso após o cooldown), ele **retorna automaticamente a prioritário** se voltar a ser o mais barato.
3. Isso é **prioridade dinâmica**, não uma escolha manual de "principal" fixa — o mais barato manda por padrão; a saúde é o único motivo pra desviar disso.

## ⚠️ Regras obrigatórias
- Não tocar em: `.env`, auth, `client.ts`/`types.ts` do Supabase.
- Migração aditiva apenas (novas colunas/tabela) — nada de `DROP`/rename em colunas existentes.
- Toda a lógica de decidir saúde/prioridade vive no backend (`api/provider.js` + funções no banco), nunca confiar em cálculo feito só no frontend — evita um usuário manipular isso no client.
- Compra continua funcionando mesmo se o mecanismo de saúde falhar (fail-open: se não houver dado de saúde, trata como saudável).
- Sem refatorar nada fora do escopo (não mexer no popup de auto-cancelamento, no design da landing, etc.).

## O que fazer

**Fase 0 — Investigação (feita nesta conversa):** mapeado schema atual de `providers`/`service_offers`, fluxo de sync e de seleção de oferta.

**Fase 1 — Banco de dados (migração nova, ex. `26_provider_auto_management.sql`)**
- `providers`: adicionar `health_status text DEFAULT 'healthy'` (`healthy` | `unstable`), `consecutive_failures int DEFAULT 0`, `last_failure_at timestamptz`, `last_success_at timestamptz`, `auto_markup_percent numeric DEFAULT 100` (100% = preço x2, igual ao comportamento atual).
- Função `public.record_provider_result(p_provider_id uuid, p_success boolean, p_error_code text)` (SECURITY DEFINER, chamada só pelo backend com service role):
  - Sucesso → zera `consecutive_failures`, atualiza `last_success_at`, se estava `unstable` volta pra `healthy`.
  - Falha (só para erros classificados como "culpa do fornecedor": `LIMITED_ACTIVATIONS`, `NO_NUMBERS`, `NO_BALANCE`, timeout/erro de rede) → incrementa `consecutive_failures`, atualiza `last_failure_at`; se `consecutive_failures >= 3` num intervalo de 5 min → seta `health_status = 'unstable'`.
  - Erros que são culpa do usuário (`Insufficient balance`, `Unauthorized`) **não contam** pra saúde do fornecedor.

**Fase 2 — Backend (`api/provider.js`)**
- Em `buyNumber`, envolver a chamada ao `adapter.buyNumber` com try/catch que chama `record_provider_result` (sucesso ou falha) via `adminSupabase`, sem bloquear a resposta ao usuário em caso de erro nessa chamada auxiliar.
- Novo action `listProviderHealth` (admin-only) pra expor status atual no painel admin.

**Fase 3 — Seleção automática de oferta (`numberProviderService.getAvailableServices`)**
- Trocar o sort atual (`is_default` → menor preço) por: **fornecedores saudáveis primeiro** (agrupando por `provider.health_status`), depois menor `sale_price` dentro de cada grupo. `is_default` deixa de ser a fonte de verdade; vira só um "preferido manual" que o admin pode setar mas que perde pra saúde.
- No `Servicos.jsx`, adicionar uma tag visual "Recomendado" na primeira oferta do resultado ordenado, e uma tag discreta "Instável no momento" nas ofertas de fornecedores com `health_status = 'unstable'` (continuam compráveis, só não são a recomendação default).

**Fase 4 — Auto-pricing na sincronização (`AdminProviders.jsx` + `handleSyncServices`)**
- Trocar `active: false` (linha 145 atual) por `active: true` no insert de novas ofertas.
- Markup vira `cost_price * (1 + provider.auto_markup_percent / 100)` em vez do `svc.price * 2` fixo, puxando o `auto_markup_percent` do fornecedor (editável na tela de admin, default 100%).

**Fase 5 — Admin UI**
- Em `AdminProviders.jsx`: mostrar coluna de status de saúde (badge verde "Saudável" / amarelo "Instável") por fornecedor, com `consecutive_failures` e `last_failure_at` visíveis; campo editável de `auto_markup_percent`; botão manual "Forçar saudável novamente" pra reset de emergência.

**Fase 6 — Validação**
- Testar: forçar 3 falhas simuladas de um fornecedor (mock/teste manual) → confirmar que ele vira `unstable` e o outro assume a recomendação mesmo mais caro → forçar sucesso → confirmar que volta a `healthy` e recupera prioridade se for mais barato.
- `npm run build` limpo.
- Confirmar que a compra continua funcionando normalmente mesmo se as tabelas novas estiverem vazias (fail-open).

## Critério de pronto
- [ ] Migração aplicada em produção (aditiva, sem quebrar dado existente)
- [ ] Sync de fornecedor ativa ofertas automaticamente com markup automático
- [ ] Fornecedor com falhas seguidas é marcado instável e perde a recomendação, mesmo sendo mais barato
- [ ] Fornecedor recupera prioridade automaticamente ao voltar a funcionar, se for o mais barato
- [ ] Nenhuma trava do fluxo de compra existente foi alterada/quebrada
- [ ] Testado: painel admin mostra status de saúde; painel do usuário mostra "Recomendado"/"Instável"
