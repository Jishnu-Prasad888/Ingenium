import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Timer, AlarmClock, Clock, Settings } from "lucide-react-native";
import TimerModal from "./TimerModal";

const COLORS = {
  bg: "#FFF9EF",
  dark: "#2A1510",
  peach: "#F7D5CA",
  peachMid: "#f0b8a5",
  accent: "#d4836a",
  overlay: "rgba(42,21,16,0.45)",
};

// FIX 1: Panel width constant used in both the style and the animation start value
//         so they always match. Old code used -280 start but 230 wide panel.
const PANEL_WIDTH = 230;

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  onItemPress: (key: string) => void;
  onClosed?: () => void;
}

const ITEMS = [
  { key: "timer", label: "Timer", icon: Timer },
  { key: "alarm", label: "Alarm", icon: AlarmClock },
  { key: "stopwatch", label: "Stopwatch", icon: Clock },
  { key: "settings", label: "Settings", icon: Settings },
];

interface BurgerIconProps {
  open: boolean;
}

function BurgerIcon({ open }: BurgerIconProps) {
  const prog = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(prog, {
      toValue: open ? 1 : 0,
      useNativeDriver: true,
      tension: 200,
      friction: 14,
    }).start();
  }, [open]);

  const topTY = prog.interpolate({ inputRange: [0, 1], outputRange: [0, 7.5] });
  const topRot = prog.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });
  const midOp = prog.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [1, 0, 0],
  });
  const midSc = prog.interpolate({ inputRange: [0, 1], outputRange: [1, 0.2] });
  const botTY = prog.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -7.5],
  });
  const botRot = prog.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-45deg"],
  });

  return (
    <View style={bi.wrap} pointerEvents="none">
      <Animated.View
        style={[
          bi.bar,
          { transform: [{ translateY: topTY }, { rotate: topRot }] },
        ]}
      />
      <Animated.View
        style={[bi.bar, { opacity: midOp, transform: [{ scaleX: midSc }] }]}
      />
      <Animated.View
        style={[
          bi.bar,
          { transform: [{ translateY: botTY }, { rotate: botRot }] },
        ]}
      />
    </View>
  );
}

const bi = StyleSheet.create({
  wrap: {
    width: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  bar: {
    width: 22,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: COLORS.dark,
  },
});

function Drawer({ open, onClose, onItemPress, onClosed }: DrawerProps) {
  // FIX 2: Start at -PANEL_WIDTH (not -280) so the initial position matches the panel
  const slideX = useRef(new Animated.Value(-PANEL_WIDTH)).current;
  const backdropOp = useRef(new Animated.Value(0)).current;
  const itemAnims = useRef(ITEMS.map(() => new Animated.Value(0))).current;
  const [mounted, setMounted] = useState(false);

  // FIX 3: Track in-flight animation so we can cancel it on rapid open/close toggles
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (open) {
      // Cancel any in-flight close animation
      if (animRef.current) {
        animRef.current.stop();
        animRef.current = null;
      }

      setMounted(true);

      // FIX 4: Reset values synchronously before starting — prevents stale mid-values
      //         on rapid re-opens
      slideX.setValue(-PANEL_WIDTH);
      backdropOp.setValue(0);
      itemAnims.forEach((a) => a.setValue(0));

      // FIX 5: Use requestAnimationFrame to ensure the component has painted before
      //         we start stagger animations (avoids invisible first-frame flash)
      requestAnimationFrame(() => {
        const slideAndFade = Animated.parallel([
          Animated.spring(slideX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 90,
            friction: 14,
          }),
          Animated.timing(backdropOp, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
        ]);

        const stagger = Animated.stagger(
          55,
          itemAnims.map((a) =>
            Animated.spring(a, {
              toValue: 1,
              useNativeDriver: true,
              tension: 220,
              friction: 12,
            }),
          ),
        );

        // Run slide/fade first, then stagger items once panel is visible
        const combined = Animated.parallel([slideAndFade, stagger]);
        animRef.current = combined;
        combined.start(({ finished }) => {
          if (finished) animRef.current = null;
        });
      });
    } else {
      // Cancel any in-flight open animation
      if (animRef.current) {
        animRef.current.stop();
        animRef.current = null;
      }

      // FIX 6: Close target uses -(PANEL_WIDTH + 20) for a clean overshoot exit
      const closeAnim = Animated.parallel([
        Animated.spring(slideX, {
          toValue: -(PANEL_WIDTH + 20),
          useNativeDriver: true,
          tension: 100,
          friction: 14,
        }),
        Animated.timing(backdropOp, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]);
      animRef.current = closeAnim;
      closeAnim.start(({ finished }) => {
        animRef.current = null;
        if (finished) {
          setMounted(false);
          onClosed?.();
        }
      });
    }
  }, [open]);

  if (!mounted) return null;

  return (
    <>
      <Animated.View
        style={[d.backdrop, { opacity: backdropOp }]}
        pointerEvents={open ? "auto" : "none"}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
      </Animated.View>

      <Animated.View style={[d.panel, { transform: [{ translateX: slideX }] }]}>
        <SafeAreaView edges={["top", "left", "bottom"]} style={d.panelInner}>
          <View style={d.divider} />

          <View style={d.navList}>
            {ITEMS.map((item, i) => {
              const scale = itemAnims[i].interpolate({
                inputRange: [0, 1],
                outputRange: [0.65, 1],
              });
              const opacity = itemAnims[i];
              const translateX = itemAnims[i].interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              });
              const Icon = item.icon;

              return (
                <Animated.View
                  key={item.key}
                  style={{ transform: [{ scale }, { translateX }], opacity }}
                >
                  <TouchableOpacity
                    style={d.navItem}
                    onPress={() => onItemPress(item.key)}
                    activeOpacity={0.65}
                  >
                    <View style={d.navIconWrap}>
                      <Icon size={18} color={COLORS.dark} />
                    </View>
                    <Text style={d.navLabel}>{item.label}</Text>
                    <Text style={d.navChevron}>›</Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

          <View style={d.footer}>
            <View style={d.footerDot} />
            <Text style={d.footerText}>v1.0.0</Text>
          </View>
        </SafeAreaView>
      </Animated.View>
    </>
  );
}

const d = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
    zIndex: 50,
  },
  panel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: PANEL_WIDTH,
    backgroundColor: COLORS.bg,
    zIndex: 60,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 8, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 24,
  },
  panelInner: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.peach,
    marginHorizontal: 22,
    marginBottom: 14,
  },
  navList: {
    flex: 1,
    paddingHorizontal: 12,
    gap: 2,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 14,
  },
  navIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.peach,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: {
    flex: 1,
    fontFamily: "Georgia",
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.dark,
  },
  navChevron: {
    fontSize: 22,
    color: COLORS.peachMid,
    fontWeight: "300",
    lineHeight: 24,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 18,
  },
  footerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.peachMid,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.peachMid,
    fontFamily: "Georgia",
    letterSpacing: 0.5,
  },
});

export default function BurgerMenu() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);
  const btnScale = useRef(new Animated.Value(1)).current;
  // FIX 7: Use a ref for pendingAction so it's always fresh inside the onClosed closure
  //         (useState is captured at closure creation time; refs are not)
  const pendingActionRef = useRef<string | null>(null);

  const toggleDrawer = () => {
    Animated.sequence([
      Animated.spring(btnScale, {
        toValue: 0.82,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.spring(btnScale, {
        toValue: 1.1,
        useNativeDriver: true,
        tension: 300,
        friction: 8,
      }),
      Animated.spring(btnScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 10,
      }),
    ]).start();
    setDrawerOpen((v) => !v);
  };

  const handleItemPress = (key: string) => {
    pendingActionRef.current = key;
    setDrawerOpen(false);
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <SafeAreaView
        edges={["top", "left"]}
        style={m.btnSafe}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[m.btnWrap, { transform: [{ scale: btnScale }] }]}
        >
          <TouchableOpacity
            onPress={toggleDrawer}
            activeOpacity={1}
            style={m.btn}
          >
            <BurgerIcon open={drawerOpen} />
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onItemPress={handleItemPress}
        onClosed={() => {
          // FIX 8: Read from ref (always current) instead of stale state closure
          if (pendingActionRef.current === "timer") {
            setTimerOpen(true);
          }
          pendingActionRef.current = null;
        }}
      />

      <TimerModal visible={timerOpen} onClose={() => setTimerOpen(false)} />
    </View>
  );
}

const m = StyleSheet.create({
  btnSafe: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 90,
  },
  btnWrap: {
    margin: 16,
  },
  btn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
