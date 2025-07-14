import React, { useState, useEffect } from 'react';
import { X, QrCode, Download, Copy, Check } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import QRCodeLib from 'qrcode';

interface QRCodeModalProps {
  onClose: () => void;
}

export default function QRCodeModal({ onClose }: QRCodeModalProps) {
  const { state } = useApp();
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);
  
  const currentCompany = state.currentCompany;
  const registrationUrl = `${window.location.origin}/register/${currentCompany?.slug}`;

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const qrDataUrl = await QRCodeLib.toDataURL(registrationUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#1f2937',
            light: '#ffffff'
          }
        });
        setQrCodeUrl(qrDataUrl);
      } catch (error) {
        console.error('Erro ao gerar QR Code:', error);
      }
    };

    if (registrationUrl) {
      generateQRCode();
    }
  }, [registrationUrl]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(registrationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar URL:', error);
    }
  };

  const handleDownloadQR = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.download = `qr-code-${currentCompany?.slug}.png`;
      link.href = qrCodeUrl;
      link.click();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">QR Code de Cadastro</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 mb-4">
              {qrCodeUrl ? (
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code" 
                  className="mx-auto rounded-lg shadow-sm"
                />
              ) : (
                <div className="w-[300px] h-[300px] mx-auto bg-gray-200 rounded-lg flex items-center justify-center">
                  <QrCode className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {currentCompany?.name}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Escaneie o QR Code para se cadastrar automaticamente
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL de Cadastro
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={registrationUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
              />
              <button
                onClick={handleCopyUrl}
                className="flex items-center space-x-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span className="text-sm">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="text-sm">Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Como usar:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Clientes escaneiam o QR Code com a câmera do celular</li>
              <li>• São direcionados para uma página de cadastro</li>
              <li>• Após o cadastro, já têm acesso ao sistema</li>
              <li>• Podem acompanhar pontos e fazer solicitações</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={handleDownloadQR}
              disabled={!qrCodeUrl}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Baixar QR</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}