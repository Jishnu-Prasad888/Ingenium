import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Modal,
  Animated,
  useWindowDimensions,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Play, Pause, RotateCcw, X } from "lucide-react-native";

interface TimerModalProps {
  visible: boolean;
  onClose: () => void;
}

const C = {
  bg: "#FFF9EF",
  dark: "#2A1510",
  peach: "#F7D5CA",
  peachMid: "#f0b8a5",
  accent: "#d4836a",
  accentLight: "#f5c4b4",
  muted: "rgba(42,21,16,0.35)",
  overlay: "rgba(42,21,16,0.6)",
  cardBg: "#FEF0E4",
};

export default function TimerModal({ visible, onClose }: TimerModalProps) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const slideAnim = useRef(new Animated.Value(1200)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const btnScales = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;

  const isOpenRef = useRef(false);
  const openAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (openAnimRef.current) {
      openAnimRef.current.stop();
      openAnimRef.current = null;
    }
    if (visible) {
      isOpenRef.current = true;
      slideAnim.setValue(height + 200);
      backdropAnim.setValue(0);
      const anim = Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 70,
          friction: 14,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]);
      openAnimRef.current = anim;
      anim.start(({ finished }) => {
        if (finished) openAnimRef.current = null;
      });
    } else {
      const anim = Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: height + 200,
          useNativeDriver: true,
          tension: 85,
          friction: 14,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]);
      openAnimRef.current = anim;
      anim.start(({ finished }) => {
        openAnimRef.current = null;
        if (finished) {
          isOpenRef.current = false;
          setRunning(false);
          setSeconds(0);
        }
      });
    }
  }, [visible]);

  useEffect(() => {
    if (isOpenRef.current && !openAnimRef.current) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 130,
        friction: 20,
      }).start();
    }
  }, [width, height]);

  useEffect(() => {
    if (running) {
      // Gentle breathe on the whole display
      const breathe = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.018,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      );
      // Subtle glow fade in
      const glow = Animated.timing(glowAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      });
      breathe.start();
      glow.start();
      return () => {
        breathe.stop();
      };
    } else {
      Animated.spring(pulseAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 10,
      }).start();
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [running]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running]);

  const bouncyPress = useCallback((anim: Animated.Value, cb: () => void) => {
    Animated.sequence([
      Animated.spring(anim, {
        toValue: 0.84,
        useNativeDriver: true,
        tension: 350,
        friction: 10,
      }),
      Animated.spring(anim, {
        toValue: 1.08,
        useNativeDriver: true,
        tension: 300,
        friction: 8,
      }),
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 220,
        friction: 10,
      }),
    ]).start();
    requestAnimationFrame(cb);
  }, []);

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  const btnSize = isLandscape ? 52 : 60;
  const iconSize = isLandscape ? 18 : 21;
  const statusLabel = running ? "Running" : seconds > 0 ? "Paused" : "Ready";

  // Font size scales with screen
  const digitFontSize = isLandscape
    ? Math.min(height * 0.22, 56)
    : Math.min(width * 0.155, 64);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.06],
  });

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      supportedOrientations={[
        "portrait",
        "portrait-upside-down",
        "landscape",
        "landscape-left",
        "landscape-right",
      ]}
    >
      <StatusBar
        backgroundColor="transparent"
        translucent
        barStyle="dark-content"
      />

      <Animated.View style={[s.backdrop, { opacity: backdropAnim }]}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
      </Animated.View>

      <Animated.View
        style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}
      >
        <SafeAreaView
          edges={["top", "bottom", "left", "right"]}
          style={s.safeArea}
        >
          {/* Header */}
          <View style={[s.header, isLandscape && s.headerLandscape]}>
            {!isLandscape && <View style={s.handle} />}
            <View style={s.headerRow}>
              <Text style={s.title}>TIMER</Text>
              <TouchableOpacity
                onPress={onClose}
                style={s.closeBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <X size={13} color={C.dark} strokeWidth={2.8} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.divider} />

          {/* Body */}
          <View
            style={[s.body, isLandscape ? s.bodyLandscape : s.bodyPortrait]}
          >
            {/* ── Time display card ── */}
            <Animated.View
              style={[s.card, { transform: [{ scale: pulseAnim }] }]}
            >
              {/* Running glow overlay */}
              <Animated.View style={[s.cardGlow, { opacity: glowOpacity }]} />

              <View style={s.timeRow}>
                {/* Hours */}
                <View style={s.unit}>
                  <Text style={[s.digit, { fontSize: digitFontSize }]}>
                    {pad(hrs)}
                  </Text>
                  <Text style={s.unitLabel}>HRS</Text>
                </View>

                <Text style={[s.sep, { fontSize: digitFontSize * 0.65 }]}>
                  :
                </Text>

                {/* Minutes */}
                <View style={s.unit}>
                  <Text style={[s.digit, { fontSize: digitFontSize }]}>
                    {pad(mins)}
                  </Text>
                  <Text style={s.unitLabel}>MIN</Text>
                </View>

                <Text style={[s.sep, { fontSize: digitFontSize * 0.65 }]}>
                  :
                </Text>

                {/* Seconds */}
                <View style={s.unit}>
                  <Text
                    style={[
                      s.digit,
                      { fontSize: digitFontSize },
                      running && s.digitRunning,
                    ]}
                  >
                    {pad(secs)}
                  </Text>
                  <Text style={[s.unitLabel, running && s.unitLabelRunning]}>
                    SEC
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* ── Controls ── */}
            <View
              style={[
                s.controls,
                isLandscape ? s.controlsLandscape : s.controlsPortrait,
              ]}
            >
              {!isLandscape && (
                <View style={s.labelRow}>
                  {["Start", "Pause", "Reset"].map((l) => (
                    <Text key={l} style={[s.btnLabel, { width: btnSize }]}>
                      {l}
                    </Text>
                  ))}
                </View>
              )}

              <View
                style={[
                  s.btnGroup,
                  isLandscape ? s.btnGroupLandscape : s.btnGroupPortrait,
                ]}
              >
                <Animated.View style={{ transform: [{ scale: btnScales[0] }] }}>
                  <TouchableOpacity
                    onPress={() =>
                      bouncyPress(btnScales[0], () => setRunning(true))
                    }
                    disabled={running}
                    activeOpacity={0.88}
                    style={[
                      s.btn,
                      {
                        width: btnSize,
                        height: btnSize,
                        borderRadius: btnSize / 2,
                      },
                      s.btnPrimary,
                      running && s.btnDisabled,
                    ]}
                  >
                    <Play size={iconSize} color={C.peach} fill={C.peach} />
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View style={{ transform: [{ scale: btnScales[1] }] }}>
                  <TouchableOpacity
                    onPress={() =>
                      bouncyPress(btnScales[1], () => setRunning(false))
                    }
                    disabled={!running}
                    activeOpacity={0.88}
                    style={[
                      s.btn,
                      {
                        width: btnSize,
                        height: btnSize,
                        borderRadius: btnSize / 2,
                      },
                      s.btnSecondary,
                      !running && s.btnDisabled,
                    ]}
                  >
                    <Pause size={iconSize} color={C.dark} fill={C.dark} />
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View style={{ transform: [{ scale: btnScales[2] }] }}>
                  <TouchableOpacity
                    onPress={() =>
                      bouncyPress(btnScales[2], () => {
                        setRunning(false);
                        setSeconds(0);
                      })
                    }
                    activeOpacity={0.88}
                    style={[
                      s.btn,
                      {
                        width: btnSize,
                        height: btnSize,
                        borderRadius: btnSize / 2,
                      },
                      s.btnGhost,
                    ]}
                  >
                    <RotateCcw
                      size={iconSize}
                      color={C.dark}
                      strokeWidth={2.2}
                    />
                  </TouchableOpacity>
                </Animated.View>
              </View>

              {/* Status pill */}
              <View style={[s.statusPill, running && s.statusPillActive]}>
                <View style={[s.statusDot, running && s.statusDotActive]} />
                <Text style={[s.statusText, running && s.statusTextActive]}>
                  {statusLabel}
                </Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: C.overlay },
  sheet: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: C.bg,
    shadowColor: C.dark,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 24,
  },
  safeArea: { flex: 1 },

  header: {
    paddingTop: 14,
    paddingHorizontal: 24,
    paddingBottom: 0,
    alignItems: "center",
  },
  headerLandscape: { paddingTop: 8 },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.peachMid,
    marginBottom: 16,
  },
  headerRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 12,
  },
  title: {
    fontFamily: "Georgia",
    fontSize: 12,
    fontWeight: "700",
    color: C.dark,
    letterSpacing: 5,
    opacity: 0.45,
  },
  closeBtn: {
    position: "absolute",
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.peach,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.peachMid,
    marginHorizontal: 24,
  },

  body: { flex: 1, alignItems: "center", justifyContent: "center" },
  bodyPortrait: {
    flexDirection: "column",
    gap: 44,
    paddingVertical: 28,
    paddingHorizontal: 24,
  },
  bodyLandscape: {
    flexDirection: "row",
    gap: 44,
    paddingVertical: 12,
    paddingHorizontal: 36,
  },

  // Card
  card: {
    backgroundColor: C.peach,
    borderRadius: 32,
    paddingHorizontal: 28,
    paddingVertical: 32,
    alignItems: "center",
    overflow: "hidden",
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  cardGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.accent,
    borderRadius: 32,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  unit: {
    alignItems: "center",
    gap: 8,
    minWidth: 72,
  },
  digit: {
    fontFamily: "Georgia",
    fontWeight: "600",
    color: C.dark,
    letterSpacing: -1.5,
    opacity: 0.88,
  },
  digitRunning: {
    opacity: 1,
    color: C.accent,
  },
  unitLabel: {
    fontFamily: "Georgia",
    fontSize: 9,
    letterSpacing: 3,
    color: C.dark,
    opacity: 0.3,
    textTransform: "uppercase",
  },
  unitLabelRunning: {
    color: C.accent,
    opacity: 0.65,
  },
  sep: {
    fontFamily: "Georgia",
    fontWeight: "200",
    color: C.peachMid,
    marginBottom: 18,
    opacity: 0.7,
  },

  // Controls
  controls: { alignItems: "center" },
  controlsPortrait: { gap: 14 },
  controlsLandscape: { gap: 14, justifyContent: "center" },
  btnGroup: { alignItems: "center" },
  btnGroupPortrait: { flexDirection: "row", gap: 20 },
  btnGroupLandscape: { flexDirection: "column", gap: 14 },
  labelRow: { flexDirection: "row", gap: 20, alignItems: "center" },
  btnLabel: {
    textAlign: "center",
    fontFamily: "Georgia",
    fontSize: 10,
    letterSpacing: 1.4,
    color: C.dark,
    opacity: 0.35,
    textTransform: "uppercase",
  },
  btn: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  btnPrimary: { backgroundColor: C.dark },
  btnSecondary: { backgroundColor: C.peachMid },
  btnGhost: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: C.peachMid,
    shadowOpacity: 0,
    elevation: 0,
  },
  btnDisabled: { opacity: 0.2 },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: C.peach,
  },
  statusPillActive: { backgroundColor: C.dark },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.muted },
  statusDotActive: { backgroundColor: C.accentLight },
  statusText: {
    fontFamily: "Georgia",
    fontSize: 10,
    letterSpacing: 2,
    color: C.dark,
    opacity: 0.45,
    textTransform: "uppercase",
  },
  statusTextActive: { color: C.peach, opacity: 0.9 },
});
