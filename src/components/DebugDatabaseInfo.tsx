// components/DebugDatabaseInfo.tsx
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import StorageService from "../services/StorageService";
import { colors } from "../theme/colors";

interface DatabaseInfo {
  rowCounts: {
    folders: number;
    notes: number;
    pendingSync: number;
  };
  status: string;
}

const DebugDatabaseInfo: React.FC = () => {
  const [info, setInfo] = useState<DatabaseInfo | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      loadInfo();
    }
  }, [visible]);

  const loadInfo = async () => {
    try {
      const dbInfo = await StorageService.getDatabaseInfo();
      setInfo(dbInfo);
    } catch (error) {
      console.error("Error loading database info:", error);
    }
  };

  if (!visible) {
    return (
      <TouchableOpacity
        style={{
          position: "absolute",
          bottom: 100,
          right: 20,
          backgroundColor: colors.primary,
          padding: 8,
          borderRadius: 20,
        }}
        onPress={() => setVisible(true)}
      >
        <Text style={{ color: colors.white, fontSize: 12 }}>DB</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={{
        position: "absolute",
        bottom: 100,
        right: 20,
        backgroundColor: colors.backgroundCard,
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.primary,
        minWidth: 150,
        zIndex: 1000,
      }}
    >
      <TouchableOpacity
        onPress={() => setVisible(false)}
        style={{ alignSelf: "flex-end", marginBottom: 8 }}
      >
        <Text style={{ color: colors.primary, fontWeight: "bold" }}>×</Text>
      </TouchableOpacity>

      <Text style={{ color: colors.text, fontWeight: "bold", marginBottom: 8 }}>
        Database Info
      </Text>

      {info && (
        <View>
          <Text style={{ color: colors.text, fontSize: 12, marginBottom: 4 }}>
            Status: <Text style={{ fontWeight: "bold" }}>{info.status}</Text>
          </Text>
          <Text style={{ color: colors.text, fontSize: 12, marginBottom: 2 }}>
            Folders:{" "}
            <Text style={{ fontWeight: "bold" }}>{info.rowCounts.folders}</Text>
          </Text>
          <Text style={{ color: colors.text, fontSize: 12, marginBottom: 2 }}>
            Notes:{" "}
            <Text style={{ fontWeight: "bold" }}>{info.rowCounts.notes}</Text>
          </Text>
          <Text style={{ color: colors.text, fontSize: 12, marginBottom: 2 }}>
            Pending Sync:{" "}
            <Text style={{ fontWeight: "bold" }}>
              {info.rowCounts.pendingSync}
            </Text>
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={loadInfo}
        style={{
          marginTop: 12,
          backgroundColor: colors.primary,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 4,
          alignItems: "center",
        }}
      >
        <Text style={{ color: colors.white, fontSize: 12 }}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );
};

export default DebugDatabaseInfo;
