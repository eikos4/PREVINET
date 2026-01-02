import { useEffect, useState } from "react";
import { getCurrentUser } from "../modules/auth/auth.service";
import { getUnreadCount, onNotificationsChanged } from "../modules/notifications/notifications.service";
import NotificationsPanel from "./NotificationsPanel";
import { toast } from "sonner";

export default function NotificationsBell() {
  const [count, setCount] = useState<number>(0);
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const containerRef = (window as any).React?.createRef?.() ?? null as any;
  const prevCountRef = { current: 0 } as { current: number };

  useEffect(() => {
    let mounted = true;

    async function resolveCompanyId(user: any) {
      if (!user) return null;
      if ((user as any).companyId) return (user as any).companyId;
      if ((user as any).workerId) {
        const worker = await (await import("../offline/db")).db.table("workers").get((user as any).workerId);
        if (worker && (worker as any).obra) {
          const obra = await (await import("../offline/db")).db.table("obras").get((worker as any).obra);
          return (obra as any)?.empresaId ?? null;
        }
      }
      return null;
    }

    (async () => {
      const user = await getCurrentUser();
      const companyId = await resolveCompanyId(user);
      const c = await getUnreadCount(user?.id ?? undefined, user?.role ?? undefined, companyId);
      if (mounted) {
        setCount(c);
        prevCountRef.current = c;
      }
    })();

    const unsub = onNotificationsChanged(async (ev) => {
      const user = await getCurrentUser();
      const companyId = await resolveCompanyId(user);
      const c = await getUnreadCount(user?.id ?? undefined, user?.role ?? undefined, companyId);
      if (mounted) {
        // pulse when new notifications arrive
        if (c > prevCountRef.current) {
          setPulse(true);
          setTimeout(() => setPulse(false), 900);
        }
        setCount(c);
        prevCountRef.current = c;
      }

      const detail = (ev as CustomEvent<any>).detail;
      if (detail) {
        const targetMatches = !detail.toRole || detail.toRole === "*" || detail.toRole === user?.role || detail.toUserId === user?.id;
        const companyMatches = !detail.companyId || detail.companyId === (await resolveCompanyId(user));
        if (targetMatches && companyMatches) {
          // show toast
          toast(`${detail.title}: ${detail.body ?? ""}`);
        }
      }
    });

    // close on outside click / ESC
    function onDocClick(e: MouseEvent) {
      const path = e.composedPath?.() ?? (e as any).path ?? [];
      const isInside = path.some((el: any) => el && el.classList && el.classList.contains && el.classList.contains("notifications-root"));
      if (!isInside) setOpen(false);
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
      if ((e.key === "Enter" || e.key === " ") && (document.activeElement as HTMLElement)?.classList?.contains("notifications-bell-btn")) {
        setOpen((v) => !v);
      }
    }

    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);

    return () => {
      mounted = false;
      unsub();
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="notifications-root" style={{position: 'relative'}} ref={containerRef}>
      <button
        className={`notifications-bell-btn ${pulse ? "pulse" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificaciones"
        aria-expanded={open}
        title="Notificaciones"
        tabIndex={0}
      >
        <svg className="notifications-bell-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden>
          <path fill="#fff" d="M12 2a6 6 0 00-6 6v3.586L4.707 14.88A1 1 0 005.414 17h13.172a1 1 0 00.707-1.12L18 11.586V8a6 6 0 00-6-6zM10 20a2 2 0 004 0h-4z" />
        </svg>
        {count > 0 && (
          <span className="notifications-badge">{count}</span>
        )}
      </button>

      {open && <NotificationsPanel onClose={() => setOpen(false)} />}
    </div>
  );
}
