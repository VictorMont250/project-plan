import { Stack } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";

// web server
const GAME_URL = "http://192.168.2.14:5500/apps/web?mobile=1";

type TouchPatch = {
  left?: boolean;
  right?: boolean;
  jump?: boolean;
  shoot?: boolean;
};

export default function Index() {
  const webViewRef = useRef<WebView>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [webViewError, setWebViewError] = useState<string | null>(null);
  const [showRestartButton, setShowRestartButton] = useState(false);

  const injectTouchPatch = (patch: TouchPatch) => {
    const payload = JSON.stringify(patch);
    webViewRef.current?.injectJavaScript(`
      window.__ladybugTouch = window.__ladybugTouch || { left: false, right: false, jump: false, shoot: false };
      Object.assign(window.__ladybugTouch, ${payload});
      window.dispatchEvent(new CustomEvent('ladybug-touch-input', { detail: window.__ladybugTouch }));
      true;
    `);
  };

  const restartGame = () => {
    webViewRef.current?.injectJavaScript(`
      window.dispatchEvent(new CustomEvent('ladybug-restart-game'));
      true;
    `);
    setShowRestartButton(false);
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "game-win" || data.type === "game-over") {
        setShowRestartButton(true);
      }
      if (data.type === "game-started") {
        setShowRestartButton(false);
      }
    } catch {
      // Ignore non-JSON messages from the web content.
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <WebView
        ref={webViewRef}
        key={`${GAME_URL}-${reloadKey}`}
        source={{ uri: GAME_URL }}
        style={styles.webview}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        onMessage={handleMessage}
        onError={() => {
          setWebViewError(
            `Could not load ${GAME_URL}.`
          );
        }}
        onHttpError={(event) => {
          setWebViewError(
            `HTTP ${event.nativeEvent.statusCode} while loading ${GAME_URL}.`
          );
        }}
        onLoadStart={() => {
          setWebViewError(null);
        }}
      />

      <View style={styles.controlsOverlay} pointerEvents="box-none">
        <View style={styles.leftPad}>
          <Pressable
            onPressIn={() => injectTouchPatch({ left: true })}
            onPressOut={() => injectTouchPatch({ left: false })}
            style={styles.controlButton}
          >
            <Text style={styles.controlLabel}>◀</Text>
          </Pressable>

          <Pressable
            onPressIn={() => injectTouchPatch({ jump: true })}
            onPressOut={() => injectTouchPatch({ jump: false })}
            style={styles.controlButton}
          >
            <Text style={styles.controlLabel}>▲</Text>
          </Pressable>

          <Pressable
            onPressIn={() => injectTouchPatch({ right: true })}
            onPressOut={() => injectTouchPatch({ right: false })}
            style={styles.controlButton}
          >
            <Text style={styles.controlLabel}>▶</Text>
          </Pressable>
        </View>

        <View style={styles.rightPad}>
          <Pressable
            onPressIn={() => injectTouchPatch({ shoot: true })}
            onPressOut={() => injectTouchPatch({ shoot: false })}
            style={[styles.controlButton, styles.shootButton]}
          >
            <Text style={styles.controlLabel}>A</Text>
          </Pressable>
        </View>
      </View>

      {showRestartButton ? (
        <View style={styles.restartOverlay} pointerEvents="box-none">
          <Pressable onPress={restartGame} style={styles.restartButton}>
            <Text style={styles.restartText}>Restart</Text>
          </Pressable>
        </View>
      ) : null}

      {webViewError ? (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>{webViewError}</Text>
          <Pressable
            onPress={() => setReloadKey((currentKey) => currentKey + 1)}
            style={styles.reloadButton}
          >
            <Text style={styles.reloadButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const BG_COLOR = "#f3efe0";
const BUTTON_COLOR = "rgba(35, 35, 35, 0.72)";
const BUTTON_BORDER = "rgba(255, 255, 255, 0.25)";
const ACCENT_COLOR = "#2cc739";
const TEXT_COLOR = "#fff";
const LIGHT_TEXT = "#fffaf4";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  webview: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  controlsOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 22,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  leftPad: {
    flexDirection: "row",
    gap: 10,
  },
  rightPad: {
    flexDirection: "row",
    marginRight: 50,
  },
  controlButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: BUTTON_COLOR,
    borderWidth: 1,
    borderColor: BUTTON_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  shootButton: {
    width: 62,
    borderRadius: 31,
  },
  controlLabel: {
    color: TEXT_COLOR,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  restartOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  restartButton: {
    backgroundColor: ACCENT_COLOR,
    paddingHorizontal: 50,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.28)",
  },
  restartText: {
    color: LIGHT_TEXT,
    fontSize: 18,
    fontWeight: "700",
  },
  errorOverlay: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    backgroundColor: "rgba(0, 0, 0, 0.66)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorText: {
    color: "#ffdede",
    fontSize: 13,
    lineHeight: 20,
  },
  reloadButton: {
    marginTop: 100,
    alignSelf: "flex-start",
    backgroundColor: ACCENT_COLOR,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  reloadButtonText: {
    color: LIGHT_TEXT,
    fontSize: 14,
    fontWeight: "600",
  },
});
