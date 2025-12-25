import { useEffect } from "react";
import DeepLinkService from "../services/DeepLinkService";
import { useApp } from "../context/AppContext";

const DeepLinkHandler = () => {
  const { processIncomingShare } = useApp();

  useEffect(() => {
    const unsubscribePromise = DeepLinkService.setupDeepLinking(
      (content, title) => {
        processIncomingShare(content);
      }
    );

    return () => {
      unsubscribePromise.then((unsubscribe) => unsubscribe?.());
    };
  }, [processIncomingShare]);

  return null;
};

export default DeepLinkHandler;
