# Fideliza.AI - Plataforma de Fidelidade

Sistema completo de gestão de programas de fidelidade com múltiplas empresas.

## 🚀 Deploy para Produção

### Instalação Rápida

```bash
# Navegue para o diretório
cd /home/htdocs/fidelidade.onsolutions.app

# Dê permissões de execução
chmod +x deploy.sh
chmod +x start.sh

# Execute o deploy
./deploy.sh
```

### 🔧 Configuração do Servidor

A aplicação roda na **porta 3000** conforme configuração do seu servidor.

Seu Nginx já está configurado corretamente:

```nginx
location / {
    proxy_pass http://127.0.0.1:{{app_port}}/;  # Porta 3000
    proxy_http_version 1.1;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Server $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Host $host;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
}
```

### 📊 Gerenciamento com PM2

```bash
# Ver status
pm2 status

# Ver logs
pm2 logs fideliza-ai

# Reiniciar
pm2 restart fideliza-ai

# Parar
pm2 stop fideliza-ai

# Monitoramento
pm2 monit
```

### 🔧 Scripts NPM Disponíveis

```bash
# Deploy completo
npm run deploy

# Apenas iniciar servidor
npm run start

# Parar aplicação
npm run stop

# Reiniciar aplicação
npm run restart

# Ver logs
npm run logs
```

## 🌐 URLs de Acesso

- **Local:** http://127.0.0.1:3000
- **Produção:** https://fidelidade.onsolutions.app

## 🔧 Configuração do Supabase (Opcional)

1. Crie um projeto no [Supabase](https://supabase.com)
2. Copie o arquivo `.env.example` para `.env`
3. Configure as variáveis:
   ```
   VITE_SUPABASE_URL=sua_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima
   ```

## 📋 Funcionalidades

### Super Admin
- Gerenciamento de empresas e planos
- Analytics da plataforma
- Status de conexão com Supabase

### Admin da Empresa
- Gestão de clientes com data de nascimento
- Notificações de aniversários
- Aba dedicada para aniversários próximos
- Gestão de produtos e vendas
- Sistema de pontos configurável
- Configuração de webhooks

### Cliente
- Visualização de pontos em múltiplas empresas
- Histórico de transações
- Catálogo de produtos para resgate
- Sistema de solicitações

## 🎂 Sistema de Aniversários

- Notificações automáticas de aniversários do dia
- Alertas para aniversários da próxima semana
- Aba dedicada com lista de aniversários próximos (30 dias)
- Ordenação por proximidade da data

## 🔗 Sistema de Webhooks

- Webhooks para compras
- Webhooks para solicitações aprovadas
- Webhooks para aniversários
- Teste de webhooks integrado

## 🏗️ Estrutura do Projeto

```
src/
├── components/          # Componentes React
├── contexts/           # Context API
├── lib/               # Configurações (Supabase)
├── types/             # TypeScript types
└── utils/             # Funções utilitárias
```

## 🔍 Logs e Monitoramento

```bash
# Logs da aplicação (PM2)
pm2 logs fideliza-ai

# Logs do servidor (direto)
tail -f logs/server.log

# Logs combinados
tail -f logs/combined.log

# Logs de erro
tail -f logs/err.log
```

## 🚀 Estrutura de Deploy

```
projeto/
├── dist/              # Arquivos compilados (estáticos)
├── server.js          # Servidor Express para produção
├── ecosystem.config.js # Configuração PM2
├── deploy.sh          # Script de deploy automatizado
├── start.sh           # Script de inicialização rápida
├── logs/              # Logs da aplicação
└── package.json       # Dependências e scripts
```

## 🔐 Credenciais de Teste

**Super Admin:**
- Usuário: `onsolutions`
- Senha: `33537095a`

## 🛠️ Tecnologias

- React + TypeScript
- Tailwind CSS
- Supabase (opcional)
- Vite
- Express.js
- PM2
- Lucide React (ícones)

## 🚨 Solução de Problemas

### Servidor não inicia
```bash
# Verificar se a porta 3000 está em uso
netstat -tlnp | grep 3000

# Matar processos na porta 3000
sudo fuser -k 3000/tcp

# Reiniciar deploy
./deploy.sh
```

### Logs não aparecem
```bash
# Criar diretório de logs
mkdir -p logs

# Verificar permissões
chmod 755 logs

# Reiniciar aplicação
npm run restart
```

### PM2 não funciona
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Ou usar sem PM2
node server.js
```