# Sistema Apta — Frontend

Frontend em Next.js (App Router) + MUI, consumindo a API do [apta-back](https://github.com/Codentec-hub/apta-back).

## Desenvolvimento

```bash
cp .env.example .env   # ajuste NEXT_PUBLIC_API_URL se necessário
npm install
npm run dev
```

Acesse http://localhost:3000. É necessário que o backend esteja rodando (ver o README do [apta-back](https://github.com/Codentec-hub/apta-back)).

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run start` — roda o build de produção
- `npm run typecheck` — checagem de tipos
- `npm run lint` — lint

## Estrutura

- `src/app` — rotas (App Router): `/login` e `/dashboard/*`
- `src/components/dashboard/layout` — sidebar, topbar e navegação
- `src/lib/auth/client.ts` — integração com `/auth/login` e `/auth/me` do backend
- `src/styles/theme` — tema MUI (cores, tipografia, componentes)
