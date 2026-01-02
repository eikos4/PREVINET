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
    <div className="notifications-panel" role="dialog" aria-label="Notificaciones" onClick={(e) => e.stopPropagation()} style={{position: 'absolute', left: '100%', top: 8, marginLeft: 12, width: 360, background: 'white', boxShadow: '0 18px 40px rgba(2,6,23,0.24)', borderRadius: 12, zIndex: 9999}}>
      <div style={{padding: 12, borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff00'}}>
        <div style={{display: 'flex', gap: 12, alignItems: 'center'}}>
          <div style={{width: 36, height: 36, borderRadius: 8, background: '#0ea5a4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800}}>🔔</div>
          <div>
            <div style={{fontWeight: 800}}>Notificaciones</div>
            <div style={{fontSize: 12, color: '#64748b'}}>Nuevas y recientes</div>
          </div>
        </div>
        <div>
          <button className="btn" onClick={async () => { const user = await getCurrentUser(); await markAllRead(user?.id, user?.role); }} style={{marginRight: 8}}>Marcar todas</button>
          <button className="btn" onClick={onClose}>Cerrar</button>
        </div>
      </div>
      <div style={{maxHeight: 420, overflow: 'auto'}}>
        {list.length === 0 && (
          <div style={{padding: 24, color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8}}>
            <div style={{width: 56, height: 56, borderRadius: 12, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28}}>🔔</div>
            <div style={{fontWeight: 700}}>Sin notificaciones</div>
            <div style={{fontSize: 13, color: '#94a3b8'}}>No hay notificaciones recientes</div>
          </div>
        )}
        {list.map((n) => (
          <div key={n.id} className={`notification-item ${n.read ? 'read' : 'unread'}`} style={{padding: 12, borderBottom: '1px solid #f6f8fa', background: n.read ? 'transparent' : '#f8fafc', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start'}}>
            <div style={{width: 44, height: 44, borderRadius: 8, background: n.read ? '#eef2f7' : '#0ea5a4', color: n.read ? '#0f172a' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800}} onClick={() => open(n)}>
              {n.type === 'talk_signed' ? 'T' : n.type === 'irl_signed' ? 'I' : n.type === 'document_signed' ? 'D' : 'N'}
            </div>
            <div style={{flex: 1}} onClick={() => open(n)}>
              <div style={{fontWeight: 700}}>{n.title}</div>
              {n.body && <div style={{color: '#475569', fontSize: 13}}>{n.body}</div>}
              <div className="meta">{new Date(n.createdAt).toLocaleString()}</div>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
              {!n.read && n.id && <button className="btn-primary" onClick={() => { markAsRead(n.id as number).catch(console.error); }} style={{padding: '6px 8px'}}>Marcar</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
