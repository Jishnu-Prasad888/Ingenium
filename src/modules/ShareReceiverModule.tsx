import { NativeModules, Platform } from "react-native";

interface ShareReceiverModuleType {
  getSharedText(): Promise<string>;
  clearSharedText(): void;
}

const ShareReceiverModule =
  Platform.OS === "android"
    ? NativeModules.ShareReceiverModule
    : {
        getSharedText: async () => "",
        clearSharedText: () => {},
      };

export default ShareReceiverModule as ShareReceiverModuleType;
