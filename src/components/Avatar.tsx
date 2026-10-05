import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

type Props = {
  uri?: string;
  name: string;
  size?: number;
  isGroup?: boolean;
  onPress?: () => void;
};


export function Avatar({ uri, name, size = 44, isGroup = false, onPress }: Props) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  const initials = useMemo(
    () =>
      name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('') || '?',
    [name],
  );

  const box = { width: size, height: size, borderRadius: size / 2 };
  const content =
    uri && !failed ? (
      <Image source={{ uri }} style={[styles.image, box]} onError={() => setFailed(true)} />
    ) : (
      <View style={[styles.fallback, box]}>
        <Text style={[styles.fallbackText, { fontSize: size * 0.4 }]}>{isGroup ? '👥' : initials}</Text>
      </View>
    );

  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Abrir ${name}`}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: colors.border },
  fallback: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  fallbackText: { color: '#fff', fontWeight: '700' },
});
