#!/bin/bash

# Script de inicialização rápida
echo "🚀 Iniciando Fideliza.AI..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: package.json não encontrado. Execute este script no diretório do projeto."
    exit 1
fi

# Dar permissões de execução para deploy.sh
chmod +x deploy.sh

# Executar deploy
./deploy.sh

echo "✅ Aplicação iniciada com sucesso!"
echo "🌐 Acesse: https://fidelidade.onsolutions.app"