import { useEffect, useState } from "react";
import type { NotificationRecord } from "../modules/notifications/notifications.service";
import {
  listNotificationsFor,
  markAsRead,
  markAllRead,
  onNotificationsChanged,
} from "../modules/notifications/notifications.service";
import { getCurrentUser } from "../modules/auth/auth.service";

export default function NotificationsPanel({ onClose }: { onClose?: () => void }) {
  const [list, setList] = useState<NotificationRecord[]>([]);

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
      const data = await listNotificationsFor(user?.id ?? undefined, user?.role ?? undefined, companyId);
      if (mounted) setList(data);
    })();

    const unsub = onNotificationsChanged(async () => {
      const user = await getCurrentUser();
      const companyId = await resolveCompanyId(user);
      const data = await listNotificationsFor(user?.id ?? undefined, user?.role ?? undefined, companyId);
      if (mounted) setList(data);
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const open = (n: NotificationRecord) => {
    if (n.id) markAsRead(n.id).catch(console.error);
    // Dispatch event to let the app handle navigation
    window.dispatchEvent(new CustomEvent("notification:open", { detail: n }));
    onClose?.();
  };

  return (
    <div className="notifications-panel" role="dialog" aria-label="Notificaciones" onClick={(e) => e.stopPropagation()}>
      <div className="notifications-panel-header">
        <div className="notifications-panel-header-content">
          <div className="notifications-panel-icon-box">🔔</div>
          <div>
            <div className="notifications-panel-title">Notificaciones</div>
            <div className="notifications-panel-subtitle">Nuevas y recientes</div>
          </div>
        </div>
        <div className="notifications-panel-actions">
          <button className="btn-mark-all" onClick={async () => { const user = await getCurrentUser(); await markAllRead(user?.id, user?.role); }}>Marcar todas</button>
          <button className="btn-close-panel" onClick={onClose}>Cerrar</button>
        </div>
      </div>
      <div className="notifications-panel-list">
        {list.length === 0 && (
          <div className="notifications-empty">
            <div className="notifications-empty-icon">🔔</div>
            <div className="notifications-empty-title">Sin notificaciones</div>
            <div className="notifications-empty-text">No hay notificaciones recientes</div>
          </div>
        )}
        {list.map((n) => (
          <div key={n.id} className={`notification-item ${n.read ? 'read' : 'unread'}`} onClick={() => open(n)}>
            <div className={`notification-item-icon ${n.read ? 'read' : 'unread'}`}>
              {n.type === 'talk_signed' ? 'T' : n.type === 'irl_signed' ? 'I' : n.type === 'document_signed' ? 'D' : 'N'}
            </div>
            <div className="notification-item-content">
              <div className="notification-item-title">{n.title}</div>
              {n.body && <div className="notification-item-body">{n.body}</div>}
              <div className="meta">{new Date(n.createdAt).toLocaleString()}</div>
            </div>
            {!n.read && n.id && (
              <div className="notification-item-actions">
                <button className="btn-primary-xs" onClick={(e) => { e.stopPropagation(); markAsRead(n.id as number).catch(console.error); }}>OK</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
