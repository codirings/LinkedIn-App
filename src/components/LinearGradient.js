import React from 'react';
import { StyleSheet, View } from 'react-native';

// Pure-JS stand-in for expo-linear-gradient (no native code). Draws the gradient as thin colour strips.
function parse(color) {
  if (color.startsWith('#')) {
    let h = color.slice(1);
    if (h.length === 3) h = h.split('').map((x) => x + x).join('');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1];
  }
  const m = color.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const p = m[1].split(',').map((v) => parseFloat(v));
    return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
  }
  return [0, 0, 0, 1];
}

const STEPS = 32;

export default function LinearGradient({ colors, start, end, locations, style, children, ...rest }) {
  const sx = start?.x ?? 0.5;
  const sy = start?.y ?? 0;
  const ex = end?.x ?? 0.5;
  const ey = end?.y ?? 1;
  const unique = new Set(colors);
  if (unique.size === 1) {
    return <View {...rest} style={[style, { backgroundColor: colors[0] }]}>{children}</View>;
  }
  const stops = colors.map(parse);
  const pos = locations || colors.map((_, i) => i / (colors.length - 1));
  const horizontal = Math.abs(ex - sx) > Math.abs(ey - sy);
  const reversed = horizontal ? ex < sx : ey < sy;
  const colorAt = (t) => {
    let i = 0;
    while (i < pos.length - 2 && t > pos[i + 1]) i += 1;
    const span = pos[i + 1] - pos[i] || 1;
    const k = Math.max(0, Math.min(1, (t - pos[i]) / span));
    const a = stops[i];
    const b = stops[i + 1];
    const c = a.map((v, j) => v + (b[j] - v) * k);
    return `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${c[3].toFixed(3)})`;
  };
  const strips = [];
  for (let n = 0; n < STEPS; n += 1) {
    const t = (n + 0.5) / STEPS;
    strips.push(<View key={n} style={{ flex: 1, backgroundColor: colorAt(reversed ? 1 - t : t) }} />);
  }
  return (
    <View {...rest} style={[style, { overflow: 'hidden' }]}>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { flexDirection: horizontal ? 'row' : 'column' }]}>
        {strips}
      </View>
      {children}
    </View>
  );
}
