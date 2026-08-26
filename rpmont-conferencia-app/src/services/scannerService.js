import { Capacitor } from '@capacitor/core';

import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerAndroidScanningLibrary,
  CapacitorBarcodeScannerCameraDirection,
  CapacitorBarcodeScannerScanOrientation,
  CapacitorBarcodeScannerTypeHintALLOption,
} from '@capacitor/barcode-scanner';

export function leitorNativoDisponivel() {
  return Capacitor.isNativePlatform();
}

export async function lerCodigoNativo() {
  if (!leitorNativoDisponivel()) {
    throw new Error(
      'O leitor nativo está disponível somente no aplicativo instalado no dispositivo.'
    );
  }

  try {
    const resultado =
      await CapacitorBarcodeScanner.scanBarcode({
        hint:
          CapacitorBarcodeScannerTypeHintALLOption.ALL,

        cameraDirection:
          CapacitorBarcodeScannerCameraDirection.BACK,

        scanOrientation:
          CapacitorBarcodeScannerScanOrientation.ADAPTIVE,

        scanInstructions:
          'Aponte a câmera para o código do material',

        scanButton: false,

        scanText: 'Ler código',

        cancelButtonAccessibilityLabel:
          'Cancelar leitura',

        torchButtonOnAccessibilityLabel:
          'Desligar lanterna',

        torchButtonOffAccessibilityLabel:
          'Ligar lanterna',

        android: {
          scanningLibrary:
            CapacitorBarcodeScannerAndroidScanningLibrary.ZXING,
        },

        web: {
          showCameraSelection: false,
          scannerFPS: 10,
        },
      });

    const codigo = String(
      resultado?.ScanResult ?? ''
    ).trim();

    return codigo || null;
  } catch (error) {
    const mensagem = String(
      error?.message ?? ''
    ).toLowerCase();

    const leituraCancelada =
      mensagem.includes('cancel') ||
      mensagem.includes('dismiss') ||
      mensagem.includes('closed');

    if (leituraCancelada) {
      return null;
    }

    console.error(
      'Erro no leitor nativo:',
      error
    );

    throw new Error(
      'Não foi possível abrir o leitor. Verifique a permissão da câmera.',
      {
        cause: error,
      }
    );
  }
}