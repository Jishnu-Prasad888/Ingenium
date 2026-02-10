// components/DatabaseInitializer.tsx
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import StorageService from "../services/StorageService";
import { colors } from "../theme/colors";

const DatabaseInitializer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        console.log("Initializing database...");
        await StorageService.initialize();
        console.log("Database initialized successfully");
        setIsInitialized(true);
      } catch (err) {
        console.error("Failed to initialize database:", err);
        setError("Failed to initialize database. Please restart the app.");
      }
    };

    initializeDatabase();
  }, []);

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <Text
          style={{
            color: colors.error,
            fontSize: 16,
            textAlign: "center",
            marginHorizontal: 20,
          }}
        >
          {error}
        </Text>
      </View>
    );
  }

  if (!isInitialized) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 20, color: colors.text, fontSize: 14 }}>
          Loading database...
        </Text>
      </View>
    );
  }

  return <>{children}</>;
};

export default DatabaseInitializer;
