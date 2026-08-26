# PRD/PATCH — Landing Page Premium · v1.0

⚙️ EXECUÇÃO
Ferramenta:            Claude Code (esta sessão)
Modelo recomendado:    Sonnet
Motivo (1 linha):      Implementação padrão de UI/CSS/React, sem arquitetura nova nem lógica complexa.
Custo estimado:        médio

## Contexto
A landing (`src/pages/LandingPage.jsx`) já foi migrada pro tema light laranja/branco (`#FF6B00` + branco). Ela é composta por: `Header`, `Hero` (com um phone 3D via `@react-three/fiber`/`Phone3DScene.jsx` renderizando um mockup HTML da aba "Serviços" dentro do canvas WebGL), `HowItWorks`, `ServicesGrid` (bento grid), `FaqSection` (accordion), `TestimonialsSection`, `Footer`.

O Hero hoje carrega Three.js (`@react-three/fiber`, `@react-three/drei`, `three`) só para renderizar um celular girando com uma UI HTML embutida (`PhoneScreenUI` dentro de `Phone3DScene.jsx`) — isso é pesado (bundle + GPU) para o que é essencialmente uma imagem estática de mockup.

## Objetivo
1. Trocar o Hero 3D por uma imagem/mockup **estático** do celular mostrando a aba Serviços do painel (reaproveitando o visual já existente em `PhoneScreenUI`, mas como HTML/CSS puro — sem WebGL, sem three.js).
2. Dar um acabamento "premium, pronto pra produção" na landing inteira: hierarquia visual, micro-interações discretas (hover/scroll-reveal já existentes em `ServicesGrid`/`FaqSection`), espaçamento, contraste, prova social, consistência de bordas/sombras/gradientes no padrão laranja/branco.

## ⚠️ Regras obrigatórias
- Investigar antes de alterar (já feito — ver Contexto).
- Não tocar em: autenticação, Supabase, rotas do painel logado, `.env`.
- Não mexer no conteúdo/textos de serviços, preços ou FAQ — só na apresentação visual.
- Remover a dependência de Three.js **apenas do Hero da landing** (não mexer se `@react-three/fiber` for usada em outro lugar do projeto — checar antes de remover do `package.json`).
- Manter responsividade mobile (breakpoints já existentes em `Hero.css`).
- Sem novos arquivos de imagem externos — o "print" da aba Serviços é construído em HTML/CSS (mockup fiel, leve, nítido em qualquer resolução), não um PNG estático real.

## O que fazer
**Fase 0 — Auditoria:** confirmar se `@react-three/fiber`/`drei`/`three` são usados em outro componente fora do Hero (se não, remover do `package.json` no final).

**Fase 1 — Novo mockup estático do Hero:**
- Criar `src/components/ServicesPhoneMockup.jsx` + `.css`: um "print" em HTML/CSS do celular com a tela de Serviços (reaproveita a lista/estilo de `PhoneScreenUI`), com moldura de phone realista (notch, status bar, bordas), sombra premium e leve animação CSS (float/parallax sutil, sem JS de física) — leve, sem Three.js.
- Atualizar `Hero.jsx` para renderizar `ServicesPhoneMockup` no lugar do `<Canvas>`/`Phone3DScene`.
- Remover import de `@react-three/fiber` e `Phone3DScene` do Hero; deletar `Phone3DScene.jsx` se não for usado em outro lugar.
- Ajustar `Hero.css` (glow de fundo, alinhamento) para o novo mockup estático.

**Fase 2 — Polish "premium" no restante da landing:**
- Revisar `Header` (sombra sutil ao rolar, contraste do CTA).
- `Hero`: reforçar hierarquia (badge de confiança, prova social curta acima/abaixo do título, CTA com leve glow laranja).
- `HowItWorks`, `ServicesGrid`, `FaqSection`, `TestimonialsSection`, `Footer`: revisão de espaçamento, bordas, sombras e consistência de raio/gradiente — sem alterar textos/dados.
- Checar responsividade em mobile (375px) e desktop (1440px) via screenshot no navegador.

**Fase 3 — Validação:**
- Rodar `npm run build` para garantir que a remoção do Three.js não quebra o bundle.
- Screenshot final desktop + mobile pro Mathias aprovar antes de considerar "pronta pra ar".

## Critério de pronto
- [ ] Hero sem Three.js, com mockup estático leve da aba Serviços
- [ ] `npm run build` passa limpo
- [ ] Nenhum texto/preço/dado de serviço alterado
- [ ] Landing revisada e consistente em laranja/branco, com aparência "premium"
- [ ] Testado visualmente: desktop e mobile, dev server local
