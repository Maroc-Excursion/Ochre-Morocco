import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';

const SITE_URL = 'https://maroc-excursion.github.io/Ochre-Morocco/';

// Web fallback — react-native-webview is native-only
if (Platform.OS === 'web') {
  const WebScreen = () => {
    const colors = useColors();
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <iframe
          src={SITE_URL}
          style={{ flex: 1, width: '100%', height: '100%', border: 'none' }}
          title="Ochre Morocco"
        />
      </View>
    );
  };
  module.exports = { default: WebScreen };
}

// Native screen
import { WebView, WebViewNavigation } from 'react-native-webview';

export default function HomeScreen() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const handleNavChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top safe area background */}
      <View
        style={[
          styles.statusBar,
          {
            height: insets.top,
            backgroundColor: colors.primary,
          },
        ]}
      />

      {/* Navigation bar (Android back/forward controls) */}
      {Platform.OS === 'android' && (
        <View
          style={[
            styles.navBar,
            { backgroundColor: colors.primary, paddingBottom: 8 },
          ]}
        >
          <TouchableOpacity
            onPress={() => webViewRef.current?.goBack()}
            disabled={!canGoBack}
            style={[styles.navBtn, { opacity: canGoBack ? 1 : 0.35 }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => webViewRef.current?.goForward()}
            disabled={!canGoForward}
            style={[styles.navBtn, { opacity: canGoForward ? 1 : 0.35 }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="arrow-right" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={styles.navSpacer} />

          <TouchableOpacity
            onPress={() => webViewRef.current?.reload()}
            style={styles.navBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="refresh-cw" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Loading indicator */}
      {loading && (
        <View
          style={[
            styles.loadingOverlay,
            { backgroundColor: colors.background },
          ]}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: SITE_URL }}
        style={styles.webview}
        onNavigationStateChange={handleNavChange}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        startInLoadingState={false}
        javaScriptEnabled
        domStorageEnabled
        allowsBackForwardNavigationGestures={Platform.OS === 'ios'}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        scalesPageToFit={false}
        contentInsetAdjustmentBehavior="never"
        injectedJavaScript={`
          (function() {
            var meta = document.querySelector('meta[name="viewport"]');
            if (!meta) {
              meta = document.createElement('meta');
              meta.name = 'viewport';
              document.head.appendChild(meta);
            }
            meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0';
          })();
          true;
        `}
      />

      {/* Bottom safe area */}
      <View
        style={{
          height: insets.bottom,
          backgroundColor: colors.background,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBar: {
    width: '100%',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 4,
  },
  navBtn: {
    padding: 8,
    borderRadius: 8,
  },
  navSpacer: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
