import { useSession } from "@/src/context/SessionContext";
import { migrateDbIfNeeded } from "@/src/database/migration";
import {
  beginPagedSync,
  finalizePagedSync,
  getLastSyncAt,
  getLocalCounts,
  insertVoterPageToStaging,
} from "@/src/database/syncRepo";
import {
  downloadSyncMeta,
  downloadVoterPage,
} from "@/src/services/syncService";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

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

  const refreshLocalSummary = useCallback(async () => {
    await migrateDbIfNeeded();

    const counts = await getLocalCounts();
    const syncedAt = await getLastSyncAt();

    setLocalVoterCount(Number(counts.voters) || 0);
    setLocalBarangayCount(Number(counts.barangays) || 0);
    setLastSyncAt(syncedAt);
  }, []);

  useEffect(() => {
    refreshLocalSummary();
  }, [refreshLocalSummary]);

  const startFullSync = useCallback(async () => {
    if (!session?.token) {
      throw new Error("You must be logged in before syncing.");
    }

    setStatus("running");
    setOverlayVisible(true);
    setProgressPercent(5);
    setProgressText("Preparing local database...");

    try {
      await migrateDbIfNeeded();

      setProgressPercent(10);
      setProgressText("Downloading sync metadata...");

      const meta = await downloadSyncMeta(session.token);

      const totalVoters = Number(meta.totalVoters ?? 0);
      const pageSize = Number(meta.pageSize ?? 1000);
      const totalPages = Math.max(1, Math.ceil(totalVoters / pageSize));

      setProgressPercent(15);
      setProgressText("Preparing staging tables...");

      const searchedIdSet = await beginPagedSync(meta.barangays);

      let downloaded = 0;

      for (let page = 1; page <= totalPages; page++) {
        const pageData = await downloadVoterPage(session.token, page, pageSize);
        const insertedCount = await insertVoterPageToStaging(
          pageData.voters,
          searchedIdSet,
        );

        downloaded += insertedCount;

        const progress =
          15 + Math.round((downloaded / Math.max(totalVoters, 1)) * 75);
        setProgressPercent(Math.min(progress, 90));
        setProgressText(
          `Downloading and saving voters... ${downloaded}/${totalVoters}`,
        );
      }

      setProgressPercent(95);
      setProgressText("Finalizing local database...");

      await finalizePagedSync(meta.syncedAt);

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
  }, [session, refreshLocalSummary]);

  const hideOverlay = useCallback(() => {
    setOverlayVisible(false);
  }, []);

  const showOverlay = useCallback(() => {
    setOverlayVisible(true);
  }, []);

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
      hideOverlay,
      showOverlay,
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
      startFullSync,
      hideOverlay,
      showOverlay,
      refreshLocalSummary,
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
