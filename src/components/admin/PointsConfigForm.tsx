import React, { useState } from 'react';
import { X, DollarSign } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';

interface PointsConfigFormProps {
  onClose: () => void;
}

export default function PointsConfigForm({ onClose }: PointsConfigFormProps) {
  const { state, dispatch } = useApp();
  const currentCompanyId = state.currentCompany?.id;
  const existingConfig = state.pointsConfigs.find(
    pc => pc.companyId === currentCompanyId
  );
  // Inicializa com valor do state ou default 10
  const [reaisPerPoint, setReaisPerPoint] = useState(
    existingConfig?.reaisPerPoint ?? 10
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!currentCompanyId) {
      setError('Nenhuma empresa selecionada.');
      return;
    }
    if (reaisPerPoint <= 0) {
      setError('O valor deve ser maior que zero.');
      return;
    }

    setLoading(true);
    // Persiste no Supabase (upsert)
    const { data, error: upsertError } = await supabase
      .from('points_config')
      .upsert({
        company_id:      currentCompanyId,
        reais_per_point: reaisPerPoint,
      })
      .select('*')
      .single();

    setLoading(false);
    if (upsertError || !data) {
      console.error('Erro ao salvar configuração:', upsertError);
      setError('Não foi possível salvar a configuração.');
      return;
    }

    // Atualiza o contexto global
    dispatch({
      type: 'UPDATE_POINTS_CONFIG',
      payload: {
        companyId:    data.company_id,
        reaisPerPoint: data.reais_per_point,
      },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Configuração de Pontos</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reais por Ponto
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="number"
                value={reaisPerPoint}
                onChange={e => setReaisPerPoint(Number(e.target.value))}
                min="0.01"
                step="0.01"
                disabled={loading}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="0.00"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Cada <strong>R$ {reaisPerPoint.toFixed(2)}</strong> gastos = <strong>1 ponto</strong>
            </p>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h3 className="font-medium text-indigo-800 mb-2">Exemplo de Pontuação</h3>
            <p className="text-sm text-indigo-700">
              Com R$ {reaisPerPoint.toFixed(2)} por ponto:
            </p>
            <ul className="text-sm text-indigo-700 mt-2 space-y-1 list-disc list-inside">
              <li>Compra de R$ {(reaisPerPoint * 10).toFixed(2)} = 10 pontos</li>
              <li>Compra de R$ {(reaisPerPoint * 50).toFixed(2)} = 50 pontos</li>
              <li>Compra de R$ {(reaisPerPoint * 100).toFixed(2)} = 100 pontos</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition-all transform hover:scale-105"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
