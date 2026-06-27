import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Edit3,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Trash2,
} from "lucide-react-native";
import { colors } from "../theme/colors";
import { useApp } from "../context/AppContext";

type Mode = "timer" | "routine" | "stopwatch";
type RoutineView = "list" | "detail" | "active";

type RoutineStep = {
  id: string;
  name: string;
  seconds: number;
};

type Routine = {
  id: string;
  name: string;
  color: string;
  steps: RoutineStep[];
};

const routineSeed: Routine[] = [
  {
    id: "focus",
    name: "Focus Warmup",
    color: colors.backgroundFolder,
    steps: [
      { id: "breathe", name: "Breathe", seconds: 60 },
      { id: "plan", name: "Plan", seconds: 180 },
      { id: "deep", name: "Deep Work", seconds: 900 },
    ],
  },
  {
    id: "stretch",
    name: "Desk Stretch",
    color: colors.backgroundCard,
    steps: [
      { id: "neck", name: "Neck", seconds: 45 },
      { id: "shoulder", name: "Shoulders", seconds: 60 },
      { id: "hands", name: "Hands", seconds: 45 },
    ],
  },
  {
    id: "reset",
    name: "Quick Reset",
    color: colors.backgroundFolder,
    steps: [
      { id: "walk", name: "Walk", seconds: 120 },
      { id: "water", name: "Water", seconds: 30 },
      { id: "return", name: "Return", seconds: 30 },
    ],
  },
  {
    id: "evening",
    name: "Evening Close",
    color: colors.backgroundCard,
    steps: [
      { id: "review", name: "Review", seconds: 300 },
      { id: "clean", name: "Clean Up", seconds: 180 },
      { id: "tomorrow", name: "Tomorrow", seconds: 120 },
    ],
  },
];

const formatTime = (totalSeconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, "0"))
    .join(":");
};

const TimerRoutineScreen: React.FC = () => {
  const { setCurrentScreen } = useApp();
  const [mode, setMode] = useState<Mode>("timer");
  const [routineView, setRoutineView] = useState<RoutineView>("list");
  const [routines, setRoutines] = useState<Routine[]>(routineSeed);
  const [selectedRoutineId, setSelectedRoutineId] = useState(routineSeed[0].id);
  const [timerSeconds, setTimerSeconds] = useState(5 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [activeSecondsLeft, setActiveSecondsLeft] = useState(
    routineSeed[0].steps[0].seconds,
  );
  const [routineRunning, setRoutineRunning] = useState(false);

  const selectedRoutine = useMemo(
    () => routines.find((routine) => routine.id === selectedRoutineId) ?? routines[0],
    [routines, selectedRoutineId],
  );

  const activeStep = selectedRoutine.steps[activeStepIndex];
  const upcomingStep = selectedRoutine.steps[activeStepIndex + 1];

  useEffect(() => {
    if (!timerRunning) return;

    const interval = setInterval(() => {
      setTimerSeconds((seconds) => {
        if (seconds <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning]);

  useEffect(() => {
    if (!stopwatchRunning) return;

    const interval = setInterval(() => {
      setStopwatchSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [stopwatchRunning]);

  useEffect(() => {
    if (!routineRunning) return;

    const interval = setInterval(() => {
      setActiveSecondsLeft((seconds) => {
        if (seconds > 1) return seconds - 1;

        const nextIndex = activeStepIndex + 1;
        if (nextIndex < selectedRoutine.steps.length) {
          setActiveStepIndex(nextIndex);
          return selectedRoutine.steps[nextIndex].seconds;
        }

        setRoutineRunning(false);
        return 0;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeStepIndex, routineRunning, selectedRoutine.steps]);

  const showMode = (nextMode: Mode) => {
    setMode(nextMode);
    if (nextMode === "routine") {
      setRoutineView("list");
    }
  };

  const openRoutine = (routine: Routine) => {
    setSelectedRoutineId(routine.id);
    setActiveStepIndex(0);
    setActiveSecondsLeft(routine.steps[0]?.seconds ?? 0);
    setRoutineRunning(false);
    setRoutineView("detail");
  };

  const startRoutine = (routine: Routine) => {
    setSelectedRoutineId(routine.id);
    setActiveStepIndex(0);
    setActiveSecondsLeft(routine.steps[0]?.seconds ?? 0);
    setRoutineRunning(true);
    setRoutineView("active");
  };

  const resetRoutine = () => {
    setRoutineRunning(false);
    setActiveStepIndex(0);
    setActiveSecondsLeft(selectedRoutine.steps[0]?.seconds ?? 0);
  };

  const skipStep = () => {
    const nextIndex = activeStepIndex + 1;
    if (nextIndex < selectedRoutine.steps.length) {
      setActiveStepIndex(nextIndex);
      setActiveSecondsLeft(selectedRoutine.steps[nextIndex].seconds);
    } else {
      setRoutineRunning(false);
      setActiveSecondsLeft(0);
    }
  };

  const updateStep = (
    stepId: string,
    updates: Partial<Pick<RoutineStep, "name" | "seconds">>,
  ) => {
    setRoutines((current) =>
      current.map((routine) =>
        routine.id === selectedRoutine.id
          ? {
              ...routine,
              steps: routine.steps.map((step) =>
                step.id === stepId ? { ...step, ...updates } : step,
              ),
            }
          : routine,
      ),
    );
  };

  const deleteStep = (stepId: string) => {
    setRoutines((current) =>
      current.map((routine) =>
        routine.id === selectedRoutine.id
          ? {
              ...routine,
              steps: routine.steps.filter((step) => step.id !== stepId),
            }
          : routine,
      ),
    );
  };

  const renderAppTopBar = (title: string) => (
    <View style={styles.topBar}>
      <TouchableOpacity
        accessibilityLabel="Back to notes"
        onPress={() => setCurrentScreen("notes-list")}
        style={styles.iconButton}
      >
        <ArrowLeft size={28} color={colors.text} strokeWidth={2.8} />
      </TouchableOpacity>
      <Text numberOfLines={1} style={styles.topTitle}>
        {title}
      </Text>
      <View style={styles.iconButton} />
    </View>
  );

  const renderControls = (
    running: boolean,
    onPlayPause: () => void,
    onReset: () => void,
    onSkip?: () => void,
  ) => (
    <View style={styles.controls}>
      {onSkip && (
        <TouchableOpacity
          accessibilityLabel="Skip"
          onPress={onSkip}
          style={styles.controlButton}
        >
          <SkipForward size={30} color={colors.primary} />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        accessibilityLabel={running ? "Pause" : "Play"}
        onPress={onPlayPause}
        style={styles.controlButton}
      >
        {running ? (
          <Pause size={30} fill={colors.primary} color={colors.primary} />
        ) : (
          <Play size={30} fill={colors.primary} color={colors.primary} />
        )}
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityLabel="Reset"
        onPress={onReset}
        style={styles.controlButton}
      >
        <RotateCcw size={31} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderModeTabs = () => (
    <View style={styles.modeTabs}>
      {(["timer", "routine", "stopwatch"] as Mode[]).map((item) => (
        <TouchableOpacity
          key={item}
          onPress={() => showMode(item)}
          style={[styles.modeTab, mode === item && styles.modeTabActive]}
        >
          <Text style={styles.modeTabText}>
            {item === "stopwatch" ? "stopwatch" : item[0].toUpperCase() + item.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTimer = () => (
    <View style={styles.screenBody}>
      {renderAppTopBar("Timer")}
      <View style={styles.clockWrap}>
        <View style={styles.timeCircle}>
          <Text style={styles.timeText}>{formatTime(timerSeconds)}</Text>
        </View>
      </View>
      {renderControls(
        timerRunning,
        () => setTimerRunning((running) => !running),
        () => {
          setTimerRunning(false);
          setTimerSeconds(5 * 60);
        },
      )}
      {renderModeTabs()}
    </View>
  );

  const renderStopwatch = () => (
    <View style={styles.screenBody}>
      {renderAppTopBar("Stopwatch")}
      <View style={styles.clockWrap}>
        <View style={styles.timeCircle}>
          <Text style={styles.timeText}>{formatTime(stopwatchSeconds)}</Text>
        </View>
      </View>
      {renderControls(
        stopwatchRunning,
        () => setStopwatchRunning((running) => !running),
        () => {
          setStopwatchRunning(false);
          setStopwatchSeconds(0);
        },
      )}
      {renderModeTabs()}
    </View>
  );

  const renderRoutineList = () => (
    <View style={styles.screenBody}>
      {renderAppTopBar("Routines")}
      <ScrollView
        contentContainerStyle={styles.routineList}
        showsVerticalScrollIndicator={false}
      >
        {routines.map((routine) => (
          <TouchableOpacity
            key={routine.id}
            activeOpacity={0.85}
            onPress={() => openRoutine(routine)}
            style={[styles.routineCard, { backgroundColor: routine.color }]}
          >
            <Text numberOfLines={1} style={styles.routineName}>
              {routine.name}
            </Text>
            <View style={styles.routineActions}>
              <TouchableOpacity
                accessibilityLabel={`Start ${routine.name}`}
                onPress={() => startRoutine(routine)}
                style={styles.smallIconButton}
              >
                <Play size={30} fill={colors.primary} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityLabel={`Open ${routine.name}`}
                onPress={() => openRoutine(routine)}
                style={styles.smallIconButton}
              >
                <RotateCcw size={26} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={styles.helperText}>
        click to enter . long press to select multiple and delete
      </Text>
      {renderModeTabs()}
    </View>
  );

  const renderRoutineDetail = () => (
    <View style={styles.screenBody}>
      <View style={styles.detailTopBar}>
        <TouchableOpacity
          accessibilityLabel="Back to routines"
          onPress={() => setRoutineView("list")}
          style={styles.iconButton}
        >
          <ArrowLeft size={28} color={colors.text} strokeWidth={2.8} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity accessibilityLabel="Edit routine" style={styles.iconButton}>
            <Edit3 size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity accessibilityLabel="Delete routine" style={styles.iconButton}>
            <Trash2 size={26} color={colors.primary} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>
      <Text numberOfLines={1} style={styles.detailTitle}>
        {selectedRoutine.name}
      </Text>
      <View style={styles.stepsPanel}>
        {selectedRoutine.steps.map((step) => (
          <View key={step.id} style={styles.stepRow}>
            <TextInput
              value={step.name}
              onChangeText={(name) => updateStep(step.id, { name })}
              style={[styles.stepText, styles.stepNameInput]}
            />
            <TextInput
              value={formatTime(step.seconds)}
              onChangeText={(value) => {
                const pieces = value.split(":").map((piece) => Number(piece) || 0);
                const seconds =
                  pieces.length === 3
                    ? pieces[0] * 3600 + pieces[1] * 60 + pieces[2]
                    : step.seconds;
                updateStep(step.id, { seconds });
              }}
              style={[styles.stepText, styles.stepTimeInput]}
            />
            <TouchableOpacity accessibilityLabel="Edit step" style={styles.stepIcon}>
              <Edit3 size={21} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel="Delete step"
              onPress={() => deleteStep(step.id)}
              style={styles.stepIcon}
            >
              <Trash2 size={24} color={colors.primary} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
      {renderControls(
        routineRunning,
        () => {
          setRoutineView("active");
          setRoutineRunning((running) => !running);
        },
        resetRoutine,
        skipStep,
      )}
    </View>
  );

  const renderActiveRoutine = () => (
    <View style={styles.screenBody}>
      <View style={styles.detailTopBar}>
        <TouchableOpacity
          accessibilityLabel="Back to routine"
          onPress={() => setRoutineView("detail")}
          style={styles.iconButton}
        >
          <ArrowLeft size={28} color={colors.text} strokeWidth={2.8} />
        </TouchableOpacity>
      </View>
      <View style={[styles.clockWrap, styles.activeClockWrap]}>
        <View style={styles.timeCircle}>
          <Text style={styles.timeText}>{formatTime(activeSecondsLeft)}</Text>
        </View>
      </View>
      {renderControls(
        routineRunning,
        () => setRoutineRunning((running) => !running),
        resetRoutine,
        skipStep,
      )}
      <View style={styles.upNext}>
        <Text numberOfLines={1} style={styles.currentStep}>
          {activeStep?.name ?? "Done"}
        </Text>
        <View style={styles.upNextLine}>
          <View style={styles.line} />
          <Text style={styles.upNextLabel}>Up Next</Text>
          <View style={styles.line} />
        </View>
        <Text numberOfLines={1} style={styles.nextStep}>
          {upcomingStep?.name ?? "Complete"}
        </Text>
      </View>
    </View>
  );

  const renderRoutine = () => {
    if (routineView === "detail") return renderRoutineDetail();
    if (routineView === "active") return renderActiveRoutine();
    return renderRoutineList();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {mode === "timer" && renderTimer()}
      {mode === "routine" && renderRoutine()}
      {mode === "stopwatch" && renderStopwatch()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 158,
  },
  topBar: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  topTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
  },
  detailTopBar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  clockWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 220,
  },
  activeClockWrap: {
    flex: 0.95,
  },
  timeCircle: {
    width: 184,
    height: 184,
    borderRadius: 92,
    borderWidth: 8,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.backgroundCard,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  timeText: {
    color: colors.text,
    fontSize: 25,
    fontWeight: "700",
  },
  controls: {
    minHeight: 98,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 26,
  },
  controlButton: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.backgroundFolder,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  modeTabs: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 78,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: colors.backgroundFolder,
    borderRadius: 20,
    padding: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modeTab: {
    flex: 1,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modeTabActive: {
    backgroundColor: colors.backgroundCard,
  },
  modeTabText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  routineList: {
    paddingTop: 16,
    paddingHorizontal: 2,
    gap: 12,
  },
  routineCard: {
    minHeight: 58,
    borderRadius: 12,
    paddingLeft: 22,
    paddingRight: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  routineName: {
    flex: 1,
    color: colors.text,
    fontSize: 23,
    fontWeight: "700",
    marginRight: 10,
  },
  routineActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  smallIconButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  helperText: {
    color: colors.text,
    fontSize: 11,
    textAlign: "center",
    marginBottom: 18,
  },
  detailTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 28,
  },
  stepsPanel: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: colors.backgroundAlt,
    padding: 10,
    gap: 14,
  },
  stepRow: {
    minHeight: 58,
    borderRadius: 12,
    backgroundColor: colors.backgroundCard,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  stepText: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "700",
    paddingVertical: 0,
  },
  stepNameInput: {
    flex: 1,
    minWidth: 80,
  },
  stepTimeInput: {
    width: 118,
    textAlign: "center",
  },
  stepIcon: {
    width: 34,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  upNext: {
    alignItems: "center",
    paddingHorizontal: 28,
    gap: 8,
  },
  currentStep: {
    width: 230,
    minHeight: 33,
    borderRadius: 8,
    backgroundColor: colors.backgroundCard,
    textAlign: "center",
    textAlignVertical: "center",
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
    paddingHorizontal: 12,
  },
  nextStep: {
    width: 230,
    minHeight: 33,
    borderRadius: 8,
    backgroundColor: colors.backgroundAlt,
    textAlign: "center",
    textAlignVertical: "center",
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
    paddingHorizontal: 12,
  },
  upNextLine: {
    width: 248,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: colors.text,
  },
  upNextLabel: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
  },
});

export default TimerRoutineScreen;
