import React, { useState, useEffect, useRef } from "react";
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
};

export default function TimerModal({ visible, onClose }: TimerModalProps) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const slideAnim = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const btnScales = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;
  const [mounted, setMounted] = useState(false);

  // Open / close
  useEffect(() => {
    if (visible) {
      setMounted(true);
      slideAnim.setValue(height + 200);
      Animated.parallel([
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
      ]).start();
    } else {
      Animated.parallel([
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
      ]).start(({ finished }) => {
        if (finished) {
          setMounted(false);
          setRunning(false);
          setSeconds(0);
        }
      });
    }
  }, [visible, height]);

  // Re-snap sheet to 0 after rotation so it never drifts off-screen
  useEffect(() => {
    if (visible && mounted) {
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
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.028,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      Animated.spring(pulseAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 10,
      }).start();
    }
  }, [running]);

  // Tick
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running]);

  const bouncyPress = (anim: Animated.Value, cb: () => void) => {
    Animated.sequence([
      Animated.spring(anim, {
        toValue: 0.82,
        useNativeDriver: true,
        tension: 350,
        friction: 10,
      }),
      Animated.spring(anim, {
        toValue: 1.12,
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
    cb();
  };

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  const timeStr =
    hrs > 0
      ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}`
      : `${pad(mins)}:${pad(secs)}`;

  // Clock and button sizes adapt to orientation
  const clockSize = isLandscape
    ? Math.min(height * 0.66, width * 0.34, 240)
    : Math.min(width * 0.72, height * 0.34, 300);

  const btnSize = isLandscape ? 54 : 64;
  const iconSize = isLandscape ? 19 : 22;

  const ticks = Array.from({ length: 60 }, (_, i) => i);
  const secondAngle = (secs / 60) * 360 - 90;
  const minuteAngle = ((mins + secs / 60) / 60) * 360 - 90;
  const hourAngle = (((hrs % 12) + mins / 60) / 12) * 360 - 90;

  const statusLabel = running ? "Running" : seconds > 0 ? "Paused" : "Ready";

  if (!mounted) return null;

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
        barStyle="dark-content"
      />

      {/* Backdrop */}
      <Animated.View style={[s.backdrop, { opacity: backdropAnim }]}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Sheet — fills entire screen */}
      <Animated.View
        style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}
      >
        <SafeAreaView
          edges={["top", "bottom", "left", "right"]}
          style={s.safeArea}
        >
          {/* ── Header ── */}
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

          {/* ── Body ── switches column ↔ row on rotation ── */}
          <View
            style={[s.body, isLandscape ? s.bodyLandscape : s.bodyPortrait]}
          >
            {/* Clock face */}
            <Animated.View
              style={[
                s.clock,
                {
                  width: clockSize,
                  height: clockSize,
                  borderRadius: clockSize / 2,
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              {/* Inner ring */}
              <View
                style={{
                  position: "absolute",
                  width: clockSize - 10,
                  height: clockSize - 10,
                  borderRadius: (clockSize - 10) / 2,
                  borderWidth: 1,
                  borderColor: C.peachMid,
                  top: 5,
                  left: 5,
                }}
              />

              {/* Tick marks */}
              {ticks.map((i) => {
                const angle = (i / 60) * 2 * Math.PI;
                const isMajor = i % 5 === 0;
                const r = clockSize / 2 - (isMajor ? 16 : 10);
                const x = clockSize / 2 + r * Math.sin(angle);
                const y = clockSize / 2 - r * Math.cos(angle);
                return (
                  <View
                    key={i}
                    style={{
                      position: "absolute",
                      left: x - (isMajor ? 1.5 : 0.75),
                      top: y - (isMajor ? 4.5 : 2),
                      width: isMajor ? 3 : 1.5,
                      height: isMajor ? 9 : 4,
                      borderRadius: 2,
                      backgroundColor: isMajor ? C.dark : C.peachMid,
                      opacity: isMajor ? 0.8 : 0.4,
                      transform: [{ rotate: `${(i / 60) * 360}deg` }],
                    }}
                  />
                );
              })}

              {/* Hour hand */}
              <View
                style={[
                  s.hand,
                  {
                    width: 4.5,
                    height: clockSize * 0.22,
                    left: clockSize / 2 - 2.25,
                    top: clockSize / 2 - clockSize * 0.22,
                    backgroundColor: C.dark,
                    borderRadius: 3,
                    transform: [
                      { translateY: (clockSize * 0.22) / 2 },
                      { rotate: `${hourAngle}deg` },
                      { translateY: -((clockSize * 0.22) / 2) },
                    ],
                  },
                ]}
              />

              {/* Minute hand */}
              <View
                style={[
                  s.hand,
                  {
                    width: 3,
                    height: clockSize * 0.31,
                    left: clockSize / 2 - 1.5,
                    top: clockSize / 2 - clockSize * 0.31,
                    backgroundColor: C.dark,
                    borderRadius: 3,
                    transform: [
                      { translateY: (clockSize * 0.31) / 2 },
                      { rotate: `${minuteAngle}deg` },
                      { translateY: -((clockSize * 0.31) / 2) },
                    ],
                  },
                ]}
              />

              {/* Second hand */}
              <View
                style={[
                  s.hand,
                  {
                    width: 1.5,
                    height: clockSize * 0.38,
                    left: clockSize / 2 - 0.75,
                    top: clockSize / 2 - clockSize * 0.38,
                    backgroundColor: C.accent,
                    borderRadius: 2,
                    transform: [
                      { translateY: (clockSize * 0.38) / 2 },
                      { rotate: `${secondAngle}deg` },
                      { translateY: -((clockSize * 0.38) / 2) },
                    ],
                  },
                ]}
              />

              {/* Center dot */}
              <View
                style={[
                  s.centerDot,
                  { left: clockSize / 2 - 7, top: clockSize / 2 - 7 },
                ]}
              />

              {/* Digital readout */}
              <Text
                style={[
                  s.timeText,
                  {
                    fontSize: clockSize * 0.13,
                    bottom: clockSize * 0.13,
                  },
                ]}
              >
                {timeStr}
              </Text>
            </Animated.View>

            {/* ── Controls panel ── */}
            <View
              style={[
                s.controls,
                isLandscape ? s.controlsLandscape : s.controlsPortrait,
              ]}
            >
              {/* Portrait: labels above, landscape: labels to the left */}
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
                {/* Landscape: labels stacked beside buttons */}

                {/* Start */}
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

                {/* Pause */}
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

                {/* Reset */}
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
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.overlay,
  },
  sheet: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: C.bg,
    shadowColor: C.dark,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.2,
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
  headerLandscape: {
    paddingTop: 8,
  },
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
    opacity: 0.5,
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

  // Body
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bodyPortrait: {
    flexDirection: "column",
    gap: 40,
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  bodyLandscape: {
    flexDirection: "row",
    gap: 40,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },

  // Clock hands
  hand: { position: "absolute" },
  clock: {
    backgroundColor: C.peach,
    shadowColor: C.dark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.13,
    shadowRadius: 26,
    elevation: 12,
  },
  centerDot: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: C.dark,
    zIndex: 10,
    shadowColor: C.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  timeText: {
    position: "absolute",
    fontFamily: "Georgia",
    color: C.dark,
    fontWeight: "600",
    letterSpacing: 2,
    textAlign: "center",
    width: "100%",
    opacity: 0.65,
  },

  // Controls
  controls: {
    alignItems: "center",
  },
  controlsPortrait: {
    gap: 12,
  },
  controlsLandscape: {
    gap: 14,
    justifyContent: "center",
  },

  // Button group — portrait = row, landscape = column
  btnGroup: {
    alignItems: "center",
  },
  btnGroupPortrait: {
    flexDirection: "row",
    gap: 18,
  },
  btnGroupLandscape: {
    flexDirection: "column",
    gap: 12,
  },

  // Portrait labels above
  labelRow: {
    flexDirection: "row",
    gap: 18,
    alignItems: "center",
  },
  // Landscape labels to the left of buttons
  labelsLandscape: {
    flexDirection: "column",
    gap: 12,
    marginRight: 10,
    alignItems: "flex-end",
  },

  btnLabel: {
    textAlign: "center",
    fontFamily: "Georgia",
    fontSize: 10,
    letterSpacing: 1.4,
    color: C.dark,
    opacity: 0.38,
    textTransform: "uppercase",
  },

  // Buttons
  btn: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.dark,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  btnPrimary: { backgroundColor: C.dark },
  btnSecondary: { backgroundColor: C.peachMid },
  btnGhost: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: C.peachMid,
    shadowOpacity: 0,
    elevation: 0,
  },
  btnDisabled: { opacity: 0.22 },

  // Status pill
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: 24,
    backgroundColor: C.peach,
  },
  statusPillActive: { backgroundColor: C.dark },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: C.muted,
  },
  statusDotActive: { backgroundColor: C.accentLight },
  statusText: {
    fontFamily: "Georgia",
    fontSize: 11,
    letterSpacing: 1.8,
    color: C.dark,
    opacity: 0.55,
    textTransform: "uppercase",
  },
  statusTextActive: { color: C.peach, opacity: 0.9 },
});
