import React, { useState } from 'react';
import { X, Webhook, Globe, MessageSquare, Gift, Calendar, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { WebhookConfig } from '../../types';

interface WebhookConfigModalProps {
  onClose: () => void;
}

export default function WebhookConfigModal({ onClose }: WebhookConfigModalProps) {
  const { state, dispatch } = useApp();
  
  const currentCompany = state.currentCompany;
  const existingConfig = state.webhookConfigs.find(wc => wc.companyId === currentCompany?.id);
  
  const [config, setConfig] = useState<WebhookConfig>(existingConfig || {
    companyId: currentCompany?.id || '',
    purchases: {
      enabled: false,
      url: '',
    },
    requests: {
      enabled: false,
      url: '',
    },
    birthdays: {
      enabled: false,
      url: '',
      message: 'Olá, {nome_do_cliente}! Vimos que é seu aniversário e gostaríamos de informar que disponibilizamos {valor_de_creditos} pontos para você! Que seu aniversário seja ainda mais completo!',
      creditsAmount: 100,
      daysInAdvance: 0,
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleToggle = (section: 'purchases' | 'requests' | 'birthdays') => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        enabled: !prev[section].enabled,
      },
    }));
  };

  const handleUrlChange = (section: 'purchases' | 'requests' | 'birthdays', url: string) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        url,
      },
    }));
    
    if (errors[`${section}_url`]) {
      setErrors(prev => ({ ...prev, [`${section}_url`]: '' }));
    }
  };

  const handleBirthdayConfigChange = (field: 'message' | 'creditsAmount' | 'daysInAdvance', value: string | number) => {
    setConfig(prev => ({
      ...prev,
      birthdays: {
        ...prev.birthdays,
        [field]: value,
      },
    }));
    
    if (errors[`birthdays_${field}`]) {
      setErrors(prev => ({ ...prev, [`birthdays_${field}`]: '' }));
    }
  };

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (config.purchases.enabled && !validateUrl(config.purchases.url)) {
      newErrors.purchases_url = 'URL inválida para webhook de compras';
    }

    if (config.requests.enabled && !validateUrl(config.requests.url)) {
      newErrors.requests_url = 'URL inválida para webhook de solicitações';
    }

    if (config.birthdays.enabled) {
      if (!validateUrl(config.birthdays.url)) {
        newErrors.birthdays_url = 'URL inválida para webhook de aniversários';
      }
      if (!config.birthdays.message.trim()) {
        newErrors.birthdays_message = 'Mensagem de aniversário é obrigatória';
      }
      if (config.birthdays.creditsAmount <= 0) {
        newErrors.birthdays_creditsAmount = 'Quantidade de créditos deve ser maior que zero';
      }
      if (config.birthdays.daysInAdvance < 0 || config.birthdays.daysInAdvance > 30) {
        newErrors.birthdays_daysInAdvance = 'Dias de antecedência deve ser entre 0 e 30';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    dispatch({ type: 'UPDATE_WEBHOOK_CONFIG', payload: config });
    onClose();
  };

  const testWebhook = async (section: 'purchases' | 'requests' | 'birthdays') => {
    const url = config[section].url;
    if (!url) return;

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      alert('URL inválida. Verifique o formato da URL.');
      return;
    }
    try {
      let testData = {};
      
      switch (section) {
        case 'purchases':
          testData = {
            type: 'purchase',
            customer: {
              name: 'João Silva',
              phone: '(11) 99999-9999',
            },
            purchase: {
              amount: 150.00,
              points_earned: 15,
            },
            store: {
              name: currentCompany?.name,
            },
            timestamp: new Date().toISOString(),
          };
          break;
          
        case 'requests':
          testData = {
            type: 'request_approved',
            customer: {
              name: 'Maria Santos',
              phone: '(11) 88888-8888',
            },
            request: {
              product: 'Produto Teste',
              approved_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            },
            store: {
              name: currentCompany?.name,
            },
          };
          break;
          
        case 'birthdays':
          testData = {
            type: 'birthday',
            customer: {
              name: 'Ana Costa',
              phone: '(11) 77777-7777',
              last_purchase: '2024-01-15',
            },
            message: config.birthdays.message
              .replace('{nome_do_cliente}', 'Ana Costa')
              .replace('{valor_de_creditos}', config.birthdays.creditsAmount.toString()),
            credits_amount: config.birthdays.creditsAmount,
            store: {
              name: currentCompany?.name,
            },
          };
          break;
      }

      // Show loading state
      const originalText = document.querySelector(`button[onclick*="testWebhook('${section}')"]`)?.textContent;
      const button = document.querySelector(`button[onclick*="testWebhook('${section}')"]`) as HTMLButtonElement;
      if (button) {
        button.textContent = 'Testando...';
        button.disabled = true;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Fideliza.AI-Webhook-Test/1.0',
        },
        body: JSON.stringify(testData),
        mode: 'no-cors', // Allow cross-origin requests
      });

      // Reset button state
      if (button) {
        button.textContent = originalText || 'Testar';
        button.disabled = false;
      }

      // With no-cors mode, we can't read the response, so we assume success if no error was thrown
      alert(`✅ Webhook enviado com sucesso!\n\nDados enviados para: ${url}\n\n📋 Payload:\n${JSON.stringify(testData, null, 2)}`);
      
    } catch (error) {
      // Reset button state
      const button = document.querySelector(`button[onclick*="testWebhook('${section}')"]`) as HTMLButtonElement;
      if (button) {
        button.textContent = 'Testar';
        button.disabled = false;
      }

      let errorMessage = 'Erro desconhecido';
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = `❌ Erro de conexão:\n\n• Verifique se a URL está correta\n• Certifique-se de que o servidor está online\n• Verifique se o servidor aceita requisições CORS\n• Teste a URL em uma ferramenta como Postman\n\nURL testada: ${url}`;
      } else if (error instanceof Error) {
        errorMessage = `❌ Erro: ${error.message}`;
      }
      
      alert(errorMessage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Webhook className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Configuração de Webhooks</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Webhook de Compras */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Gift className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Webhook - Compras</h3>
                  <p className="text-sm text-gray-600">Enviado quando uma venda é registrada</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('purchases')}
                className="flex items-center space-x-2"
              >
                {config.purchases.enabled ? (
                  <ToggleRight className="w-8 h-8 text-green-500" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-gray-400" />
                )}
              </button>
            </div>

            {config.purchases.enabled && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL do Webhook *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      value={config.purchases.url}
                      onChange={(e) => handleUrlChange('purchases', e.target.value)}
                      className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors.purchases_url ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="https://sua-api.com/webhook/compras"
                    />
                    <button
                      onClick={() => testWebhook('purchases')}
                      disabled={!config.purchases.url}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      Testar
                    </button>
                  </div>
                  {errors.purchases_url && <p className="mt-1 text-sm text-red-600">{errors.purchases_url}</p>}
                </div>

                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <h4 className="font-medium text-gray-900 mb-2">Dados Enviados:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Nome do cliente</li>
                    <li>• Telefone do cliente</li>
                    <li>• Valor da compra</li>
                    <li>• Quantidade de pontos ganhos</li>
                    <li>• Nome da loja</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Webhook de Solicitações */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Webhook - Solicitações</h3>
                  <p className="text-sm text-gray-600">Enviado quando uma solicitação é aprovada</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('requests')}
                className="flex items-center space-x-2"
              >
                {config.requests.enabled ? (
                  <ToggleRight className="w-8 h-8 text-blue-500" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-gray-400" />
                )}
              </button>
            </div>

            {config.requests.enabled && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL do Webhook *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      value={config.requests.url}
                      onChange={(e) => handleUrlChange('requests', e.target.value)}
                      className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.requests_url ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="https://sua-api.com/webhook/solicitacoes"
                    />
                    <button
                      onClick={() => testWebhook('requests')}
                      disabled={!config.requests.url}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      Testar
                    </button>
                  </div>
                  {errors.requests_url && <p className="mt-1 text-sm text-red-600">{errors.requests_url}</p>}
                </div>

                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <h4 className="font-medium text-gray-900 mb-2">Dados Enviados:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Nome do cliente</li>
                    <li>• Telefone do cliente</li>
                    <li>• Nome da loja</li>
                    <li>• Produto solicitado</li>
                    <li>• Horário da aprovação</li>
                    <li>• Horário máximo para retirada</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Webhook de Aniversários */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Webhook - Aniversários</h3>
                  <p className="text-sm text-gray-600">Enviado em aniversários de clientes</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('birthdays')}
                className="flex items-center space-x-2"
              >
                {config.birthdays.enabled ? (
                  <ToggleRight className="w-8 h-8 text-purple-500" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-gray-400" />
                )}
              </button>
            </div>

            {config.birthdays.enabled && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL do Webhook *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      value={config.birthdays.url}
                      onChange={(e) => handleUrlChange('birthdays', e.target.value)}
                      className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        errors.birthdays_url ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="https://sua-api.com/webhook/aniversarios"
                    />
                    <button
                      onClick={() => testWebhook('birthdays')}
                      disabled={!config.birthdays.url}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      Testar
                    </button>
                  </div>
                  {errors.birthdays_url && <p className="mt-1 text-sm text-red-600">{errors.birthdays_url}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Créditos de Aniversário *
                    </label>
                    <input
                      type="number"
                      value={config.birthdays.creditsAmount}
                      onChange={(e) => handleBirthdayConfigChange('creditsAmount', Number(e.target.value))}
                      min="1"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        errors.birthdays_creditsAmount ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="100"
                    />
                    {errors.birthdays_creditsAmount && <p className="mt-1 text-sm text-red-600">{errors.birthdays_creditsAmount}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dias de Antecedência *
                    </label>
                    <select
                      value={config.birthdays.daysInAdvance}
                      onChange={(e) => handleBirthdayConfigChange('daysInAdvance', Number(e.target.value))}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        errors.birthdays_daysInAdvance ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value={0}>No dia do aniversário</option>
                      <option value={1}>1 dia antes</option>
                      <option value={3}>3 dias antes</option>
                      <option value={7}>1 semana antes</option>
                      <option value={15}>15 dias antes</option>
                      <option value={30}>30 dias antes</option>
                    </select>
                    {errors.birthdays_daysInAdvance && <p className="mt-1 text-sm text-red-600">{errors.birthdays_daysInAdvance}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensagem Personalizada *
                  </label>
                  <textarea
                    value={config.birthdays.message}
                    onChange={(e) => handleBirthdayConfigChange('message', e.target.value)}
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none ${
                      errors.birthdays_message ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Digite sua mensagem personalizada..."
                  />
                  {errors.birthdays_message && <p className="mt-1 text-sm text-red-600">{errors.birthdays_message}</p>}
                  
                  <div className="mt-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <h5 className="font-medium text-purple-800 mb-2">Variáveis Disponíveis:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-purple-700">
                      <div><code className="bg-purple-100 px-1 rounded">{'{nome_do_cliente}'}</code> - Nome do cliente</div>
                      <div><code className="bg-purple-100 px-1 rounded">{'{valor_de_creditos}'}</code> - Quantidade de créditos</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <h4 className="font-medium text-gray-900 mb-2">Dados Enviados:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Nome do cliente</li>
                    <li>• Telefone do cliente</li>
                    <li>• Data da última venda</li>
                    <li>• Mensagem personalizada</li>
                    <li>• Quantidade de créditos</li>
                    <li>• Nome da loja</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Configurações</span>
          </button>
        </div>
      </div>
    </div>
  );
}