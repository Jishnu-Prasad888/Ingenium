import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  ChevronDown,
  Calendar,
  SortAsc,
  SortDesc,
  ChevronUp,
} from "lucide-react-native";
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
      {/* Button showing selected option icon + text */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => setOpen((prev) => !prev)}
        activeOpacity={0.8}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {selectedOption.icon}
          <Text style={[styles.buttonText, { marginLeft: 6 }]}>
            {selectedOption.label}
          </Text>
        </View>
        {open ? (
          <View style={{ paddingLeft: 3 }}>
            <ChevronUp size={16} color={colors.text} />
          </View>
        ) : (
          <View style={{ paddingLeft: 3 }}>
            <ChevronDown size={16} color={colors.text} />
          </View>
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
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {option.icon}
                  <Text style={[styles.optionText, { marginLeft: 6 }]}>
                    {option.label}
                  </Text>
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
    zIndex: 10,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // icon+text on left, chevron on right
    backgroundColor: colors.backgroundCard,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buttonText: {
    color: colors.text,
  },
  dropdownWrapper: {
    position: "absolute",
    top: 48,
    right: 0,
    zIndex: 999,
    elevation: 10,
  },
  dropdown: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.backgroundAlt,
    padding: 6,
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.backgroundAlt,
    borderRadius: 6,
    marginBottom: 4,
  },
  optionText: {
    color: colors.text,
  },
});

export default SortControl;
