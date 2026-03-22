import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { message } from "antd";

export const useRefreshDashboard = () => {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const refreshDashboard = async () => {
    setRefreshing(true);
    try {
      // Invalidate all the main dashboard queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["students"] }),
        queryClient.invalidateQueries({ queryKey: ["teachers"] }),
        queryClient.invalidateQueries({ queryKey: ["subjects"] }),
        queryClient.invalidateQueries({ queryKey: ["stages"] }),
        queryClient.invalidateQueries({ queryKey: ["exams"] }),
        queryClient.invalidateQueries({ queryKey: ["schedules"] }),
      ]);
      message.success("Dashboard data refreshed successfully!");
    } catch (error) {
      message.error("Failed to refresh dashboard data");
      console.error("Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const clearAllCache = () => {
    queryClient.clear();
    message.success("All cached data cleared!");
  };

  return {
    refreshing,
    refreshDashboard,
    clearAllCache,
  };
};

export default useRefreshDashboard;
