# Frontend Proxy

Servidor proxy Fastify que unifica o frontend e backend em uma única origem, eliminando problemas de CORS e habilitando cookies httpOnly seguros.

## Arquitetura

```
Browser (localhost:4200)
       ↓
┌──────────────────┐
│  Proxy (Fastify) │
│   Port 4200      │
└──────────────────┘
   ├─ /api/* → Backend :3000 (Better Auth)
   ├─ /rpc/* → Backend :3000 (oRPC)
   └─ /*     → Frontend :3001 (Vite dev) ou /dist (prod)
```

## Por Que Um Proxy?

### Problema
- Frontend em `localhost:3001`
- Backend em `localhost:3000`
- Origens diferentes = CORS
- CORS impede cookies httpOnly seguros

### Solução
- Proxy em `localhost:4200`
- Frontend e backend na mesma origem
- Sem CORS, cookies httpOnly funcionam
- Melhor segurança

## Estrutura

```
apps/proxy/
├── src/
│   ├── app.ts           # Configuração Fastify e rotas do proxy
│   ├── index.ts         # Entry point
│   └── config/
│       └── env.ts       # Validação de variáveis com envalid
├── package.json         # Scripts com dotenv-cli
├── tsconfig.json        # Config TypeScript
└── README.md            # Este arquivo
```

## Scripts

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsdown",
    "start": "node dist/index.mjs"
  }
}
```

### Desenvolvimento
```bash
pnpm dev
```

Inicia o proxy em watch mode. Carrega variáveis do `.env` local usando `dotenv/config`.

### Build
```bash
pnpm build
```

Compila TypeScript para JavaScript otimizado em `dist/`.

### Produção
```bash
pnpm start
```

Executa o servidor compilado.

## Variáveis de Ambiente

Crie um arquivo `.env` em `apps/proxy/` (copie de `.env.example`):

```env
# Proxy
HTTP_HOST=0.0.0.0
HTTP_PORT=4200

# Targets
BACKEND_URL=http://localhost:3000
VITE_URL=http://localhost:3001  # Apenas em dev

# Environment
NODE_ENV=development
```

### Validação com Envalid

O arquivo `src/config/env.ts` carrega o `.env` local e valida as variáveis usando `envalid`:

```typescript
import "dotenv/config"; // Carrega .env local
import * as envalid from "envalid";

export const env = envalid.cleanEnv(process.env, {
  HTTP_HOST: envalid.str({
    desc: "HTTP server host",
    default: "0.0.0.0",
  }),
  HTTP_PORT: envalid.port({
    desc: "HTTP server port",
    devDefault: 4200,
    default: 8080,
  }),
  BACKEND_URL: envalid.url({
    desc: "Backend API URL",
    devDefault: "http://localhost:3000",
  }),
  VITE_URL: envalid.url({
    desc: "Vite dev server URL",
    devDefault: "http://localhost:3001",
    default: undefined,
  }),
  NODE_ENV: envalid.str({
    choices: ["development", "production", "test"],
    default: "development",
  }),
});
```

## Rotas

### `/api/*`
Encaminha para o backend (Better Auth).

**Exemplo**: `GET http://localhost:4200/api/auth/get-session`  
→ Proxy para `http://localhost:3000/api/auth/get-session`

### `/rpc/*`
Encaminha para o backend (oRPC).

**Exemplo**: `POST http://localhost:4200/rpc/client.list`  
→ Proxy para `http://localhost:3000/rpc/client.list`

### `/*` (Desenvolvimento)
Encaminha para o Vite dev server com suporte a HMR.

**Exemplo**: `GET http://localhost:4200/`  
→ Proxy para `http://localhost:3001/`

WebSocket para HMR: `ws://localhost:4200/__vite_hmr`  
→ Proxy para `ws://localhost:3001/__vite_hmr`

### `/*` (Produção)
Serve arquivos estáticos do `dist/` com fallback para SPA.

**Exemplo**: `GET http://localhost:4200/clients`  
→ Serve `dist/index.html` (client-side routing)

## Desenvolvimento

### Configuração Fastify

```typescript
const app = fastify({
  bodyLimit: 128 * 1024 * 1024,     // 128MB
  genReqId: (req) => /* ... */,      // Request ID tracking
  disableRequestLogging: true,       // Custom logging
  logger: {
    level: isDev ? "info" : "warn",
    transport: isDev ? {
      target: "pino-pretty",          // Pretty logs em dev
      options: {
        colorize: true,
        ignore: "pid,hostname",
        translateTime: "HH:MM:ss",
      },
    } : undefined,
  },
  serverFactory: devServerFactory(), // Custom factory para @vite URLs
});
```

### Dev Server Factory

Em desenvolvimento, URLs com `@` (módulos Vite) são encaminhadas diretamente para o Vite, bypassando o Fastify:

```typescript
const devServerFactory = () => {
  if (!isDev) return undefined;
  
  return (handler) => {
    return http.createServer((req, res) => {
      if (req.url?.includes("@")) {
        // Proxy direto para Vite
        const viteUrl = new URL(req.url, env.VITE_URL);
        const proxyReq = http.request(viteUrl, ...);
        // ...
      }
      handler(req, res); // Fastify para outras rotas
    });
  };
};
```

Isso é crítico para a resolução de módulos e HMR do Vite funcionar corretamente.

## Produção

### Build da Aplicação

1. Build do frontend:
```bash
cd apps/web
pnpm build
# Gera dist/
```

2. Copiar `dist/` para `apps/proxy/static/`:
```bash
cp -r apps/web/dist apps/proxy/static
```

3. Build do proxy:
```bash
cd apps/proxy
pnpm build
# Gera dist/index.mjs
```

4. Iniciar:
```bash
pnpm start
```

### Configuração Produção

Em produção, o proxy:
- Serve arquivos estáticos de `static/`
- Fallback para `index.html` em rotas não encontradas (SPA)
- Não encaminha para Vite (não existe em prod)

## Logging

### Desenvolvimento
Logs bonitos com `pino-pretty`:

```
[10:23:45] INFO: DEV MODE: Proxying to Vite at http://localhost:3001
[10:23:45] INFO: Proxy server running at http://0.0.0.0:4200
[10:23:45] INFO: Backend: http://localhost:3000
[10:23:45] INFO: Frontend: http://localhost:3001
[10:23:47] INFO: GET /api/auth/get-session 200 (12ms)
```

### Produção
Logs JSON estruturados:

```json
{"level":30,"time":1234567890,"msg":"PROD MODE: Serving static files from ./static"}
{"level":30,"time":1234567891,"msg":"Proxy server running at http://0.0.0.0:8080"}
```

## Troubleshooting

### Porta 4200 em uso

**Erro**: `EADDRINUSE: address already in use 0.0.0.0:4200`

**Solução**:
```bash
lsof -ti:4200 | xargs kill -9
```

### Variáveis não carregadas

**Erro**: `Missing environment variables: BACKEND_URL`

**Solução**: Criar arquivo `.env` local:
```bash
cp apps/proxy/.env.example apps/proxy/.env
```

### Vite não acessível

**Erro**: `ECONNREFUSED connecting to localhost:3001`

**Solução**: Iniciar o Vite primeiro:
```bash
cd apps/web
pnpm dev
```

Ou usar o script combinado:
```bash
# Na raiz
pnpm dev:proxy
```

## Inspiração

Este proxy foi inspirado pelo projeto `workflow-engine` e adaptado para:
- Better Auth em vez de custom auth
- oRPC em vez de REST
- Estrutura de monorepo com pnpm

## Estrutura de Variáveis de Ambiente

```
apps/
├── proxy/
│   ├── .env          # Variáveis do proxy (PORT, BACKEND_URL, VITE_URL)
│   └── .env.example  # Template
├── server/
│   ├── .env          # Variáveis do servidor (DATABASE_URL, AUTH, CORS)
│   └── .env.example  # Template
└── web/
    ├── .env          # Variáveis do frontend (VITE_SERVER_URL)
    └── .env.example  # Template
```

Cada aplicação tem suas próprias variáveis locais, independentes.

## Referências

- [Fastify HTTP Proxy](https://github.com/fastify/fastify-http-proxy)
- [Fastify Static](https://github.com/fastify/fastify-static)
- [dotenv](https://github.com/motdotla/dotenv)
- [envalid](https://github.com/af/envalid)
- [Vite Proxy Configuration](https://vitejs.dev/config/server-options.html#server-proxy)
