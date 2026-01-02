import { db } from "../../offline/db";

export type UserRole =
  | "trabajador"
  | "prevencionista"
  | "supervisor"
  | "administrador"
  | "auditor"
  | "admin"
  | "superadmin";

export function normalizeRole(role: UserRole): UserRole {
  // if (role === "admin" || role === "administrador") return "superadmin";
  return role;
}

export type User = {
  id: string;
  name: string;
  pin: string;
  role: UserRole;
  workerId?: string;
  companyName?: string;
  companyRut?: string;
  companyId?: string | null;
  creadoEn: Date;
};

const CURRENT_USER_KEY = "currentUserId";

export async function loginWithPin(
  pin: string,
  role: UserRole,
  companyRut?: string
): Promise<User> {
  if (role === "trabajador") {
    const existing = await db
      .table<User>("users")
      .where("pin")
      .equals(pin)
      .first();

    if (existing && existing.role === "trabajador") {
      const worker = existing.workerId
        ? await db.table("workers").get(existing.workerId)
        : await db.table("workers").where("pin").equals(pin).first();

      if (!worker) {
        throw new Error("PIN inválido o trabajador no enrolado");
      }

      if (!worker.habilitado) {
        throw new Error("Trabajador no habilitado para iniciar sesión");
      }

      const user: User = {
        ...existing,
        name: worker.nombre,
        workerId: worker.id,
      };

      setCurrentUser(user);
      return user;
    }

    const worker = await db.table("workers").where("pin").equals(pin).first();
    if (!worker) {
      throw new Error("PIN inválido o trabajador no enrolado");
    }

    if (!worker.habilitado) {
      throw new Error("Trabajador no habilitado para iniciar sesión");
    }

    const user: User = {
      id: crypto.randomUUID(),
      name: worker.nombre,
      pin,
      role,
      workerId: worker.id,
      creadoEn: new Date(),
    };

    await db.table("users").add(user);
    setCurrentUser(user);
    return user;
  }

  const users = await db.table<User>("users").toArray();

  const expectedRoles: UserRole[] =
    role === "superadmin"
      ? ["superadmin", "admin", "administrador"]
      : [role];

  // For superadmin, we don't strictly require company match, but for others we do if provided
  // However, normally superadmins are global. 
  // For other roles, if companyRut is provided, we must match it.

  const existing = users.find((u) => {
    const roleMatch = expectedRoles.includes(u.role);
    const pinMatch = u.pin === pin;

    if (!roleMatch || !pinMatch) return false;

    // If I am claiming to be from a specific company, check it.
    // Exception: Superadmins might not have companyRut set or might be global.
    // If user has no companyRut, it's global or legacy? 
    if (companyRut && role !== "superadmin") {
      return (u.companyRut || "") === companyRut;
    }

    return true;
  });

  if (existing) {
    const normalized = normalizeRole(existing.role);
    if (normalized !== existing.role) {
      const updated: User = { ...existing, role: normalized };
      await db.table("users").update(existing.id, { role: normalized });
      setCurrentUser(updated);
      return updated;
    }

    setCurrentUser(existing);
    return existing;
  }

  if (role === "supervisor" || role === "prevencionista" || role === "auditor" || role === "administrador") {
    // These users MUST be pre-created by Admin. 
    // "administrador" (Company Admin) is also created by Superadmin, so it CANNOT be auto-provisioned here.
    throw new Error("Usuario no registrado. Debe ser creado/enrolado primero.");
  }

  // Fallback for auto-creation (Mainly for DEV Superadmin or legacy flows)
  // If verifying against real security, this should be removed for prod.
  const user: User = {
    id: crypto.randomUUID(),
    name: roleLabel(role),
    pin,
    role,
    creadoEn: new Date(),
    companyRut: companyRut, // Assign if provided during auto-creation (e.g. first superadmin login?)
  };

  await db.table("users").add(user);
  setCurrentUser(user);

  return user;
}

export async function getCurrentUser(): Promise<User | null> {
  const id = localStorage.getItem(CURRENT_USER_KEY);
  if (!id) return null;
  const user = (await db.table<User>("users").get(id)) ?? null;
  if (!user) return null;

  const normalized = normalizeRole(user.role);
  if (normalized !== user.role) {
    await db.table("users").update(user.id, { role: normalized });
    return { ...user, role: normalized };
  }

  return user;
}

export function setCurrentUser(user: User) {
  localStorage.setItem(CURRENT_USER_KEY, user.id);
}

export function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

function roleLabel(role: UserRole): string {
  switch (role) {
    case "trabajador":
      return "Trabajador";
    case "prevencionista":
      return "Prevencionista";
    case "supervisor":
      return "Supervisor";
    case "administrador":
      return "Administrador";
    case "auditor":
      return "Auditor";
    case "admin":
      return "Admin Empresa";
    case "superadmin":
      return "Superadmin";
    default:
      return "Usuario";
  }
}
