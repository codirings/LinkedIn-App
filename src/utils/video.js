import React from 'react';
import { Text, View } from 'react-native';
import Ionicons from '../components/Ionicons';

// Video playback needs a native library; this build shows a placeholder instead.
export const ResizeMode = { COVER: 'cover', CONTAIN: 'contain', STRETCH: 'stretch' };
export function Video({ style }) {
  return (
    <View style={[style, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827' }]}>
      <Ionicons name="videocam" size={30} color="#fff" />
      <Text style={{ color: '#fff', marginTop: 6, fontSize: 12 }}>Video preview is not available in this build</Text>
    </View>
  );
}
