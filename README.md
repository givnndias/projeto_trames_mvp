# Trames — MVP

Mobilidade a pé inclusiva: o usuário escolhe origem, destino e prioridade e compara rotas com o IAR (Índice de Adequação da Rota).

## Executar a prévia
`bun install && bun run dev` → http://localhost:8080 (use o modo celular do navegador). Testes: `bunx vitest run`.

## Estrutura
- `src/lib/trames/` — camada de dados e regras, separada da interface:
  `data.ts` (locais, trechos, rotas, recursos, barreiras — SIMULADOS), `profiles.ts` (pesos), `recommend.ts` (cálculo), `traits.ts` (características), `store.tsx` (estado e preferências locais).
- `src/components/trames/` — mapa esquemático, controles, componentes visuais.
- `src/routes/` — telas: `/` (abertura + busca), `/prioridade`, `/rotas`, `/rota/$id`, `/percurso/$id`, `/mapa`, `/preferencias`.

## Regras do IAR
IAR = média ponderada dos indicadores (0–100, maior = melhor).
| Prioridade | Pesos |
|---|---|
| Acessibilidade | 60 acess., 15 orient., 10 conforto, 10 seg., 5 esforço (+ evita escadas automaticamente) |
| Segurança relativa | 65 seg., 10 orient., 10 acess., 10 conforto, 5 esforço |
| Orientação | 60 orient., 15 seg., 15 acess., 5 conforto, 5 esforço |
| Conforto | 60 conforto, 15 acess., 10 seg., 5 orient., 10 esforço |
| Menor esforço* | 60 esforço, 15 acess., 10 conforto, 10 rapidez, 5 orient. |
| Rapidez* | 70 rapidez, 10 esforço, 10 orient., 10 seg. |
| Equilibrado | 25 acess., 25 seg., 15 orient., 15 conforto, 10 esforço, 10 rapidez |

\* Hipóteses do protótipo, sujeitas a validação.

- Barreiras impeditivas (escadas com "Evitar escadas"; ladeiras com "Evitar ladeiras") são avaliadas **antes** da pontuação: a rota fica incompatível e nunca é recomendada.
- Indicador sem dados → IAR não calculado ("Dados insuficientes"); falta de dados não é tratada como ausência de barreira.
- Tempo = distância ÷ 75 m/min + 0,5 min por travessia com semáforo + 1 min por escadaria. Rapidez = 100 × menor tempo ÷ tempo da rota.

## Dados simulados
Região fictícia com 6 locais. Rotas cadastradas: Estação Central ↔ Biblioteca Municipal (Rotas A–D; A = 600 m com escada e calçada irregular; B = 850 m com rampas e boa calçada) e Praça da Matriz ↔ Mercado Municipal (2 rotas, ambas com escadas). Outras combinações mostram estado vazio.

## Implementado
Todas as telas e estados, recomendação, comparação com a rota mais curta, mapa esquemático interativo (zoom/centralizar), percurso simulado com avanço manual (sem GPS), áudio via síntese de voz do navegador (quando disponível), tamanho de texto, preferências locais.

## Dependências externas / não implementado
- Mapa cartográfico real (exigiria provedor e credenciais) — hoje é esquemático e identificado como demonstração.
- Localização real/GPS — não implementada; seleção manual.
- Dados urbanos reais e API.

## Adaptação com Capacitor (fora do Lovable)
1. Gerar build estático (configurar saída SPA/estática do TanStack Start) e apontar `webDir` para ela.
2. `npm i @capacitor/core @capacitor/cli && npx cap init Trames app.trames`.
3. `npm i @capacitor/android @capacitor/ios && npx cap add android && npx cap add ios`.
4. Plugins: `@capacitor/geolocation` (permissões `ACCESS_FINE_LOCATION` / `NSLocationWhenInUseUsageDescription`, pedidas só após toque), `@capacitor-community/text-to-speech` para áudio nativo, `@capacitor/splash-screen` e ícones (`@capacitor/assets`).
5. `npx cap sync` e abrir no Android Studio / Xcode; testar em aparelhos reais (leitores de tela TalkBack/VoiceOver, aumento de fonte, áreas seguras).
6. Distribuição: Google Play Console e App Store Connect (contas de desenvolvedor, políticas de privacidade, revisão).
