import { AppError } from '../utils/errors';
import { asString, isRecord } from '../utils/parsers';

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? '';

type FilePart = { uri: string; name: string; type: string };

/**
 * Envia a imagem ao Cloudinary (upload preset "unsigned": nenhum segredo no app)
 * e devolve SOMENTE a URL final HTTPS. No Firestore/RTDB nunca é gravado Base64.
 */
export async function uploadImage(localUri: string, folder: string): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new AppError(
      'STORAGE_NOT_CONFIGURED',
      'O serviço de imagens não foi configurado (EXPO_PUBLIC_CLOUDINARY_*).',
    );
  }

  const filePart: FilePart = { uri: localUri, name: 'photo.jpg', type: 'image/jpeg' };
  const form = new FormData();
  // React Native aceita { uri, name, type } como arquivo no FormData.
  form.append('file', filePart as unknown as Blob);
  form.append('upload_preset', UPLOAD_PRESET);
  form.append('folder', folder);

  let response: Response;
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: form,
    });
  } catch {
    throw new AppError('UPLOAD_NETWORK', 'Falha ao enviar a imagem. Verifique sua conexão.');
  }

  const payload: unknown = await response.json().catch(() => null);
  const url = isRecord(payload) ? asString(payload.secure_url) : '';
  if (!response.ok || !url.startsWith('https://')) {
    throw new AppError('UPLOAD_FAILED', 'Não foi possível enviar a imagem. Tente outra foto.');
  }
  return url;
}
