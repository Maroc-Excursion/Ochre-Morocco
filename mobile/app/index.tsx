import React from 'react';
    import { Platform, View } from 'react-native';
    import { WebView } from 'react-native-webview';

    const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL || 'https://ochre-morocco.com/';

    export default function HomeScreen() {
    return Platform.OS === 'web'
      ? <View style={{ flex: 1 }}><iframe src={SITE_URL} style={{ flex: 1, width: '100%', height: '100%', border: 0 }} title="Ochre Morocco" /></View>
      : <WebView source={{ uri: SITE_URL }} style={{ flex: 1 }} />;
    }
    