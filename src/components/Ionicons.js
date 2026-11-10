import React from 'react';
import { Text } from 'react-native';
import glyphs from './ionicons-glyphs.json';

// Drop-in replacement for Ionicons from @expo/vector-icons (uses the Ionicons.ttf font in android assets).
export default function Ionicons({ name, size = 12, color = '#000', style, ...rest }) {
  const code = glyphs[name];
  const char = typeof code === 'number' ? String.fromCodePoint(code) : '?';
  return (
    <Text
      allowFontScaling={false}
      {...rest}
      style={[{ fontFamily: 'Ionicons', fontSize: size, color, fontWeight: 'normal', fontStyle: 'normal' }, style]}
    >
      {char}
    </Text>
  );
}
