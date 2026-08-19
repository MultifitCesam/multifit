
# MultiFit — Plano de Evolução

O escopo enviado é enorme (arquitetura, segurança, DB, progressão, nutrição, social, gamificação, push, Spotify, IA, mobile, performance, UX, QA). Fazer tudo em um único ciclo geraria regressões e um PR gigante impossível de revisar. Proponho **fases incrementais**, cada uma entregável, testável e sem quebrar o que já existe. Confirme quais fases quer que eu execute e em qual ordem.

## Princípio geral

- **Evoluir antes de duplicar**: aproveitar `Exercise.videoUrl`, `daily_stats`, `notifications`, Realtime, `StreakBadge`, `stories`, `sw.js`.
- Sem grande reorganização de pastas agora — refactor "feature-based" só depois que os fluxos estiverem fechados, para evitar mover arquivos e quebrar imports no meio do caminho.
- IA apenas onde agrega (foto de refeição, insights). Progressão de treino continua **baseada em regras**, como você pediu.

---

## Fase 1 — Fechar ciclo de Treino (progressão + vídeos)

Objetivo: transformar o gerador atual em ciclo fechado com histórico e progressão automática.

- Novas tabelas:
  - `workout_sessions` (data, plano, duração, notas)
  - `exercise_logs` (session, exercise_name, muscle_group, set_index, reps, weight_kg, rpe, rest_seconds, done)
  - `exercise_records` (user, exercise_name, best_1rm_estimado, best_volume, best_reps)
- UI: tela "Executar treino" com timer de descanso, input rápido de carga/reps por série, marcação de série concluída.
- Regras de progressão (sem IA), aplicadas ao gerar a próxima semana:
  - concluiu todas as séries no topo da faixa → +2.5kg (sup.) / +5kg (inf.)
  - concluiu na base → manter carga, subir reps
  - falhou 2 semanas seguidas → deload -10%
  - RPE ≥ 9 constante → manter
- `workout-generator.ts` passa a ler `exercise_logs` para calibrar a próxima sugestão.
- Player de vídeo demonstrativo: componente `ExerciseVideo` usando `videoUrl` do tipo `Exercise`, com fallback para thumbnail. Popular seed inicial com URLs públicas por grupo muscular.

## Fase 2 — Insights e Dashboard histórico

Objetivo: mostrar o dado que já é coletado.

- Página `DashboardPage` ganha abas Semana / Mês / Ano.
- Gráficos (Recharts, já instalado) para: passos, calorias, água, minutos ativos, peso, volume levantado (vem da Fase 1).
- Cards de recordes pessoais.
- Sem novas tabelas — consome `daily_stats`, `runs`, `exercise_logs`, `exercise_records`.

## Fase 3 — Nutrição: diário + hidratação

- Nova tabela `meal_logs` (user, day, meal_type, description, photo_url, calories, protein_g, carbs_g, fat_g, created_at).
- Edge Function `analyze-meal-photo`: recebe foto, chama Gemini via Lovable AI (multimodal), retorna estimativa de kcal/macros.
- Tela "Diário Alimentar" no `NutritionPage` (adiciona aba, não remove o plano atual).
- Lembretes de hidratação: notificação local via Capacitor Local Notifications a cada X horas configurado no perfil, incrementa `water_ml` com 1 toque.
- Registro rápido de peso diário → grava em `daily_stats` (nova coluna `weight_kg`) e alimenta gráfico da Fase 2.

## Fase 4 — Push Notifications (fechar sw.js)

- Nova tabela `push_subscriptions` (user, endpoint, p256dh, auth, platform).
- Web: hook `usePushSubscription` pede permissão, registra no SW, salva no Supabase.
- Mobile: `@capacitor/push-notifications` — registrar token FCM no mesmo `push_subscriptions` (coluna `fcm_token`).
- Edge Function `send-push` disparada por triggers existentes de `notifications` (like, comment, follow, message) via `pg_net` → envia web push (VAPID) e/ou FCM.
- Requer secrets: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `FCM_SERVER_KEY` (peço via `add_secret` no início da fase).
- Sincroniza com notificações in-app já existentes (mesma linha em `notifications`).

## Fase 5 — Gamificação (evolução do StreakBadge)

- Tabelas `achievements` (catálogo estático) e `user_achievements` (user, achievement_id, unlocked_at, progress).
- XP e nível no `profiles` (`xp int`, `level int`).
- Regras server-side (triggers) para desbloquear: primeiro treino, 7/30/100 dias de streak, 1ª corrida, 100 km, 1000 kg levantados, etc.
- UI: página "Conquistas" + toast animado quando desbloqueia.
- Desafios semanais entre mútuos-seguidores: `challenges` + `challenge_participants` (fase leve, ranking simples).

## Fase 6 — Social: reações em stories + feed de atividades

- `story_reactions` (story_id, user_id, emoji).
- Ampliar `posts` com `activity_type` (workout_completed, personal_record, run_completed) e helpers para publicar automaticamente ao fechar treino/corrida (opt-in em Configurações de Privacidade).
- Sem remover o feed atual.

## Fase 7 — Spotify

- OAuth Spotify (Authorization Code + PKCE). Requer `SPOTIFY_CLIENT_ID` (público, ok no código) e `SPOTIFY_CLIENT_SECRET` (secret).
- Tabelas `spotify_accounts` (tokens criptografados) e `workout_playlists` (user, workout_type, playlist_id).
- Player web via Spotify Web Playback SDK (só toca para usuários Premium — deixar claro na UI).
- Mobile: intent/deep link `spotify:` abre o app nativo.
- Aba "Minhas Playlists" em Configurações; auto-start ao iniciar treino.

## Fase 8 — Mobile hardening

- Capacitor: splash, status bar, deep links `multifit://`, ícones adaptativos.
- Offline: manter apenas leitura de treino do dia + fila de sync para `exercise_logs` e `meal_logs` (IndexedDB via `idb`). Sem SW agressivo em rotas Supabase (já está excluído).
- App Store readiness: policy pages, ícones, screenshots (guia).

## Fase 9 — Segurança & Roles

- Enum `app_role` com: `admin`, `gym`, `trainer`, `staff`, `student`.
- Tabela `user_roles` + função `has_role` (padrão do knowledge).
- Tabela `audit_logs` (actor, action, entity, entity_id, metadata, ip, ua).
- Trigger de auditoria em: login (via edge), alteração de perfil, alteração de treino, exclusões, ações admin.
- Revisão de RLS/Storage: rate limiting em edge functions sensíveis (chat, analyze-meal), headers CSP no `index.html`.
- Rodar scanner ao final e resolver findings.

## Fase 10 — Refactor arquitetural + QA

Só depois que os fluxos estão fechados:
- Reorganizar `src/` em `src/features/{workouts,nutrition,social,...}` com `components/`, `hooks/`, `services/`, `types.ts` por feature. `src/shared/` para UI genérica.
- Testes Vitest para regras de progressão, cálculos nutricionais, has_role.
- Docs curtas em `docs/` explicando decisões.

---

## Detalhes técnicos relevantes

- Todas as novas tabelas seguirão o padrão obrigatório: CREATE → GRANT (authenticated + service_role) → ENABLE RLS → POLICIES escopadas por `auth.uid()`.
- Nenhuma tabela existente será removida; alterações são aditivas (novas colunas nullable, novas policies).
- Edge functions novas usam JWT validation (padrão já adotado em `chat-fitness`).
- Push e Spotify pedem secrets — só peço quando iniciarmos a fase correspondente.
- Progressão de treino é 100% determinística (regras fisiológicas), sem chamada de IA.
- IA (Gemini via Lovable AI) usada só em: análise de foto de refeição, insights de evolução, sugestão de descanso.

---

## O que preciso de você

1. Confirma a **ordem** das fases? A ordem proposta (1→10) fecha primeiro os ciclos que você mesmo apontou como "meio prontos".
2. Quer que eu execute **uma fase por vez** (recomendado, cada fase = 1 entrega revisável) ou agrupar 2–3 fases pequenas?
3. Fase 7 (Spotify) exige criar um app no Spotify Developer Dashboard — você tem conta e topa criar quando chegarmos lá?
4. Alguma fase que quer **pular ou priorizar** (ex.: "quero push antes de nutrição")?

Assim que confirmar, começo pela Fase 1.
