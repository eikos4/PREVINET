import { useEffect, useState } from "react";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

export default function OnlineStatus() {
  const online = useOnlineStatus();
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handler = (ev: Event) => {
      const custom = ev as CustomEvent;
      setSyncing(!!custom.detail?.syncing);
    };
    window.addEventListener('sync:status', handler as EventListener);
    return () => window.removeEventListener('sync:status', handler as EventListener);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        fontSize: "0.85rem",
        fontWeight: 600,
        color: online ? "#166534" : "#991b1b",
        background: online ? "#dcfce7" : "#fee2e2",
        padding: "0.4rem 0.7rem",
        borderRadius: "999px",
        transition: "all 0.3s ease",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: online ? "#22c55e" : "#ef4444",
          animation: syncing ? "pulse-sync 1s infinite" : "none",
        }}
      />
      <span>{syncing ? "Sincronizando..." : online ? "Online" : "Offline"}</span>

      <style>{`
        @keyframes pulse-sync {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
