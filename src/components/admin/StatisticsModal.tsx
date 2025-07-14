import React from 'react';
import { X, TrendingUp, DollarSign, Package, Users, Award } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { formatCurrency } from '../../utils/helpers';

interface StatisticsModalProps {
  type: 'requests' | 'costs';
  onClose: () => void;
}

export default function StatisticsModal({ type, onClose }: StatisticsModalProps) {
  const { state } = useApp();
  
  const currentCompany = state.currentCompany;
  const companyRequests = state.loyaltyRequests.filter(r => r.companyId === currentCompany?.id);
  const companyPointsConfig = state.pointsConfigs.find(pc => pc.companyId === currentCompany?.id) || { reaisPerPoint: 10, companyId: currentCompany?.id || '' };

  // Estatísticas de solicitações
  const totalRequests = companyRequests.length;
  const pendingRequests = companyRequests.filter(r => r.status === 'pending').length;
  const approvedRequests = companyRequests.filter(r => r.status === 'approved' || r.status === 'available_for_pickup' || r.status === 'completed').length;
  const rejectedRequests = companyRequests.filter(r => r.status === 'rejected').length;
  const completedRequests = companyRequests.filter(r => r.status === 'completed').length;

  // Estatísticas de custos
  const approvedRequestsData = companyRequests.filter(r => 
    r.status === 'approved' || r.status === 'available_for_pickup' || r.status === 'completed'
  );
  const totalPointsUsed = approvedRequestsData.reduce((sum, r) => sum + r.pointsUsed, 0);
  const totalCostInReais = totalPointsUsed * (companyPointsConfig.reaisPerPoint / 100); // Assumindo 1 ponto = 1% do valor configurado

  // Estatísticas por produto
  const productStats = approvedRequestsData.reduce((acc, request) => {
    const productName = request.productName;
    if (!acc[productName]) {
      acc[productName] = {
        count: 0,
        totalPoints: 0,
      };
    }
    acc[productName].count++;
    acc[productName].totalPoints += request.pointsUsed;
    return acc;
  }, {} as Record<string, { count: number; totalPoints: number }>);

  const sortedProducts = Object.entries(productStats)
    .sort(([,a], [,b]) => b.count - a.count)
    .slice(0, 5);

  // Estatísticas por mês
  const monthlyStats = approvedRequestsData.reduce((acc, request) => {
    const month = new Date(request.requestDate).toLocaleDateString('pt-BR', { 
      year: 'numeric', 
      month: 'long' 
    });
    if (!acc[month]) {
      acc[month] = {
        count: 0,
        totalPoints: 0,
      };
    }
    acc[month].count++;
    acc[month].totalPoints += request.pointsUsed;
    return acc;
  }, {} as Record<string, { count: number; totalPoints: number }>);

  const sortedMonths = Object.entries(monthlyStats)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .slice(-6); // Últimos 6 meses

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {type === 'requests' ? 'Estatísticas de Solicitações' : 'Custo das Solicitações'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {type === 'requests' ? (
            <div className="space-y-6">
              {/* Cards de Resumo */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total</p>
                      <p className="text-2xl font-bold text-blue-900">{totalRequests}</p>
                    </div>
                    <Package className="w-8 h-8 text-blue-500" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600">Pendentes</p>
                      <p className="text-2xl font-bold text-yellow-900">{pendingRequests}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Aprovadas</p>
                      <p className="text-2xl font-bold text-green-900">{approvedRequests}</p>
                    </div>
                    <Award className="w-8 h-8 text-green-500" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600">Rejeitadas</p>
                      <p className="text-2xl font-bold text-red-900">{rejectedRequests}</p>
                    </div>
                    <X className="w-8 h-8 text-red-500" />
                  </div>
                </div>
              </div>

              {/* Produtos Mais Solicitados */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Produtos Mais Solicitados</h3>
                <div className="space-y-3">
                  {sortedProducts.length > 0 ? sortedProducts.map(([productName, stats], index) => (
                    <div key={productName} className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                        </div>
                        <span className="font-medium text-gray-900">{productName}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{stats.count} solicitações</div>
                        <div className="text-xs text-gray-500">{stats.totalPoints} pontos</div>
                      </div>
                    </div>
                  )) : (
                    <p className="text-gray-500 text-center py-4">Nenhuma solicitação aprovada ainda</p>
                  )}
                </div>
              </div>

              {/* Evolução Mensal */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Evolução Mensal</h3>
                <div className="space-y-3">
                  {sortedMonths.length > 0 ? sortedMonths.map(([month, stats]) => (
                    <div key={month} className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <span className="font-medium text-gray-900">{month}</span>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{stats.count} solicitações</div>
                        <div className="text-xs text-gray-500">{stats.totalPoints} pontos</div>
                      </div>
                    </div>
                  )) : (
                    <p className="text-gray-500 text-center py-4">Nenhum dado mensal disponível</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Cards de Custo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Total de Pontos</p>
                      <p className="text-2xl font-bold text-purple-900">{totalPointsUsed.toLocaleString()}</p>
                    </div>
                    <Award className="w-8 h-8 text-purple-500" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Custo Estimado</p>
                      <p className="text-2xl font-bold text-green-900">{formatCurrency(totalCostInReais)}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-500" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Média por Solicitação</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {approvedRequests > 0 ? Math.round(totalPointsUsed / approvedRequests) : 0}
                      </p>
                      <p className="text-xs text-blue-600">pontos</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
              </div>

              {/* Configuração de Pontos */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-2">Configuração Atual</h3>
                <p className="text-sm text-blue-700">
                  Cada R$ {companyPointsConfig.reaisPerPoint.toFixed(2)} gastos = 1 ponto
                </p>
                <p className="text-sm text-blue-700">
                  Valor estimado por ponto: R$ {(companyPointsConfig.reaisPerPoint / 100).toFixed(2)}
                </p>
              </div>

              {/* Custo por Produto */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Custo por Produto</h3>
                <div className="space-y-3">
                  {sortedProducts.length > 0 ? sortedProducts.map(([productName, stats]) => {
                    const productCost = stats.totalPoints * (companyPointsConfig.reaisPerPoint / 100);
                    return (
                      <div key={productName} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div>
                          <span className="font-medium text-gray-900">{productName}</span>
                          <div className="text-xs text-gray-500">{stats.count} solicitações</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">{formatCurrency(productCost)}</div>
                          <div className="text-xs text-gray-500">{stats.totalPoints} pontos</div>
                        </div>
                      </div>
                    );
                  }) : (
                    <p className="text-gray-500 text-center py-4">Nenhuma solicitação aprovada ainda</p>
                  )}
                </div>
              </div>

              {/* Custo Mensal */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Custo Mensal</h3>
                <div className="space-y-3">
                  {sortedMonths.length > 0 ? sortedMonths.map(([month, stats]) => {
                    const monthlyCost = stats.totalPoints * (companyPointsConfig.reaisPerPoint / 100);
                    return (
                      <div key={month} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <span className="font-medium text-gray-900">{month}</span>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">{formatCurrency(monthlyCost)}</div>
                          <div className="text-xs text-gray-500">{stats.totalPoints} pontos</div>
                        </div>
                      </div>
                    );
                  }) : (
                    <p className="text-gray-500 text-center py-4">Nenhum dado mensal disponível</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}