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
  Easing,
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
};

// ── Snow ─────────────────────────────────────────────────────────
const FLAKE_COUNT = 28;

interface Flake {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  startX: number;
}

function makeFlakes(): Flake[] {
  return Array.from({ length: FLAKE_COUNT }, () => ({
    x: new Animated.Value(Math.random()),
    y: new Animated.Value(-0.05),
    opacity: new Animated.Value(0),
    size: 4 + Math.random() * 7,
    duration: 6000 + Math.random() * 8000,
    delay: Math.random() * 10000,
    drift: 0.04 + Math.random() * 0.06,
    startX: Math.random(),
  }));
}

function animateFlake(flake: Flake, w: number, h: number) {
  flake.y.setValue(-0.05);
  flake.x.setValue(flake.startX);
  flake.opacity.setValue(0);

  const swayDur = 2500 + Math.random() * 2000;
  const targetX = Math.max(
    0,
    Math.min(1, flake.startX + (Math.random() > 0.5 ? 1 : -1) * flake.drift),
  );

  const sway = Animated.loop(
    Animated.sequence([
      Animated.timing(flake.x, {
        toValue: targetX,
        duration: swayDur,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.timing(flake.x, {
        toValue: flake.startX,
        duration: swayDur,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    ]),
  );

  const peakOpacity = 0.45 + Math.random() * 0.3;
  const fall = Animated.sequence([
    Animated.delay(flake.delay),
    Animated.parallel([
      Animated.sequence([
        Animated.timing(flake.opacity, {
          toValue: peakOpacity,
          duration: flake.duration * 0.15,
          useNativeDriver: true,
        }),
        Animated.timing(flake.opacity, {
          toValue: peakOpacity,
          duration: flake.duration * 0.7,
          useNativeDriver: true,
        }),
        Animated.timing(flake.opacity, {
          toValue: 0,
          duration: flake.duration * 0.15,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(flake.y, {
        toValue: 1.05,
        duration: flake.duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]),
  ]);

  sway.start();
  fall.start(({ finished }) => {
    if (finished) {
      sway.stop();
      flake.delay = Math.random() * 4000;
      flake.startX = Math.random();
      animateFlake(flake, w, h);
    }
  });
}

function Snow({ width, height }: { width: number; height: number }) {
  const flakesRef = useRef<Flake[]>(makeFlakes());

  useEffect(() => {
    const flakes = flakesRef.current;
    flakes.forEach((f) => animateFlake(f, width, height));
    return () => {
      flakes.forEach((f) => {
        f.y.stopAnimation();
        f.x.stopAnimation();
        f.opacity.stopAnimation();
      });
    };
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {flakesRef.current.map((flake, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: flake.size,
            height: flake.size,
            borderRadius: flake.size / 2,
            backgroundColor: C.peachMid,
            opacity: flake.opacity,
            transform: [
              {
                translateX: flake.x.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, width],
                }),
              },
              {
                translateY: flake.y.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, height],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
}

// ── Timer Modal ───────────────────────────────────────────────────
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

  // Open/close sheet
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

  // Re-snap after rotation
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

  // Pulse while running
  useEffect(() => {
    if (running) {
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
      breathe.start();
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
      return () => breathe.stop();
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

  // Tick
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
  const statusLabel = running ? "Running" : seconds > 0 ? "Paused" : "Ready";

  // Responsive sizing
  const btnSize = isLandscape ? 50 : 60;
  const iconSize = isLandscape ? 17 : 21;

  // Digit font: smaller in landscape since card is more compact
  const digitFontSize = isLandscape
    ? Math.min(height * 0.18, 48)
    : Math.min(width * 0.155, 64);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.06],
  });

  // Card sizing: in landscape constrain to left half
  const cardMaxWidth = isLandscape ? width * 0.48 : width - 48;

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

      {/* Backdrop */}
      <Animated.View style={[s.backdrop, { opacity: backdropAnim }]}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}
      >
        <Snow width={width} height={height} />

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

          {/* ── Body: portrait = column, landscape = row ── */}
          <View style={[s.body, isLandscape ? s.bodyRow : s.bodyColumn]}>
            {/* Left / top: Time display card */}
            <Animated.View
              style={[
                s.card,
                { maxWidth: cardMaxWidth, transform: [{ scale: pulseAnim }] },
                isLandscape && s.cardLandscape,
              ]}
            >
              <Animated.View style={[s.cardGlow, { opacity: glowOpacity }]} />

              <View style={s.timeRow}>
                {/* HRS */}
                <View style={s.unit}>
                  <Text style={[s.digit, { fontSize: digitFontSize }]}>
                    {pad(hrs)}
                  </Text>
                  <Text style={s.unitLabel}>HRS</Text>
                </View>

                <Text style={[s.sep, { fontSize: digitFontSize * 0.6 }]}>
                  :
                </Text>

                {/* MIN */}
                <View style={s.unit}>
                  <Text style={[s.digit, { fontSize: digitFontSize }]}>
                    {pad(mins)}
                  </Text>
                  <Text style={s.unitLabel}>MIN</Text>
                </View>

                <Text style={[s.sep, { fontSize: digitFontSize * 0.6 }]}>
                  :
                </Text>

                {/* SEC */}
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

            {/* Divider between card and controls in landscape */}
            {isLandscape && <View style={s.verticalDivider} />}

            {/* Right / bottom: Controls */}
            <View
              style={[
                s.controls,
                isLandscape ? s.controlsLandscape : s.controlsPortrait,
              ]}
            >
              {/* Button labels — portrait only above row */}
              {!isLandscape && (
                <View style={s.labelRow}>
                  {["Start", "Pause", "Reset"].map((l) => (
                    <Text key={l} style={[s.btnLabel, { width: btnSize }]}>
                      {l}
                    </Text>
                  ))}
                </View>
              )}

              {/* Buttons: row in portrait, column in landscape */}
              <View
                style={[
                  s.btnGroup,
                  isLandscape ? s.btnGroupColumn : s.btnGroupRow,
                ]}
              >
                {/* Landscape: label to the left of each button */}
                {(["Start", "Pause", "Reset"] as const).map((label, idx) => {
                  const icons = [
                    <Play size={iconSize} color={C.peach} fill={C.peach} />,
                    <Pause size={iconSize} color={C.dark} fill={C.dark} />,
                    <RotateCcw
                      size={iconSize}
                      color={C.dark}
                      strokeWidth={2.2}
                    />,
                  ];
                  const btnStyles = [s.btnPrimary, s.btnSecondary, s.btnGhost];
                  const disabledCond = [running, !running, false];
                  const onPresses = [
                    () => bouncyPress(btnScales[0], () => setRunning(true)),
                    () => bouncyPress(btnScales[1], () => setRunning(false)),
                    () =>
                      bouncyPress(btnScales[2], () => {
                        setRunning(false);
                        setSeconds(0);
                      }),
                  ];

                  return (
                    <View
                      key={label}
                      style={isLandscape ? s.btnRowWithLabel : undefined}
                    >
                      {isLandscape && (
                        <Text style={s.btnLabelLandscape}>{label}</Text>
                      )}
                      <Animated.View
                        style={{ transform: [{ scale: btnScales[idx] }] }}
                      >
                        <TouchableOpacity
                          onPress={onPresses[idx]}
                          disabled={disabledCond[idx]}
                          activeOpacity={0.88}
                          style={[
                            s.btn,
                            {
                              width: btnSize,
                              height: btnSize,
                              borderRadius: btnSize / 2,
                            },
                            btnStyles[idx],
                            disabledCond[idx] && s.btnDisabled,
                          ]}
                        >
                          {icons[idx]}
                        </TouchableOpacity>
                      </Animated.View>
                    </View>
                  );
                })}
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
    overflow: "hidden",
    shadowColor: C.dark,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 24,
  },
  safeArea: { flex: 1 },

  // Header
  header: {
    paddingTop: 14,
    paddingHorizontal: 24,
    paddingBottom: 0,
    alignItems: "center",
  },
  headerLandscape: { paddingTop: 6 },
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
    marginBottom: 10,
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

  // Body layouts
  body: { flex: 1, alignItems: "center", justifyContent: "center" },
  // Portrait: stack vertically
  bodyColumn: {
    flexDirection: "column",
    gap: 36,
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  // Landscape: side by side
  bodyRow: {
    flexDirection: "row",
    gap: 0,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },

  // Vertical separator in landscape
  verticalDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: C.peachMid,
    marginHorizontal: 28,
    alignSelf: "stretch",
    marginVertical: 8,
  },

  // Card
  card: {
    backgroundColor: C.peach,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: "center",
    overflow: "hidden",
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 10,
    alignSelf: "center",
  },
  cardLandscape: {
    flex: 1,
    alignSelf: "center",
  },
  cardGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.accent,
    borderRadius: 28,
  },

  timeRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  unit: { alignItems: "center", gap: 6, minWidth: 64 },
  digit: {
    fontFamily: "Georgia",
    fontWeight: "600",
    color: C.dark,
    letterSpacing: -1.5,
    opacity: 0.88,
  },
  digitRunning: { opacity: 1, color: C.accent },
  unitLabel: {
    fontFamily: "Georgia",
    fontSize: 9,
    letterSpacing: 3,
    color: C.dark,
    opacity: 0.3,
    textTransform: "uppercase",
  },
  unitLabelRunning: { color: C.accent, opacity: 0.6 },
  sep: {
    fontFamily: "Georgia",
    fontWeight: "200",
    color: C.peachMid,
    marginBottom: 16,
    opacity: 0.7,
  },

  // Controls panel
  controls: { alignItems: "center" },
  // Portrait: compact column
  controlsPortrait: { gap: 12 },
  // Landscape: centered column taking right half
  controlsLandscape: { gap: 16, justifyContent: "center", flex: 1 },

  // Button groups
  btnGroup: { alignItems: "center" },
  btnGroupRow: { flexDirection: "row", gap: 20 }, // portrait
  btnGroupColumn: {
    flexDirection: "column",
    gap: 14,
    alignItems: "flex-start",
  }, // landscape

  // Landscape: each button sits in a row with its text label on the left
  btnRowWithLabel: { flexDirection: "row", alignItems: "center", gap: 14 },
  btnLabelLandscape: {
    fontFamily: "Georgia",
    fontSize: 11,
    letterSpacing: 1.2,
    color: C.dark,
    opacity: 0.38,
    textTransform: "uppercase",
    width: 44,
    textAlign: "right",
  },

  // Portrait labels above button row
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

  // Buttons
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

  // Status pill
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
