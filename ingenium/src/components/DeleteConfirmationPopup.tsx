import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Animated,
  Pressable,
  TouchableWithoutFeedback,
  Easing,
} from "react-native";
import { colors } from "../theme/colors";

interface Props {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  itemName?: string;
}

const DeleteConfirmationPopup: React.FC<Props> = ({
  visible,
  onConfirm,
  onCancel,
  title = "Delete item?",
  message = "This action will permanently remove the item.",
  itemName,
}) => {
  const scale = useRef(new Animated.Value(0.92)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          damping: 18,
          stiffness: 160,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.92,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="none">
      <TouchableWithoutFeedback onPress={onCancel}>
        <Animated.View style={[styles.overlay, { opacity }]} />
      </TouchableWithoutFeedback>

      <View style={styles.centerWrapper}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity,
              transform: [{ scale }],
            },
          ]}
        >
          <Text style={styles.title}>{title}</Text>

          <Text style={styles.message}>{message}</Text>

          {itemName && (
            <View style={styles.itemBox}>
              <Text style={styles.itemLabel}>Item</Text>
              <Text style={styles.itemName}>{itemName}</Text>
            </View>
          )}

          <Text style={styles.warning}>This action cannot be undone.</Text>

          <View style={styles.actions}>
            <AnimatedButton
              label="Cancel"
              onPress={onCancel}
              style={styles.cancelButton}
              textStyle={styles.cancelText}
            />

            <AnimatedButton
              label="Delete"
              onPress={onConfirm}
              style={styles.deleteButton}
              textStyle={styles.deleteText}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const AnimatedButton = ({ label, onPress, style, textStyle }: any) => {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      onPressIn={() =>
        Animated.spring(scale, {
          toValue: 0.96,
          useNativeDriver: true,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }).start()
      }
      onPress={onPress}
      style={{ flex: 1 }}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        <Text style={textStyle}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  centerWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  container: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.backgroundCard,
    borderRadius: 18,
    padding: 28,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 10,
  },

  title: {
    fontSize: 21,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginBottom: 10,
  },

  message: {
    fontSize: 15.5,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 20,
  },

  itemBox: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 10,
    padding: 14,
    marginBottom: 18,
  },

  itemLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    color: colors.textSecondary,
    marginBottom: 4,
  },

  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },

  warning: {
    fontSize: 13.5,
    fontStyle: "italic",
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },

  actions: {
    flexDirection: "row",
    gap: 14,
  },

  cancelButton: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },

  cancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },

  deleteButton: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.error,
    alignItems: "center",
  },

  deleteText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.white,
  },
});

export default DeleteConfirmationPopup;
