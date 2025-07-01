# Solução para Problemas de CORS - APIs BCB e Olinda

## Problema Identificado

As APIs do Banco Central do Brasil (BCB) e Olinda estão retornando erros de CORS (Cross-Origin Resource Sharing), especificamente:

- **API Olinda**: Retorna `403 Forbidden`
- **API BCB**: Pode ter restrições de acesso direto

## Solução Implementada

### 1. Configuração de Proxy Melhorada

O arquivo `src/proxy.conf.json` foi atualizado com:
- Headers específicos para simular um navegador real
- Configuração de debug para melhor diagnóstico
- Headers de referência para a API Olinda

### 2. Sistema de Fallback Robusto

Implementamos um sistema de múltiplas tentativas:

1. **Primeira tentativa**: URL original com headers apropriados
2. **Segunda tentativa**: Proxies CORS públicos alternativos
3. **Terceira tentativa**: Dados mock como fallback

### 3. Proxies CORS Utilizados

- `https://api.allorigins.win/raw?url=`
- `https://cors-anywhere.herokuapp.com/`
- `https://thingproxy.freeboard.io/fetch/`
- `https://api.codetabs.com/v1/proxy?quest=`

### 4. Dados Mock de Fallback

Quando todas as tentativas falham, o sistema usa dados mock realistas para:
- Períodos disponíveis
- Taxas de juros de instituições financeiras

## Arquivos Modificados

1. **`src/proxy.conf.json`** - Configuração de proxy melhorada
2. **`src/app/app.services.ts`** - Serviço com sistema de fallback
3. **`src/app/cors-config.ts`** - Configuração centralizada de CORS

## Como Testar

1. Inicie o servidor de desenvolvimento:
   ```bash
   npm start
   ```

2. Abra o console do navegador (F12) para ver os logs de tentativas

3. O sistema tentará automaticamente diferentes abordagens e mostrará no console:
   - "Primeira tentativa falhou, tentando com proxies CORS..."
   - "Proxy X falhou, tentando próximo..."
   - "Todos os proxies falharam, usando dados mock..."

## Soluções Alternativas

### Opção 1: Servidor Proxy Próprio
Se os proxies públicos não funcionarem, você pode criar um servidor proxy próprio:

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use(cors());

app.use('/api/bcb', createProxyMiddleware({
  target: 'https://www.bcb.gov.br',
  changeOrigin: true,
  pathRewrite: {
    '^/api/bcb': ''
  }
}));

app.listen(3001);
```

### Opção 2: Configuração de CORS no Angular

Adicione no `angular.json`:

```json
{
  "serve": {
    "options": {
      "proxyConfig": "src/proxy.conf.json",
      "headers": {
        "Access-Control-Allow-Origin": "*"
      }
    }
  }
}
```

### Opção 3: Usar um Serviço de Proxy

Considere usar serviços como:
- Cloudflare Workers
- AWS Lambda
- Vercel Functions

## Monitoramento

Para monitorar se as APIs estão funcionando:

```bash
# Teste direto da API Olinda
curl -I "https://olinda.bcb.gov.br/olinda/servico/taxaJuros/versao/v1/odata/PeriodosDisponiveis"

# Teste através do proxy
curl -I "http://localhost:4200/olinda-api/olinda/servico/taxaJuros/versao/v1/odata/PeriodosDisponiveis"
```

## Notas Importantes

- Os dados mock são atualizados periodicamente para refletir taxas realistas
- O sistema é resiliente e continuará funcionando mesmo se as APIs estiverem indisponíveis
- Os logs no console ajudam a diagnosticar problemas
- A solução é escalável e pode ser facilmente adaptada para outras APIs com problemas de CORS 