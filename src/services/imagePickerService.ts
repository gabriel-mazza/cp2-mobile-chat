import * as ImagePicker from 'expo-image-picker';
import { AppError } from '../utils/errors';


export async function pickImage(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new AppError(
      'MEDIA_PERMISSION_DENIED',
      'Permita o acesso às fotos nas configurações do aparelho para escolher uma imagem.',
    );
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.6,
  });
  if (result.canceled) return null;
  return result.assets[0]?.uri ?? null;
}
