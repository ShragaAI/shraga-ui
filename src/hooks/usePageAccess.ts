import { useAppContext } from "../contexts/AppContext";
import { useAuthContext } from "../contexts/AuthContext";

export const usePageAccess = () => {
  const { configs } = useAppContext();
  const { user } = useAuthContext();

  const hasAnalyticsAccess = () => {
    if (!configs?.history_enabled) {
      return false;
    }

    if (user?.roles && !user.roles.includes('analytics')) {
      return false;
    }

    return true;
  };

  return {
    hasAccess: {
        analytics: hasAnalyticsAccess()
    }
  };
};