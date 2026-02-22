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
import { Play, Pause, RotateCcw, X, Sun, Moon } from "lucide-react-native";

interface TimerModalProps {
  visible: boolean;
  onClose: () => void;
}

// ── Themes ────────────────────────────────────────────────────────
const LIGHT = {
  bg: "#FFF9EF",
  sheet: "#FFF9EF",
  card: "#F7D5CA",
  cardGlow: "#d4836a",
  dark: "#2A1510",
  peach: "#F7D5CA",
  peachMid: "#f0b8a5",
  accent: "#d4836a",
  accentLight: "#f5c4b4",
  muted: "rgba(42,21,16,0.35)",
  overlay: "rgba(42,21,16,0.6)",
  divider: "#f0b8a5",
  handle: "#f0b8a5",
  titleOp: 0.45,
  digitOp: 0.88,
  sepColor: "#f0b8a5",
  btnGhost: "#f0b8a5",
  statusBg: "#F7D5CA",
  statusActive: "#2A1510",
  themeBtnBg: "#F7D5CA",
  themeBtnIcon: "#2A1510",
  snow: "#f0b8a5",
  labelOp: 0.35,
};

const DARK = {
  bg: "#17130F",
  sheet: "#17130F",

  card: "#221B14",
  cardGlow: "#FF9F43",

  dark: "#FFF4EA",

  peach: "#2A2118",
  peachMid: "#33281D",

  accent: "#A3FF12",
  accentLight: "#C8FF6A",

  muted: "rgba(255,244,234,0.35)",
  overlay: "rgba(0,0,0,0.65)",

  divider: "#33281D",
  handle: "#3C2F22",

  titleOp: 0.65,
  digitOp: 1,

  sepColor: "#463726",
  btnGhost: "#463726",

  statusBg: "#2A2118",
  statusActive: "#A3FF12",

  themeBtnBg: "#2A2118",
  themeBtnIcon: "#FFF4EA",

  snow: "#463726",
  labelOp: 0.55,
};

type Theme = typeof LIGHT;

// ── Snow ──────────────────────────────────────────────────────────
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
  const peak = 0.45 + Math.random() * 0.3;
  const fall = Animated.sequence([
    Animated.delay(flake.delay),
    Animated.parallel([
      Animated.sequence([
        Animated.timing(flake.opacity, {
          toValue: peak,
          duration: flake.duration * 0.15,
          useNativeDriver: true,
        }),
        Animated.timing(flake.opacity, {
          toValue: peak,
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

function Snow({
  width,
  height,
  color,
}: {
  width: number;
  height: number;
  color: string;
}) {
  const flakesRef = useRef<Flake[]>(makeFlakes());
  useEffect(() => {
    const flakes = flakesRef.current;
    flakes.forEach((f) => animateFlake(f, width, height));
    return () =>
      flakes.forEach((f) => {
        f.y.stopAnimation();
        f.x.stopAnimation();
        f.opacity.stopAnimation();
      });
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
            backgroundColor: color,
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

// ── Main Component ────────────────────────────────────────────────
export default function TimerModal({ visible, onClose }: TimerModalProps) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [isDark, setIsDark] = useState(false);

  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  // mounted controls whether the Modal is in the tree at all
  const [mounted, setMounted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // KEY FIX: initialise FAR offscreen so the very first paint is never at y=0
  const slideAnim = useRef(new Animated.Value(2000)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const btnScales = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;
  const themeBtnScale = useRef(new Animated.Value(1)).current;

  const isOpenRef = useRef(false);
  const openAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const T: Theme = isDark ? DARK : LIGHT;

  const toggleTheme = () => {
    Animated.sequence([
      Animated.spring(themeBtnScale, {
        toValue: 0.8,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.spring(themeBtnScale, {
        toValue: 1.15,
        useNativeDriver: true,
        tension: 300,
        friction: 8,
      }),
      Animated.spring(themeBtnScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 10,
      }),
    ]).start();
    setIsDark((v) => !v);
  };

  // Open/close — mount THEN animate, unmount only after close animation finishes
  useEffect(() => {
    if (openAnimRef.current) {
      openAnimRef.current.stop();
      openAnimRef.current = null;
    }

    if (visible) {
      // 1. Reset position & opacity synchronously BEFORE mounting so first paint is offscreen
      slideAnim.setValue(height + 300);
      backdropAnim.setValue(0);
      // 2. Mount the Modal
      setMounted(true);
      isOpenRef.current = true;
      // 3. Animate in on the next frame — after mount paint
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
      // Animate out first, then unmount
      const anim = Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: height + 300,
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
          setMounted(false);
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

  useEffect(() => {
    if (running)
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
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

  const btnSize = isLandscape ? 50 : 60;
  const iconSize = isLandscape ? 17 : 21;
  const digitFontSize = isLandscape
    ? Math.min(height * 0.18, 48)
    : Math.min(width * 0.155, 64);
  const cardMaxWidth = isLandscape ? width * 0.48 : width - 48;
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, isDark ? 0.12 : 0.06],
  });

  return (
    <Modal
      transparent
      visible={mounted}
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
        barStyle={isDark ? "light-content" : "dark-content"}
      />

      <Animated.View
        style={[
          s.backdrop,
          { opacity: backdropAnim, backgroundColor: T.overlay },
        ]}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
      </Animated.View>

      <Animated.View
        style={[
          s.sheet,
          { backgroundColor: T.sheet, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Snow width={width} height={height} color={T.snow} />

        <SafeAreaView
          edges={["top", "bottom", "left", "right"]}
          style={s.safeArea}
        >
          {/* Header */}
          <View style={[s.header, isLandscape && s.headerLandscape]}>
            {!isLandscape && (
              <View style={[s.handle, { backgroundColor: T.handle }]} />
            )}
            <View style={s.headerRow}>
              <Text style={[s.title, { color: T.dark, opacity: T.titleOp }]}>
                TIMER
              </Text>

              {/* Theme toggle */}
              <Animated.View
                style={[s.themeBtn, { transform: [{ scale: themeBtnScale }] }]}
              >
                <TouchableOpacity
                  onPress={toggleTheme}
                  style={[s.themeBtnInner, { backgroundColor: T.themeBtnBg }]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.8}
                >
                  {isDark ? (
                    <Sun size={13} color={T.themeBtnIcon} strokeWidth={2.2} />
                  ) : (
                    <Moon size={13} color={T.themeBtnIcon} strokeWidth={2.2} />
                  )}
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity
                onPress={onClose}
                style={[s.closeBtn, { backgroundColor: T.peach }]}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <X size={13} color={T.dark} strokeWidth={2.8} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[s.divider, { backgroundColor: T.divider }]} />

          {/* Body */}
          <View style={[s.body, isLandscape ? s.bodyRow : s.bodyColumn]}>
            {/* Time card */}
            <Animated.View
              style={[
                s.card,
                {
                  backgroundColor: T.card,
                  maxWidth: cardMaxWidth,
                  transform: [{ scale: pulseAnim }],
                },
                isLandscape && s.cardLandscape,
              ]}
            >
              <Animated.View
                style={[
                  s.cardGlow,
                  { backgroundColor: T.cardGlow, opacity: glowOpacity },
                ]}
              />
              <View style={s.timeRow}>
                {/* HRS */}
                <View style={s.unit}>
                  <Text
                    style={[
                      s.digit,
                      {
                        fontSize: digitFontSize,
                        color: T.dark,
                        opacity: T.digitOp,
                      },
                    ]}
                  >
                    {pad(hrs)}
                  </Text>
                  <Text
                    style={[s.unitLabel, { color: T.dark, opacity: T.labelOp }]}
                  >
                    HRS
                  </Text>
                </View>
                <Text
                  style={[
                    s.sep,
                    { fontSize: digitFontSize * 0.6, color: T.sepColor },
                  ]}
                >
                  :
                </Text>
                {/* MIN */}
                <View style={s.unit}>
                  <Text
                    style={[
                      s.digit,
                      {
                        fontSize: digitFontSize,
                        color: T.dark,
                        opacity: T.digitOp,
                      },
                    ]}
                  >
                    {pad(mins)}
                  </Text>
                  <Text
                    style={[s.unitLabel, { color: T.dark, opacity: T.labelOp }]}
                  >
                    MIN
                  </Text>
                </View>
                <Text
                  style={[
                    s.sep,
                    { fontSize: digitFontSize * 0.6, color: T.sepColor },
                  ]}
                >
                  :
                </Text>
                {/* SEC */}
                <View style={s.unit}>
                  <Text
                    style={[
                      s.digit,
                      {
                        fontSize: digitFontSize,
                        color: running ? T.accent : T.dark,
                        opacity: running ? 1 : T.digitOp,
                      },
                    ]}
                  >
                    {pad(secs)}
                  </Text>
                  <Text
                    style={[
                      s.unitLabel,
                      {
                        color: running ? T.accent : T.dark,
                        opacity: running ? 0.65 : T.labelOp,
                      },
                    ]}
                  >
                    SEC
                  </Text>
                </View>
              </View>
            </Animated.View>

            {isLandscape && (
              <View
                style={[s.verticalDivider, { backgroundColor: T.divider }]}
              />
            )}

            {/* Controls */}
            <View
              style={[
                s.controls,
                isLandscape ? s.controlsLandscape : s.controlsPortrait,
              ]}
            >
              {!isLandscape && (
                <View style={s.labelRow}>
                  {["Start", "Pause", "Reset"].map((l) => (
                    <Text
                      key={l}
                      style={[
                        s.btnLabel,
                        { width: btnSize, color: T.dark, opacity: T.labelOp },
                      ]}
                    >
                      {l}
                    </Text>
                  ))}
                </View>
              )}

              <View
                style={[
                  s.btnGroup,
                  isLandscape ? s.btnGroupColumn : s.btnGroupRow,
                ]}
              >
                {(["Start", "Pause", "Reset"] as const).map((label, idx) => {
                  const icons = [
                    <Play
                      size={iconSize}
                      color={isDark ? T.bg : "#FFF9EF"}
                      fill={isDark ? T.bg : "#FFF9EF"}
                    />,
                    <Pause size={iconSize} color={T.dark} fill={T.dark} />,
                    <RotateCcw
                      size={iconSize}
                      color={T.dark}
                      strokeWidth={2.2}
                    />,
                  ];
                  const bgColors = [T.dark, T.peachMid, "transparent"];
                  const disabled = [running, !running, false];
                  const onPress = [
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
                        <Text
                          style={[
                            s.btnLabelLandscape,
                            { color: T.dark, opacity: T.labelOp },
                          ]}
                        >
                          {label}
                        </Text>
                      )}
                      <Animated.View
                        style={{ transform: [{ scale: btnScales[idx] }] }}
                      >
                        <TouchableOpacity
                          onPress={onPress[idx]}
                          disabled={disabled[idx]}
                          activeOpacity={0.88}
                          style={[
                            s.btn,
                            idx === 2 && s.btnNoShadow,
                            {
                              width: btnSize,
                              height: btnSize,
                              borderRadius: btnSize / 2,
                              backgroundColor: bgColors[idx],
                            },
                            idx === 2 && {
                              borderWidth: 1.5,
                              borderColor: T.btnGhost,
                            },
                            disabled[idx] && s.btnDisabled,
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
              <View
                style={[
                  s.statusPill,
                  { backgroundColor: running ? T.statusActive : T.statusBg },
                ]}
              >
                <View
                  style={[
                    s.statusDot,
                    { backgroundColor: running ? T.accentLight : T.muted },
                  ]}
                />
                <Text
                  style={[
                    s.statusText,
                    {
                      color: running ? (isDark ? T.bg : "#FFF9EF") : T.dark,
                      opacity: running ? 0.9 : 0.45,
                    },
                  ]}
                >
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
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
    shadowColor: "#000",
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
  headerLandscape: { paddingTop: 6 },
  handle: { width: 36, height: 4, borderRadius: 2, marginBottom: 16 },
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
    letterSpacing: 5,
  },

  themeBtn: { position: "absolute", left: 0 },
  themeBtnInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: {
    position: "absolute",
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 24 },

  body: { flex: 1, alignItems: "center", justifyContent: "center" },
  bodyColumn: {
    flexDirection: "column",
    gap: 36,
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  bodyRow: {
    flexDirection: "row",
    gap: 0,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },

  verticalDivider: {
    width: StyleSheet.hairlineWidth,
    marginHorizontal: 28,
    alignSelf: "stretch",
    marginVertical: 8,
  },

  card: {
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: "center",
    overflow: "hidden",
    alignSelf: "center",
    shadowColor: "#d4836a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 10,
  },
  cardLandscape: { flex: 1, alignSelf: "center" },
  cardGlow: { ...StyleSheet.absoluteFillObject, borderRadius: 28 },

  timeRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  unit: { alignItems: "center", gap: 6, minWidth: 64 },
  digit: { fontFamily: "Georgia", fontWeight: "600", letterSpacing: -1.5 },
  unitLabel: {
    fontFamily: "Georgia",
    fontSize: 9,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  sep: {
    fontFamily: "Georgia",
    fontWeight: "200",
    marginBottom: 16,
    opacity: 0.7,
  },

  controls: { alignItems: "center" },
  controlsPortrait: { gap: 12 },
  controlsLandscape: { gap: 16, justifyContent: "center", flex: 1 },

  btnGroup: { alignItems: "center" },
  btnGroupRow: { flexDirection: "row", gap: 20 },
  btnGroupColumn: {
    flexDirection: "column",
    gap: 14,
    alignItems: "flex-start",
  },

  btnRowWithLabel: { flexDirection: "row", alignItems: "center", gap: 14 },
  btnLabelLandscape: {
    fontFamily: "Georgia",
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    width: 44,
    textAlign: "right",
  },
  labelRow: { flexDirection: "row", gap: 20, alignItems: "center" },
  btnLabel: {
    textAlign: "center",
    fontFamily: "Georgia",
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },

  btn: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  btnNoShadow: { shadowOpacity: 0, elevation: 0 },
  btnDisabled: { opacity: 0.2 },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: {
    fontFamily: "Georgia",
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});
