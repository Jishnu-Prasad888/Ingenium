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

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  onItemPress: (key: string) => void;
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

function Drawer({ open, onClose, onItemPress }: DrawerProps) {
  const slideX = useRef(new Animated.Value(-280)).current;
  const backdropOp = useRef(new Animated.Value(0)).current;
  const itemAnims = useRef(ITEMS.map(() => new Animated.Value(0))).current;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      slideX.setValue(-280);
      itemAnims.forEach((a) => a.setValue(0));

      Animated.parallel([
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
      ]).start();

      Animated.stagger(
        55,
        itemAnims.map((a) =>
          Animated.spring(a, {
            toValue: 1,
            useNativeDriver: true,
            tension: 220,
            friction: 12,
          }),
        ),
      ).start();
    } else {
      Animated.parallel([
        Animated.spring(slideX, {
          toValue: -300,
          useNativeDriver: true,
          tension: 100,
          friction: 14,
        }),
        Animated.timing(backdropOp, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setMounted(false);
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
    width: 230,
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
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
  },
  brandIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: COLORS.peach,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  brandName: {
    fontFamily: "Georgia",
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.dark,
    letterSpacing: 0.5,
  },
  brandSub: {
    fontSize: 11,
    color: COLORS.accent,
    fontFamily: "Georgia",
    marginTop: 1,
    letterSpacing: 0.3,
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
    setDrawerOpen(false);

    if (key === "timer") {
      setTimeout(() => {
        setTimerOpen(true);
      }, 250); // match drawer close animation duration
    }
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
    backgroundColor: COLORS.peach,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 6,
  },
});
