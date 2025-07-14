#!/bin/bash

# Fideliza.AI - Script de Deploy para Produção
echo "🚀 Iniciando deploy do Fideliza.AI..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    error "package.json não encontrado. Execute este script no diretório do projeto."
    exit 1
fi

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    error "Node.js não está instalado. Por favor, instale o Node.js primeiro."
    exit 1
fi

# Verificar versão do Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    error "Node.js versão 16 ou superior é necessária. Versão atual: $(node -v)"
    exit 1
fi

log "Node.js versão: $(node -v) ✓"

# Verificar se a porta 3000 está em uso
if netstat -tlnp | grep -q ":3000 "; then
    warning "Porta 3000 está em uso. Tentando parar processos existentes..."
    
    # Parar PM2 se estiver rodando
    if command -v pm2 &> /dev/null; then
        pm2 stop fideliza-ai 2>/dev/null || true
        pm2 delete fideliza-ai 2>/dev/null || true
    fi
    
    # Matar processos na porta 3000
    sudo fuser -k 3000/tcp 2>/dev/null || true
    sleep 2
    
    if netstat -tlnp | grep -q ":3000 "; then
        error "Não foi possível liberar a porta 3000. Verifique manualmente."
        exit 1
    fi
    
    log "Porta 3000 liberada ✓"
fi

# Criar diretório de logs se não existir
mkdir -p logs

# Instalar dependências
log "📦 Instalando dependências..."
if npm install; then
    log "Dependências instaladas com sucesso ✓"
else
    error "Falha ao instalar dependências"
    exit 1
fi

# Build da aplicação
log "🔨 Compilando aplicação..."
if npm run build; then
    log "Build concluído com sucesso ✓"
else
    error "Falha no build da aplicação"
    exit 1
fi

# Verificar se o diretório dist foi criado
if [ ! -d "dist" ]; then
    error "Diretório 'dist' não foi criado. Verifique o processo de build."
    exit 1
fi

# Verificar se index.html existe
if [ ! -f "dist/index.html" ]; then
    error "Arquivo 'dist/index.html' não foi criado. Verifique o processo de build."
    exit 1
fi

log "📁 Arquivos estáticos gerados em ./dist/ ✓"

# Verificar se PM2 está instalado globalmente
if command -v pm2 &> /dev/null; then
    info "PM2 detectado. Usando PM2 para gerenciamento de processo..."
    
    # Iniciar com PM2
    if pm2 start ecosystem.config.cjs --env production; then
        log "Aplicação iniciada com PM2 ✓"
        pm2 save
        
        # Aguardar um momento para o servidor inicializar
        sleep 5
        
        # Verificar se está rodando
        if pm2 list | grep -q "fideliza-ai.*online"; then
            log "✅ Aplicação está rodando com PM2!"
        else
            error "❌ Aplicação não está rodando. Verificando logs..."
            pm2 logs fideliza-ai --lines 10
            exit 1
        fi
        
        info "Para ver logs: pm2 logs fideliza-ai"
        info "Para parar: pm2 stop fideliza-ai"
        info "Para reiniciar: pm2 restart fideliza-ai"
    else
        error "Falha ao iniciar com PM2"
        exit 1
    fi
else
    warning "PM2 não encontrado. Iniciando servidor diretamente..."
    info "Para instalar PM2 globalmente: npm install -g pm2"
    
    # Parar servidor existente se estiver rodando
    if [ -f "server.pid" ]; then
        OLD_PID=$(cat server.pid)
        if kill -0 $OLD_PID 2>/dev/null; then
            log "Parando servidor existente (PID: $OLD_PID)..."
            kill $OLD_PID
            sleep 2
        fi
        rm -f server.pid
    fi
    
    # Iniciar servidor diretamente
    log "🌐 Iniciando servidor na porta 3000..."
    nohup node server.cjs > logs/server.log 2>&1 &
    SERVER_PID=$!
    
    # Aguardar um momento para verificar se o servidor iniciou
    sleep 5
    
    if kill -0 $SERVER_PID 2>/dev/null; then
        log "Servidor iniciado com sucesso! PID: $SERVER_PID ✓"
        echo $SERVER_PID > server.pid
        info "Para parar o servidor: kill $SERVER_PID"
    else
        error "Falha ao iniciar o servidor. Verificando logs..."
        tail -20 logs/server.log
        exit 1
    fi
fi

log "✅ Deploy concluído com sucesso!"
echo ""

# Aguardar mais um pouco para garantir que o servidor está pronto
sleep 3

# Verificar se o servidor está respondendo
echo "🔍 Testando conectividade do servidor..."

# Teste 1: Health check
if curl -s -f http://127.0.0.1:3000/health > /dev/null; then
    log "✅ Health check passou!"
else
    warning "⚠️  Health check falhou"
fi

# Teste 2: API test
if curl -s -f http://127.0.0.1:3000/api/test > /dev/null; then
    log "✅ API test passou!"
else
    warning "⚠️  API test falhou"
fi

# Teste 3: Página principal
if curl -s -f http://127.0.0.1:3000 > /dev/null; then
    log "✅ Página principal carregou!"
else
    warning "⚠️  Página principal não carregou"
fi

echo ""
echo "🌐 URLs de acesso:"
echo "   • Local: http://127.0.0.1:3000"
echo "   • Health: http://127.0.0.1:3000/health"
echo "   • API Test: http://127.0.0.1:3000/api/test"
echo "   • Produção: https://fidelidade.onsolutions.app"
echo ""
echo "🔧 Comandos úteis:"
if command -v pm2 &> /dev/null; then
    echo "   • Ver logs: pm2 logs fideliza-ai"
    echo "   • Status: pm2 status"
    echo "   • Reiniciar: pm2 restart fideliza-ai"
    echo "   • Parar: pm2 stop fideliza-ai"
else
    echo "   • Ver logs: tail -f logs/server.log"
    echo "   • Parar: kill \$(cat server.pid)"
fi
echo "   • Redeploy: ./deploy.sh"
echo ""

# Mostrar status final
echo "📋 Status do Deploy:"
echo "   ✅ Dependências instaladas"
echo "   ✅ Aplicação compilada"
echo "   ✅ Servidor iniciado na porta 3000"
echo "   ✅ Pronto para acesso via Nginx"
echo ""

# Mostrar informações do sistema
echo "📊 Informações do Sistema:"
echo "   • Node.js: $(node -v)"
echo "   • NPM: $(npm -v)"
echo "   • Diretório: $(pwd)"
echo "   • Usuário: $(whoami)"
echo "   • Data: $(date)"
echo ""

echo "🎯 Próximos passos:"
echo "   1. Acesse: https://fidelidade.onsolutions.app"
echo "   2. Teste localmente: http://127.0.0.1:3000"
echo "   3. Configure Supabase (opcional)"
echo "   4. Monitore logs conforme comandos acima"