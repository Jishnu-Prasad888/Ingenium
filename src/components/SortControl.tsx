import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ChevronDown, SortAsc, SortDesc, ChevronUp } from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { colors } from "../theme/colors";
const SortControl: React.FC = () => {
  const { sortBy, setSortBy } = useApp();
  const [open, setOpen] = useState(false);

  const options = [
    {
      key: "date-asc",
      label: "Date",
      icon: <SortAsc size={16} color={colors.text} />,
    },
    {
      key: "date-desc",
      label: "Date",
      icon: <SortDesc size={16} color={colors.text} />,
    },
    {
      key: "alpha-asc",
      label: "A → Z",
      icon: <SortAsc size={16} color={colors.text} />,
    },
    {
      key: "alpha-desc",
      label: "Z → A",
      icon: <SortDesc size={16} color={colors.text} />,
    },
  ];

  const selectedOption = options.find((o) => o.key === sortBy) || options[0];

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setOpen((prev) => !prev)}
        activeOpacity={0.8}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {selectedOption.icon}
          <Text style={styles.buttonText}>{selectedOption.label}</Text>
        </View>
        {open ? (
          <ChevronUp size={16} color={colors.text} />
        ) : (
          <ChevronDown size={16} color={colors.text} />
        )}
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdownWrapper}>
          <View style={styles.dropdown}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={styles.option}
                onPress={() => {
                  setSortBy(option.key);
                  setOpen(false);
                }}
                activeOpacity={0.85}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  {option.icon}
                  <Text style={styles.optionText}>{option.label}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-end",
    marginBottom: 12,
    paddingHorizontal: 20,
    zIndex: 100,
    elevation: 100,
  },

  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.backgroundCard,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 120,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },

  buttonText: {
    color: colors.text,
    fontWeight: "600",
    fontFamily: "SpaceGrotesk_600SemiBold",
  },

  dropdownWrapper: {
    position: "absolute",
    top: 48,
    right: 20,
    zIndex: 1000,
    elevation: 1000,
  },

  dropdown: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 14,
    padding: 10,
    marginTop: -6,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 8,
  },

  option: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: colors.backgroundAlt,
  },

  optionText: {
    color: colors.text,
    fontWeight: "600",
    fontFamily: "SpaceGrotesk_600SemiBold",
  },
});

export default SortControl;
