import { db } from "../../offline/db";

export type NotificationRecord = {
  id?: number;
  type: string; // e.g. 'talk_signed', 'document_signed', 'task_assigned'
  title: string;
  body?: string;
  toUserId?: string | null; // specific user
  toRole?: string | null; // e.g. 'prevencionista' or 'trabajador' or '*' for broadcast
  companyId?: string | null;
  fromUserId?: string | null;
  read: boolean;
  createdAt: Date;
  data?: any;
  related?: { entity: string; id: string };
};

const emitter = new EventTarget();

export function onNotificationsChanged(cb: (e: CustomEvent<NotificationRecord | null>) => void) {
  const handler = (ev: Event) => cb(ev as CustomEvent<NotificationRecord | null>);
  emitter.addEventListener("change", handler as EventListener);
  return () => emitter.removeEventListener("change", handler as EventListener);
}

export async function createNotification(params: Partial<NotificationRecord> & { type: string; title: string; companyId?: string | null }) {
  const record: NotificationRecord = {
    type: params.type,
    title: params.title,
    body: params.body,
    toUserId: params.toUserId ?? null,
    toRole: params.toRole ?? null,
    companyId: params.companyId ?? null,
    fromUserId: params.fromUserId ?? null,
    read: false,
    createdAt: params.createdAt ?? new Date(),
    data: params.data ?? null,
    related: params.related ?? undefined,
  };

  const id = await db.table("notifications").add(record as any);
  record.id = id as number;
  emitter.dispatchEvent(new CustomEvent("change", { detail: record }));
  return record;
}

export async function listNotificationsFor(userId?: string, role?: string, companyId?: string | null) {
  // combine notifications targeting user and role
  const byUser = userId ? await db.table("notifications").where("toUserId").equals(userId).toArray() : [];
  const byRole = role ? await db.table("notifications").where("toRole").equals(role).toArray() : [];
  const broadcast = await db.table("notifications").where("toRole").equals("*").toArray();
  const combined = [...byUser, ...byRole, ...broadcast];
  // deduplicate by id
  const map = new Map<number, NotificationRecord>();
  combined.forEach((n) => {
    if (n.id) map.set(n.id, n);
  });
  let result = Array.from(map.values()).sort((a, b) => +b.createdAt - +a.createdAt);
  // filter by companyId if provided (null means global)
  if (companyId !== undefined) {
    result = result.filter((n) => !n.companyId || n.companyId === companyId);
  }
  return result;
}

export async function getUnreadCount(userId?: string, role?: string, companyId?: string | null) {
  const all = await listNotificationsFor(userId, role, companyId);
  return all.filter((n) => !n.read).length;
}

export async function markAsRead(id: number) {
  await db.table("notifications").update(id, { read: true });
  const rec = await db.table("notifications").get(id);
  emitter.dispatchEvent(new CustomEvent("change", { detail: rec ?? null }));
}

export async function markAllRead(userId?: string, role?: string) {
  const all = await listNotificationsFor(userId, role);
  const unread = all.filter((n) => !n.read).map((n) => n.id).filter(Boolean) as number[];
  await Promise.all(unread.map((id) => db.table("notifications").update(id, { read: true })));
  emitter.dispatchEvent(new CustomEvent("change", { detail: null }));
}
