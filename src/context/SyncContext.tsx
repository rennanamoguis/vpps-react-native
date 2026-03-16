import {
    getLastSyncAt,
    getLocalCounts,
    replaceBootstrapData,
} from "@/src/database/syncRepo";
import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { migrateDbIfNeeded } from "../database/migration";
import { downloadBootstrap } from "../services/syncService";
import { useSession } from "./SessionContext";

type SyncStatus = "idle" | "running" | "success" | "error";

type SyncContextValue = {
  status: SyncStatus;
  isSyncing: boolean;
  overlayVisible: boolean;
  progressText: string;
  progressPercent: number;
  lastSyncAt: string | null;
  localVoterCount: number;
  localBarangayCount: number;
  startFullSync: () => Promise<void>;
  hideOverlay: () => void;
  showOverlay: () => void;
  refreshLocalSummary: () => Promise<void>;
};

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { session } = useSession();

  const [status, setStatus] = useState<SyncStatus>("idle");
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [progressText, setProgressText] = useState("Preparing update...");
  const [progressPercent, setProgressPercent] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [localVoterCount, setLocalVoterCount] = useState(0);
  const [localBarangayCount, setLocalBarangayCount] = useState(0);

  const refreshLocalSummary = async () => {
    await migrateDbIfNeeded();

    const count = await getLocalCounts();
    const syncedAt = await getLastSyncAt();

    setLocalVoterCount(count.voters);
    setLocalBarangayCount(count.barangays);
    setLastSyncAt(syncedAt);
  };
  useEffect(() => {
    refreshLocalSummary();
  }, []);

  const startFullSync = async () => {
    if (!session?.token) {
      throw new Error("You must logged in before syncing.");
    }

    setStatus("running");
    setOverlayVisible(true);
    setProgressPercent(5);
    setProgressText("Preparing local database...");

    try {
      await migrateDbIfNeeded();

      setProgressPercent(15);
      setProgressText("Downloading voters and barangays from the server...");

      const payload = await downloadBootstrap(session.token);

      setProgressPercent(30);
      setProgressText("Saving downloaded records to offline storage...");

      await replaceBootstrapData(payload, (done, total) => {
        const base = 35;
        const span = 55;
        const value = total > 0 ? base + Math.round((done / total) * span) : 90;

        setProgressPercent(value);
        setProgressText(`Saving local records... ${done}/${total}`);
      });

      setProgressPercent(95);
      setProgressText("Refreshing local summary...");

      await refreshLocalSummary();

      setProgressPercent(100);
      setProgressText("Update completed successfully.");
      setStatus("success");
    } catch (error: any) {
      setStatus("error");
      setProgressPercent(0);
      setProgressText(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to update offline records.",
      );
      throw error;
    }
  };

  const value = useMemo(
    () => ({
      status,
      isSyncing: status === "running",
      overlayVisible,
      progressText,
      progressPercent,
      lastSyncAt,
      localVoterCount,
      localBarangayCount,
      startFullSync,
      hideOverlay: () => setOverlayVisible(false),
      showOverlay: () => setOverlayVisible(true),
      refreshLocalSummary,
    }),
    [
      status,
      overlayVisible,
      progressText,
      progressPercent,
      lastSyncAt,
      localVoterCount,
      localBarangayCount,
    ],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync() {
  const context = useContext(SyncContext);

  if (!context) {
    throw new Error("useSync must be used inside SyncProvider");
  }

  return context;
}
