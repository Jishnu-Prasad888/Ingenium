import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
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
  CheckCircle2,
  Edit3,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Save,
  Search,
  SkipForward,
  Trash2,
  X,
} from "lucide-react-native";
import { colors } from "../theme/colors";
import { useApp } from "../context/AppContext";
import StorageService, { Routine, RoutineStep } from "../services/StorageService";
import { generateSyncId } from "../utils/helpers";
import DeleteConfirmationPopup from "../components/DeleteConfirmationPopup";

type Mode = "timer" | "routine" | "stopwatch";
type RoutineView = "list" | "detail" | "active";
type UndoDelete =
  | {
      type: "routine";
      routine: Routine;
      message: string;
    }
  | {
      type: "timer";
      routineId: string;
      step: RoutineStep;
      index: number;
      message: string;
    };

const routineColors = [
  colors.backgroundFolder,
  colors.backgroundCard,
  "#FDE68A",
  "#BBF7D0",
  "#BFDBFE",
  "#FBCFE8",
];

const confettiPieces = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  left: `${8 + ((index * 17) % 84)}%` as `${number}%`,
  color: routineColors[index % routineColors.length],
  drift: index % 2 === 0 ? -28 : 28,
  fall: 150 + (index % 5) * 18,
  rotate: `${90 + index * 23}deg`,
}));

const seedTimestamp = 1700000000000;

const makeSeedStep = (
  routineId: string,
  id: string,
  name: string,
  seconds: number,
  position: number,
): RoutineStep => ({
  id,
  routineId,
  name,
  seconds,
  position,
  createdAt: seedTimestamp,
  updatedAt: seedTimestamp,
  syncStatus: "synced",
});

const routineSeed: Routine[] = [
  {
    id: "focus",
    name: "Focus Warmup",
    color: colors.backgroundFolder,
    createdAt: seedTimestamp,
    updatedAt: seedTimestamp,
    syncStatus: "synced",
    steps: [
      makeSeedStep("focus", "breathe", "Breathe", 60, 0),
      makeSeedStep("focus", "plan", "Plan", 180, 1),
      makeSeedStep("focus", "deep", "Deep Work", 900, 2),
    ],
  },
  {
    id: "stretch",
    name: "Desk Stretch",
    color: colors.backgroundCard,
    createdAt: seedTimestamp + 1,
    updatedAt: seedTimestamp + 1,
    syncStatus: "synced",
    steps: [
      makeSeedStep("stretch", "neck", "Neck", 45, 0),
      makeSeedStep("stretch", "shoulder", "Shoulders", 60, 1),
      makeSeedStep("stretch", "hands", "Hands", 45, 2),
    ],
  },
  {
    id: "reset",
    name: "Quick Reset",
    color: colors.backgroundFolder,
    createdAt: seedTimestamp + 2,
    updatedAt: seedTimestamp + 2,
    syncStatus: "synced",
    steps: [
      makeSeedStep("reset", "walk", "Walk", 120, 0),
      makeSeedStep("reset", "water", "Water", 30, 1),
      makeSeedStep("reset", "return", "Return", 30, 2),
    ],
  },
  {
    id: "evening",
    name: "Evening Close",
    color: colors.backgroundCard,
    createdAt: seedTimestamp + 3,
    updatedAt: seedTimestamp + 3,
    syncStatus: "synced",
    steps: [
      makeSeedStep("evening", "review", "Review", 300, 0),
      makeSeedStep("evening", "clean", "Clean Up", 180, 1),
      makeSeedStep("evening", "tomorrow", "Tomorrow", 120, 2),
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

const parseTimerInput = (value: string, fallbackSeconds: number) => {
  const trimmed = value.trim();
  if (!trimmed) return fallbackSeconds;

  if (!trimmed.includes(":")) {
    const seconds = Number(trimmed);
    return Number.isFinite(seconds) && seconds > 0 ? seconds : fallbackSeconds;
  }

  const pieces = trimmed.split(":").map((piece) => Number(piece) || 0);
  if (pieces.length !== 3) return fallbackSeconds;

  const seconds = pieces[0] * 3600 + pieces[1] * 60 + pieces[2];
  return seconds > 0 ? seconds : fallbackSeconds;
};

const TimerRoutineScreen: React.FC = () => {
  const { setCurrentScreen } = useApp();
  const routineNameInputRef = useRef<TextInput>(null);
  const lastTouchAtRef = useRef(Date.now());
  const celebrationPulse = useRef(new Animated.Value(0)).current;
  const confettiProgress = useRef(new Animated.Value(0)).current;
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [mode, setMode] = useState<Mode>("timer");
  const [routineView, setRoutineView] = useState<RoutineView>("list");
  const [routines, setRoutines] = useState<Routine[]>(routineSeed);
  const [selectedRoutineId, setSelectedRoutineId] = useState(routineSeed[0].id);
  const [routineSearchQuery, setRoutineSearchQuery] = useState("");
  const [selectedColorFilter, setSelectedColorFilter] = useState<string | null>(null);
  const [stepTimeDrafts, setStepTimeDrafts] = useState<Record<string, string>>({});
  const [isEditingRoutine, setIsEditingRoutine] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(5 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [activeSecondsLeft, setActiveSecondsLeft] = useState(
    routineSeed[0].steps[0].seconds,
  );
  const [routineRunning, setRoutineRunning] = useState(false);
  const [completionPending, setCompletionPending] = useState(false);
  const [routineCompleteVisible, setRoutineCompleteVisible] = useState(false);
  const [completedRoutineName, setCompletedRoutineName] = useState(
    routineSeed[0].name,
  );
  const [showDeleteRoutineConfirm, setShowDeleteRoutineConfirm] = useState(false);
  const [undoDelete, setUndoDelete] = useState<UndoDelete | null>(null);

  const selectedRoutine = useMemo(
    () =>
      routines.find((routine) => routine.id === selectedRoutineId) ??
      routines[0] ??
      routineSeed[0],
    [routines, selectedRoutineId],
  );

  const activeStep = selectedRoutine.steps[activeStepIndex];
  const upcomingStep = selectedRoutine.steps[activeStepIndex + 1];
  const filteredRoutines = useMemo(() => {
    const searchLower = routineSearchQuery.trim().toLowerCase();

    return routines.filter((routine) => {
      const matchesSearch =
        !searchLower || routine.name.toLowerCase().includes(searchLower);
      const matchesColor = !selectedColorFilter || routine.color === selectedColorFilter;
      return matchesSearch && matchesColor;
    });
  }, [routines, routineSearchQuery, selectedColorFilter]);

  useEffect(() => {
    const loadRoutines = async () => {
      try {
        const storedRoutines = await StorageService.getRoutines();

        if (storedRoutines.length > 0) {
          setRoutines(storedRoutines);
          setSelectedRoutineId(storedRoutines[0].id);
          return;
        }

        for (const routine of routineSeed) {
          await StorageService.saveRoutine(routine);
        }
        setRoutines(routineSeed);
        setSelectedRoutineId(routineSeed[0].id);
      } catch (error) {
        console.error("Error loading routines:", error);
      }
    };

    loadRoutines();

    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);

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
        setCompletedRoutineName(selectedRoutine.name || "Routine");
        setCompletionPending(true);
        lastTouchAtRef.current = Date.now();
        return 0;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeStepIndex, routineRunning, selectedRoutine.steps]);

  useEffect(() => {
    if (!completionPending || routineCompleteVisible) return;

    const interval = setInterval(() => {
      if (Date.now() - lastTouchAtRef.current >= 3000) {
        setCompletionPending(false);
        setRoutineCompleteVisible(true);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [completionPending, routineCompleteVisible]);

  useEffect(() => {
    if (!routineCompleteVisible) return;

    celebrationPulse.setValue(0);
    confettiProgress.setValue(0);

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(celebrationPulse, {
          toValue: 1,
          duration: 780,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(celebrationPulse, {
          toValue: 0,
          duration: 780,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );
    const confettiAnimation = Animated.loop(
      Animated.timing(confettiProgress, {
        toValue: 1,
        duration: 1900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    );

    pulseAnimation.start();
    confettiAnimation.start();

    return () => {
      pulseAnimation.stop();
      confettiAnimation.stop();
    };
  }, [celebrationPulse, confettiProgress, routineCompleteVisible]);

  const showMode = (nextMode: Mode) => {
    setMode(nextMode);
    setCompletionPending(false);
    setRoutineCompleteVisible(false);
    if (nextMode === "routine") {
      setRoutineView("list");
    }
  };

  const saveRoutine = async (routine: Routine) => {
    try {
      await StorageService.saveRoutine(routine);
    } catch (error) {
      console.error("Error saving routine:", error);
    }
  };

  const updateRoutine = (
    routineId: string,
    updater: (routine: Routine) => Routine,
  ) => {
    const currentRoutine = routines.find((routine) => routine.id === routineId);
    if (!currentRoutine) return;

    const updatedRoutine: Routine = {
      ...updater(currentRoutine),
      updatedAt: Date.now(),
      syncStatus: "pending",
    };

    setRoutines((current) =>
      current.map((routine) =>
        routine.id === routineId ? updatedRoutine : routine,
      ),
    );
    saveRoutine(updatedRoutine);
  };

  const showUndoDelete = (nextUndo: UndoDelete) => {
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }

    setUndoDelete(nextUndo);
    undoTimeoutRef.current = setTimeout(() => {
      setUndoDelete(null);
      undoTimeoutRef.current = null;
    }, 3000);
  };

  const dismissUndoDelete = () => {
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }

    setUndoDelete(null);
  };

  const restoreDeletedItem = async () => {
    if (!undoDelete) return;

    const itemToRestore = undoDelete;
    dismissUndoDelete();

    if (itemToRestore.type === "routine") {
      setRoutines((current) => [itemToRestore.routine, ...current]);
      setSelectedRoutineId(itemToRestore.routine.id);
      setActiveStepIndex(0);
      setActiveSecondsLeft(itemToRestore.routine.steps[0]?.seconds ?? 0);
      await saveRoutine({
        ...itemToRestore.routine,
        updatedAt: Date.now(),
        syncStatus: "pending",
      });
      setRoutineView("detail");
      return;
    }

    updateRoutine(itemToRestore.routineId, (routine) => {
      const steps = [...routine.steps];
      steps.splice(itemToRestore.index, 0, itemToRestore.step);

      return {
        ...routine,
        steps: steps.map((step, index) => ({
          ...step,
          position: index,
          updatedAt: Date.now(),
          syncStatus: "pending",
        })),
      };
    });
  };

  const openRoutine = (routine: Routine) => {
    setSelectedRoutineId(routine.id);
    setActiveStepIndex(0);
    setActiveSecondsLeft(routine.steps[0]?.seconds ?? 0);
    setRoutineRunning(false);
    setIsEditingRoutine(false);
    setStepTimeDrafts({});
    setCompletionPending(false);
    setRoutineCompleteVisible(false);
    setRoutineView("detail");
  };

  const startRoutine = (routine: Routine) => {
    setSelectedRoutineId(routine.id);
    setActiveStepIndex(0);
    setActiveSecondsLeft(routine.steps[0]?.seconds ?? 0);
    setRoutineRunning(true);
    setCompletionPending(false);
    setRoutineCompleteVisible(false);
    setRoutineView("active");
  };

  const resetRoutine = () => {
    setRoutineRunning(false);
    setActiveStepIndex(0);
    setActiveSecondsLeft(selectedRoutine.steps[0]?.seconds ?? 0);
    setCompletionPending(false);
    setRoutineCompleteVisible(false);
  };

  const skipStep = () => {
    const nextIndex = activeStepIndex + 1;
    if (nextIndex < selectedRoutine.steps.length) {
      setActiveStepIndex(nextIndex);
      setActiveSecondsLeft(selectedRoutine.steps[nextIndex].seconds);
    } else {
      setRoutineRunning(false);
      setActiveSecondsLeft(0);
      setCompletedRoutineName(selectedRoutine.name || "Routine");
      setCompletionPending(true);
      lastTouchAtRef.current = Date.now();
    }
  };

  const createRoutine = async () => {
    const now = Date.now();
    const routineId = generateSyncId();
    const newRoutine: Routine = {
      id: routineId,
      name: "Untitled Routine",
      color: selectedColorFilter ?? routineColors[0],
      createdAt: now,
      updatedAt: now,
      syncStatus: "pending",
      steps: [
        {
          id: generateSyncId(),
          routineId,
          name: "Timer 1",
          seconds: 60,
          position: 0,
          createdAt: now,
          updatedAt: now,
          syncStatus: "pending",
        },
      ],
    };

    setRoutines((current) => [newRoutine, ...current]);
    await saveRoutine(newRoutine);
    setSelectedRoutineId(newRoutine.id);
    setActiveStepIndex(0);
    setActiveSecondsLeft(newRoutine.steps[0].seconds);
    setRoutineRunning(false);
    setIsEditingRoutine(true);
    setStepTimeDrafts({});
    setRoutineView("detail");
    requestAnimationFrame(() => routineNameInputRef.current?.focus());
  };

  const deleteRoutine = async () => {
    if (!selectedRoutine) return;

    try {
      const routineToDelete = selectedRoutine;
      await StorageService.deleteRoutine(selectedRoutine.id);
      const remainingRoutines = routines.filter(
        (routine) => routine.id !== selectedRoutine.id,
      );
      setRoutines(remainingRoutines);

      if (remainingRoutines.length > 0) {
        setSelectedRoutineId(remainingRoutines[0].id);
        setActiveStepIndex(0);
        setActiveSecondsLeft(remainingRoutines[0].steps[0]?.seconds ?? 0);
      }

      setRoutineRunning(false);
      setRoutineView("list");
      setShowDeleteRoutineConfirm(false);
      showUndoDelete({
        type: "routine",
        routine: routineToDelete,
        message: "Routine deleted",
      });
    } catch (error) {
      console.error("Error deleting routine:", error);
      Alert.alert("Delete failed", "Could not delete this routine.");
    }
  };

  const updateStep = (
    stepId: string,
    updates: Partial<Pick<RoutineStep, "name" | "seconds">>,
  ) => {
    updateRoutine(selectedRoutine.id, (routine) => ({
      ...routine,
      steps: routine.steps.map((step) =>
        step.id === stepId
          ? {
              ...step,
              ...updates,
              updatedAt: Date.now(),
              syncStatus: "pending",
            }
          : step,
      ),
    }));
  };

  const addStep = () => {
    const now = Date.now();

    updateRoutine(selectedRoutine.id, (routine) => ({
      ...routine,
      steps: [
        ...routine.steps,
        {
          id: generateSyncId(),
          routineId: routine.id,
          name: `Timer ${routine.steps.length + 1}`,
          seconds: 60,
          position: routine.steps.length,
          createdAt: now,
          updatedAt: now,
          syncStatus: "pending",
        },
      ],
    }));
  };

  const updateRoutineName = (name: string) => {
    updateRoutine(selectedRoutine.id, (routine) => ({
      ...routine,
      name,
    }));
  };

  const updateRoutineColor = (color: string) => {
    updateRoutine(selectedRoutine.id, (routine) => ({
      ...routine,
      color,
    }));
  };

  const enterRoutineEditMode = () => {
    setIsEditingRoutine(true);
    requestAnimationFrame(() => routineNameInputRef.current?.focus());
  };

  const saveRoutineEdits = () => {
    const drafts = stepTimeDrafts;

    if (Object.keys(drafts).length > 0) {
      updateRoutine(selectedRoutine.id, (routine) => ({
        ...routine,
        name: routine.name.trim() || "Untitled Routine",
        steps: routine.steps.map((step) => {
          const draft = drafts[step.id];

          if (draft === undefined) return step;

          return {
            ...step,
            seconds: parseTimerInput(draft, step.seconds),
            updatedAt: Date.now(),
            syncStatus: "pending",
          };
        }),
      }));
      setStepTimeDrafts({});
    } else if (!selectedRoutine.name.trim()) {
      updateRoutine(selectedRoutine.id, (routine) => ({
        ...routine,
        name: "Untitled Routine",
      }));
    }

    setIsEditingRoutine(false);
  };

  const deleteStep = (stepId: string) => {
    if (selectedRoutine.steps.length <= 1) {
      Alert.alert("Keep one timer", "A routine needs at least one timer.");
      return;
    }

    const deletedStep = selectedRoutine.steps.find((step) => step.id === stepId);
    const deletedIndex = selectedRoutine.steps.findIndex((step) => step.id === stepId);
    if (!deletedStep || deletedIndex < 0) return;

    updateRoutine(selectedRoutine.id, (routine) =>
      ({
        ...routine,
        steps: routine.steps
          .filter((step) => step.id !== stepId)
          .map((step, index) => ({
            ...step,
            position: index,
            updatedAt: Date.now(),
            syncStatus: "pending",
          })),
      }),
    );
    showUndoDelete({
      type: "timer",
      routineId: selectedRoutine.id,
      step: deletedStep,
      index: deletedIndex,
      message: "Timer deleted",
    });
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
      <View style={styles.routineSearchBar}>
        <Search size={17} color={colors.textSecondary} />
        <TextInput
          value={routineSearchQuery}
          onChangeText={setRoutineSearchQuery}
          placeholder="Search routines"
          placeholderTextColor={colors.textSecondary}
          style={styles.routineSearchInput}
        />
        {!!routineSearchQuery && (
          <TouchableOpacity
            accessibilityLabel="Clear routine search"
            onPress={() => setRoutineSearchQuery("")}
            style={styles.clearSearchButton}
          >
            <X size={15} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.colorFilterRow}>
        <TouchableOpacity
          accessibilityLabel="Show all routines"
          onPress={() => setSelectedColorFilter(null)}
          style={[
            styles.clearFilterButton,
            !selectedColorFilter && styles.clearFilterButtonActive,
          ]}
        >
          <Text style={styles.clearFilterText}>Clear</Text>
        </TouchableOpacity>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.colorFilterList}
        >
          {routineColors.map((color) => (
            <TouchableOpacity
              key={color}
              accessibilityLabel={`Filter ${color} routines`}
              onPress={() => setSelectedColorFilter(color)}
              style={[
                styles.colorDot,
                { backgroundColor: color },
                selectedColorFilter === color && styles.colorDotActive,
              ]}
            />
          ))}
        </ScrollView>
        <TouchableOpacity
          accessibilityLabel="Add new routine"
          onPress={createRoutine}
          style={styles.addRoutineButton}
        >
          <Plus size={16} color={colors.primary} />
          <Text style={styles.addRoutineText}>Routine</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        contentContainerStyle={styles.routineList}
        showsVerticalScrollIndicator={false}
      >
        {filteredRoutines.map((routine) => (
          <TouchableOpacity
            key={routine.id}
            activeOpacity={0.85}
            onPress={() => openRoutine(routine)}
            style={[styles.routineCard, { backgroundColor: routine.color }]}
          >
            <View style={styles.routineSummary}>
              <Text numberOfLines={1} style={styles.routineName}>
                {routine.name || "Untitled Routine"}
              </Text>
              <Text style={styles.routineMeta}>
                {routine.steps.length} timer{routine.steps.length === 1 ? "" : "s"}
              </Text>
            </View>
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
        {filteredRoutines.length === 0 && (
          <Text style={styles.emptyRoutineText}>No routines found</Text>
        )}
      </ScrollView>
      <Text style={styles.helperText}>
        Tap a routine to edit its timers
      </Text>
      {renderModeTabs()}
    </View>
  );

  const renderRoutineDetail = () => (
    <View style={[styles.screenBody, styles.routineDetailBody]}>
      <View style={styles.detailTopBar}>
        <TouchableOpacity
          accessibilityLabel="Back to routines"
          onPress={() => setRoutineView("list")}
          style={styles.iconButton}
        >
          <ArrowLeft size={28} color={colors.text} strokeWidth={2.8} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            accessibilityLabel={isEditingRoutine ? "Save routine" : "Edit routine"}
            onPress={isEditingRoutine ? saveRoutineEdits : enterRoutineEditMode}
            style={styles.iconButton}
          >
            {isEditingRoutine ? (
              <Save size={24} color={colors.primary} />
            ) : (
              <Edit3 size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel="Delete routine"
            onPress={() => setShowDeleteRoutineConfirm(true)}
            style={styles.iconButton}
          >
            <Trash2 size={26} color={colors.primary} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>
      <TextInput
        ref={routineNameInputRef}
        value={selectedRoutine.name}
        onChangeText={updateRoutineName}
        editable={isEditingRoutine}
        placeholder="Routine name"
        placeholderTextColor={colors.textSecondary}
        style={[styles.detailTitle, !isEditingRoutine && styles.lockedText]}
      />
      <View style={styles.detailColorRow}>
        {routineColors.map((color) => (
          <TouchableOpacity
            key={color}
            accessibilityLabel={`Set routine color ${color}`}
            onPress={() => updateRoutineColor(color)}
            disabled={!isEditingRoutine}
            style={[
              styles.colorDot,
              { backgroundColor: color },
              selectedRoutine.color === color && styles.colorDotActive,
              !isEditingRoutine && styles.lockedColorDot,
            ]}
          />
        ))}
      </View>
      <View style={styles.stepsPanel}>
        <ScrollView
          style={styles.stepsScroll}
          contentContainerStyle={styles.stepsScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {selectedRoutine.steps.map((step) => (
            <View key={step.id} style={styles.stepRow}>
              <TextInput
                value={step.name}
                onChangeText={(name) => updateStep(step.id, { name })}
                editable={isEditingRoutine}
                style={[
                  styles.stepText,
                  styles.stepNameInput,
                  !isEditingRoutine && styles.lockedText,
                ]}
              />
              <TextInput
                value={stepTimeDrafts[step.id] ?? formatTime(step.seconds)}
                onChangeText={(value) =>
                  setStepTimeDrafts((drafts) => ({
                    ...drafts,
                    [step.id]: value,
                  }))
                }
                onEndEditing={({ nativeEvent }) => {
                  updateStep(step.id, {
                    seconds: parseTimerInput(nativeEvent.text, step.seconds),
                  });
                  setStepTimeDrafts((drafts) => {
                    const nextDrafts = { ...drafts };
                    delete nextDrafts[step.id];
                    return nextDrafts;
                  });
                }}
                editable={isEditingRoutine}
                keyboardType="numbers-and-punctuation"
                style={[
                  styles.stepText,
                  styles.stepTimeInput,
                  !isEditingRoutine && styles.lockedText,
                ]}
              />
              {isEditingRoutine && (
                <TouchableOpacity
                  accessibilityLabel="Delete step"
                  onPress={() => deleteStep(step.id)}
                  style={styles.stepIcon}
                >
                  <Trash2 size={24} color={colors.primary} strokeWidth={2.4} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
      {isEditingRoutine && (
        <TouchableOpacity
          accessibilityLabel="Add timer"
          onPress={addStep}
          style={styles.addTimerButton}
        >
          <Plus size={16} color={colors.primary} />
          <Text style={styles.addTimerText}>Timer</Text>
        </TouchableOpacity>
      )}
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
        <Text
          numberOfLines={1}
          style={[styles.nextStep, !upcomingStep && styles.completeNextStep]}
        >
          {upcomingStep?.name ?? "Complete"}
        </Text>
      </View>
    </View>
  );

  const renderRoutineComplete = () => (
    <View style={styles.completeScreen}>
      <View pointerEvents="none" style={styles.confettiLayer}>
        {confettiPieces.map((piece) => (
          <Animated.View
            key={piece.id}
            style={[
              styles.confettiPiece,
              {
                left: piece.left,
                backgroundColor: piece.color,
                opacity: confettiProgress.interpolate({
                  inputRange: [0, 0.12, 0.82, 1],
                  outputRange: [0, 1, 1, 0],
                }),
                transform: [
                  {
                    translateX: confettiProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, piece.drift],
                    }),
                  },
                  {
                    translateY: confettiProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-28, piece.fall],
                    }),
                  },
                  {
                    rotate: confettiProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0deg", piece.rotate],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>

      <Animated.View
        style={[
          styles.completeBadge,
          {
            transform: [
              {
                scale: celebrationPulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.08],
                }),
              },
            ],
          },
        ]}
      >
        <CheckCircle2 size={64} color="#166534" strokeWidth={2.4} />
      </Animated.View>
      <Text style={styles.completeTitle}>Routine Complete</Text>
      <Text numberOfLines={2} style={styles.completeRoutineName}>
        {completedRoutineName}
      </Text>
      <TouchableOpacity
        accessibilityLabel="Back to routines"
        onPress={() => {
          setRoutineCompleteVisible(false);
          setCompletionPending(false);
          setRoutineView("list");
        }}
        style={styles.completeButton}
      >
        <Text style={styles.completeButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRoutine = () => {
    if (routineView === "detail") return renderRoutineDetail();
    if (routineView === "active") return renderActiveRoutine();
    return renderRoutineList();
  };

  const renderUndoSnackbar = () => {
    if (!undoDelete) return null;

    return (
      <View style={styles.snackbar}>
        <Text numberOfLines={1} style={styles.snackbarText}>
          {undoDelete.message}
        </Text>
        <TouchableOpacity
          accessibilityLabel="Restore deleted item"
          onPress={restoreDeletedItem}
          style={styles.snackbarAction}
        >
          <Text style={styles.snackbarActionText}>Restore</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView
      onTouchStart={() => {
        lastTouchAtRef.current = Date.now();
      }}
      style={styles.safeArea}
    >
      {routineCompleteVisible && renderRoutineComplete()}
      {!routineCompleteVisible && mode === "timer" && renderTimer()}
      {!routineCompleteVisible && mode === "routine" && renderRoutine()}
      {!routineCompleteVisible && mode === "stopwatch" && renderStopwatch()}
      {renderUndoSnackbar()}
      <DeleteConfirmationPopup
        visible={showDeleteRoutineConfirm}
        onCancel={() => setShowDeleteRoutineConfirm(false)}
        onConfirm={deleteRoutine}
        title="Delete routine?"
        message="This routine and its timers will be removed."
        itemName={selectedRoutine.name || "Untitled Routine"}
        warning="You can restore it for 3 seconds."
      />
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
  routineDetailBody: {
    paddingBottom: 78,
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
    color: colors.primary,
    fontFamily: "serif",
    fontSize: 18,
    fontWeight: "500",
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
    fontSize: 18,
    fontWeight: "600",
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
    fontSize: 12,
    fontWeight: "600",
  },
  routineSearchBar: {
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.backgroundCard,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  routineSearchInput: {
    flex: 1,
    minWidth: 0,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 0,
  },
  clearSearchButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  colorFilterRow: {
    minHeight: 40,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  colorFilterList: {
    alignItems: "center",
    gap: 8,
    paddingRight: 4,
  },
  clearFilterButton: {
    height: 28,
    borderRadius: 8,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.backgroundAlt,
  },
  clearFilterButtonActive: {
    backgroundColor: colors.backgroundCard,
  },
  clearFilterText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "500",
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.shadow,
  },
  colorDotActive: {
    borderWidth: 3,
    borderColor: colors.primary,
  },
  lockedColorDot: {
    opacity: 0.72,
  },
  addRoutineButton: {
    height: 34,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: colors.backgroundCard,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  addRoutineText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "500",
  },
  routineList: {
    paddingTop: 12,
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
    color: colors.primary,
    fontFamily: "serif",
    fontSize: 15,
    fontWeight: "500",
  },
  routineSummary: {
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  routineMeta: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
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
    fontFamily: "serif",
    fontSize: 9,
    textAlign: "center",
    marginBottom: 18,
  },
  detailTitle: {
    color: colors.primary,
    fontFamily: "serif",
    fontSize: 17,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 20,
    paddingVertical: 0,
  },
  detailColorRow: {
    minHeight: 36,
    marginTop: -10,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  stepsPanel: {
    flex: 1,
    minHeight: 0,
    borderRadius: 14,
    backgroundColor: colors.backgroundAlt,
    padding: 8,
    marginBottom: 12,
  },
  stepsScroll: {
    flex: 1,
  },
  stepsScrollContent: {
    gap: 14,
    paddingBottom: 2,
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
    fontSize: 14,
    fontWeight: "500",
    paddingVertical: 0,
  },
  lockedText: {
    opacity: 0.8,
  },
  stepNameInput: {
    flex: 1,
    minWidth: 80,
  },
  stepTimeInput: {
    width: 104,
    textAlign: "center",
  },
  stepIcon: {
    width: 34,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  addTimerButton: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 12,
    backgroundColor: colors.backgroundCard,
  },
  addTimerText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "500",
  },
  emptyRoutineText: {
    color: colors.textSecondary,
    fontFamily: "serif",
    fontSize: 14,
    textAlign: "center",
    marginTop: 28,
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
    fontSize: 15,
    fontWeight: "600",
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
    fontSize: 15,
    fontWeight: "600",
    paddingHorizontal: 12,
  },
  completeNextStep: {
    backgroundColor: "#BBF7D0",
    color: "#166534",
  },
  completeScreen: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  confettiPiece: {
    position: "absolute",
    top: 40,
    width: 10,
    height: 18,
    borderRadius: 3,
  },
  completeBadge: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#166534",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 6,
  },
  completeTitle: {
    color: colors.white,
    fontFamily: "serif",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 24,
  },
  completeRoutineName: {
    color: "#ECFDF5",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
  },
  completeButton: {
    minWidth: 116,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    paddingHorizontal: 18,
  },
  completeButtonText: {
    color: "#166534",
    fontSize: 14,
    fontWeight: "700",
  },
  snackbar: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 28,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.text,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 8,
  },
  snackbarText: {
    flex: 1,
    minWidth: 0,
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
  },
  snackbarAction: {
    minHeight: 34,
    borderRadius: 9,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.backgroundCard,
  },
  snackbarActionText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
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
    fontSize: 12,
    fontWeight: "600",
  },
});

export default TimerRoutineScreen;
