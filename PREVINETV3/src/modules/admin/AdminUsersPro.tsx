import { useEffect, useMemo, useState } from "react";
import type { User } from "../auth/auth.service";
import type { CreatableManagedRole } from "./adminUsers.service";
import { createManagedUser, listManagedUsers, updateManagedUser, deleteManagedUser } from "./adminUsers.service";
import { listEmpresas } from "../empresas/empresas.service";
import type { Empresa } from "../empresas/empresas.service";

type Props = {
  currentUser: User;
};

type CreateForm = {
  role: CreatableManagedRole;
  name: string;
  documentNumber: string;
  email: string;
  phone: string;
  position: string;
  companyName: string;
  companyRut: string;
  pin: string;
  confirmPin: string;
};

type EditForm = {
  id: string;
  role: CreatableManagedRole;
  name: string;
  documentNumber: string;
  email: string;
  phone: string;
  position: string;
  companyName: string;
  companyRut: string;
  pin?: string;
};

export default function AdminUsers({ currentUser }: Props) {
  const inputClassName =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10";
  const selectClassName =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10";

  const [createForm, setCreateForm] = useState<CreateForm>({
    role: "supervisor",
    name: "",
    documentNumber: "",
    email: "",
    phone: "",
    position: "",
    companyName: currentUser.companyName ?? "",
    companyRut: currentUser.companyRut ?? "",
    pin: "",
    confirmPin: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [reload, setReload] = useState(0);

  const [users, setUsers] = useState<
    (User & {
      email?: string;
      phone?: string;
      documentNumber?: string;
      position?: string;
      companyName?: string;
      companyRut?: string;
      createdByUserId?: string;
    })[]
  >([]);
  const [companies, setCompanies] = useState<Empresa[]>([]);

  useEffect(() => {
    if (currentUser.role === "superadmin") {
      listEmpresas().then(setCompanies);
    }
  }, [currentUser.role]);

  const [modal, setModal] = useState<null | "create" | "edit" | "delete">(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<
    (User & {
      email?: string;
      phone?: string;
      documentNumber?: string;
      position?: string;
      companyName?: string;
      companyRut?: string;
      createdByUserId?: string;
    }) | null
  >(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const companyRutFilter = useMemo(() => {
    const rut = currentUser.companyRut?.trim();
    return rut ? rut : undefined;
  }, [currentUser.companyRut]);

  useEffect(() => {
    listManagedUsers({ companyRut: companyRutFilter }).then(setUsers);
  }, [reload, companyRutFilter]);

  const handleCreateChange = (key: keyof CreateForm, value: string) => {
    setCreateForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreateSubmit = async () => {
    setError("");
    setSuccess("");

    if (!createForm.name.trim()) {
      setError("Nombre es obligatorio");
      return;
    }

    if (!createForm.documentNumber.trim()) {
      setError("RUT / Documento es obligatorio");
      return;
    }

    if (!/^\d{4}$/.test(createForm.pin)) {
      setError("El PIN debe contener exactamente 4 dígitos");
      return;
    }

    if (createForm.pin !== createForm.confirmPin) {
      setError("Los PINs no coinciden");
      return;
    }

    if (!createForm.companyName.trim() || !createForm.companyRut.trim()) {
      setError("Empresa y RUT Empresa son obligatorios");
      return;
    }

    setLoading(true);
    try {
      await createManagedUser({
        role: createForm.role,
        name: createForm.name.trim(),
        documentNumber: createForm.documentNumber.trim(),
        email: createForm.email.trim() || undefined,
        phone: createForm.phone.trim() || undefined,
        position: createForm.position.trim() || undefined,
        companyName: createForm.companyName.trim(),
        companyRut: createForm.companyRut.trim(),
        pin: createForm.pin,
        createdByUserId: currentUser.id,
      });

      setSuccess("Usuario creado correctamente");
      setCreateForm((prev) => ({
        ...prev,
        name: "",
        documentNumber: "",
        email: "",
        phone: "",
        position: "",
        pin: "",
        confirmPin: "",
      }));
      setReload((r) => r + 1);
      setModal(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo crear usuario";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!editForm) return;
    setEditError("");
    setEditLoading(true);
    try {
      if (!editForm.name.trim()) throw new Error("Nombre es obligatorio");
      if (!editForm.documentNumber.trim()) throw new Error("RUT / Documento es obligatorio");
      const payload: any = {
        id: editForm.id,
        role: editForm.role,
        name: editForm.name.trim(),
        documentNumber: editForm.documentNumber.trim(),
        email: editForm.email.trim() || undefined,
        phone: editForm.phone.trim() || undefined,
        position: editForm.position.trim() || undefined,
        companyName: editForm.companyName.trim() || undefined,
        companyRut: editForm.companyRut.trim() || undefined,
      };
      if (editForm.pin && editForm.pin.trim() !== "") {
        if (!/^\d{4}$/.test(editForm.pin)) throw new Error("El PIN debe contener exactamente 4 dígitos");
        payload.pin = editForm.pin;
      }
      await updateManagedUser(payload);
      setReload((r) => r + 1);
      setModal(null);
      setEditForm(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo actualizar usuario";
      setEditError(msg);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setEditError("");
    setDeleteLoading(true);
    try {
      await deleteManagedUser(deleteTarget.id);
      setReload((r) => r + 1);
      setModal(null);
      setDeleteTarget(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo eliminar usuario";
      setEditError(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="m-0 flex items-center gap-2 text-xl font-semibold text-white">
              <span className="text-2xl">👥</span>
              <span>Usuarios</span>
            </h3>
            <div className="flex items-center gap-3">
              <div className="text-xs text-white/80">{companyRutFilter ? `Empresa: ${companyRutFilter}` : ""}</div>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-white/20"
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setCreateForm((f) => ({
                    ...f,
                    role: "supervisor",
                    name: "",
                    documentNumber: "",
                    email: "",
                    phone: "",
                    position: "",
                    companyName: currentUser.companyName ?? "",
                    companyRut: currentUser.companyRut ?? "",
                    pin: "",
                    confirmPin: "",
                  }));
                  setModal("create");
                }}
              >
                Crear usuario
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">Total</div>
              <div className="mt-1 text-2xl font-extrabold text-slate-900">{users.length}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">Prevencionistas</div>
              <div className="mt-1 text-2xl font-extrabold text-slate-900">{users.filter((u) => u.role === "prevencionista").length}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">Supervisores</div>
              <div className="mt-1 text-2xl font-extrabold text-slate-900">{users.filter((u) => u.role === "supervisor").length}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">Auditores</div>
              <div className="mt-1 text-2xl font-extrabold text-slate-900">{users.filter((u) => u.role === "auditor").length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <h3 className="m-0 flex items-center gap-2 text-xl font-semibold text-white">
            <span className="text-2xl">📇</span>
            <span>Usuarios creados</span>
          </h3>
        </div>

        <div className="p-6">
          {users.length === 0 ? (
            <p className="text-sm text-slate-500" style={{ margin: 0 }}>
              No hay usuarios creados aún.
            </p>
          ) : (
            <div className="space-y-3">
              {users
                .sort((a, b) => {
                  try {
                    return new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime();
                  } catch {
                    return 0;
                  }
                })
                .map((u) => {
                  const doc = (u as any).documentNumber ?? "";
                  const pos = (u as any).position ?? "";
                  const compName = (u as any).companyName ?? "";
                  const compRut = (u as any).companyRut ?? "";

                  return (
                    <div
                      key={u.id}
                      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div className="min-w-[64px] text-center text-xs font-bold text-blue-700">
                          {String(u.role).toUpperCase()}
                        </div>

                        <div>
                          <div className="text-sm font-semibold text-slate-900">{u.name}</div>
                          <div className="mt-1 text-xs text-slate-600">
                            {doc}
                            {pos ? ` · ${pos}` : ""}
                          </div>
                          <div className="mt-1 text-xs text-slate-600">
                            {compName}
                            {compRut ? ` · ${compRut}` : ""}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="inline-flex items-center justify-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                          PIN: {u.pin}
                        </div>
                        <button
                          type="button"
                          className="rounded-lg bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-300"
                          onClick={() => {
                            const email = (u as any).email ?? "";
                            const phone = (u as any).phone ?? "";
                            setEditForm({
                              id: u.id,
                              role: u.role as CreatableManagedRole,
                              name: u.name,
                              documentNumber: doc,
                              position: pos,
                              companyName: compName,
                              companyRut: compRut,
                              email,
                              phone,
                              pin: "",
                            });
                            setEditError("");
                            setModal("edit");
                          }}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                          onClick={() => {
                            setDeleteTarget(u as any);
                            setEditError("");
                            setModal("delete");
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {modal === "create" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6 overflow-y-auto overscroll-contain">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl" role="dialog" aria-modal="true">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="m-0 text-lg font-semibold text-slate-900">Crear usuario</h3>
              <button
                className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
                onClick={() => setModal(null)}
              >
                Cerrar
              </button>
            </div>
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}
            {success && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>
            )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Rol *</label>
                <select
                  className={selectClassName}
                  value={createForm.role}
                  onChange={(e) => handleCreateChange("role", e.target.value)}
                >
                  <option value="prevencionista">Prevencionista</option>
                  {currentUser.role === "superadmin" && <option value="administrador">Administrador de Empresa</option>}
                  <option value="supervisor">Supervisor</option>
                  <option value="auditor">Auditor</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Nombre *</label>
                <input
                  className={inputClassName}
                  type="text"
                  placeholder="Nombre completo"
                  value={createForm.name}
                  onChange={(e) => handleCreateChange("name", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">RUT / Documento *</label>
                <input
                  className={inputClassName}
                  type="text"
                  placeholder="RUT"
                  value={createForm.documentNumber}
                  onChange={(e) => handleCreateChange("documentNumber", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Cargo</label>
                <input
                  className={inputClassName}
                  type="text"
                  placeholder="Cargo"
                  value={createForm.position}
                  onChange={(e) => handleCreateChange("position", e.target.value)}
                />
              </div>
            </div>

            {currentUser.role === "superadmin" ? (
              <div className="mt-4 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Asignar a Empresa *</label>
                <select
                  className={selectClassName}
                  value={createForm.companyRut}
                  onChange={(e) => {
                    const selected = companies.find((c) => c.rut === e.target.value);
                    if (selected) {
                      setCreateForm((prev) => ({
                        ...prev,
                        companyRut: selected.rut,
                        companyName: selected.nombreRazonSocial,
                      }));
                    } else {
                      setCreateForm((prev) => ({ ...prev, companyRut: "", companyName: "" }));
                    }
                  }}
                >
                  <option value="">-- Seleccione Empresa --</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.rut}>
                      {c.nombreRazonSocial} ({c.rut})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">Empresa *</label>
                  <input
                    className={inputClassName}
                    type="text"
                    placeholder="Empresa"
                    value={createForm.companyName}
                    disabled
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">RUT Empresa *</label>
                  <input
                    className={inputClassName}
                    type="text"
                    placeholder="RUT Empresa"
                    value={createForm.companyRut}
                    disabled
                    readOnly
                  />
                </div>
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Email</label>
                <input
                  className={inputClassName}
                  type="email"
                  placeholder="correo@empresa.cl"
                  value={createForm.email}
                  onChange={(e) => handleCreateChange("email", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Teléfono</label>
                <input
                  className={inputClassName}
                  type="tel"
                  placeholder="+56 9 ..."
                  value={createForm.phone}
                  onChange={(e) => handleCreateChange("phone", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">PIN (4 dígitos) *</label>
                <input
                  className={inputClassName}
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  value={createForm.pin}
                  onChange={(e) => handleCreateChange("pin", e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Confirmar PIN *</label>
                <input
                  className={inputClassName}
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  value={createForm.confirmPin}
                  onChange={(e) => handleCreateChange("confirmPin", e.target.value.replace(/\D/g, ""))}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                onClick={() => setModal(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
                onClick={handleCreateSubmit}
                disabled={loading}
              >
                {loading ? "Creando..." : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === "edit" && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6 overflow-y-auto overscroll-contain">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl" role="dialog" aria-modal="true">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="m-0 text-lg font-semibold text-slate-900">Editar usuario</h3>
              <button
                className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
                onClick={() => setModal(null)}
              >
                Cerrar
              </button>
            </div>
            {editError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{editError}</div>
            )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Rol *</label>
                <select
                  className={selectClassName}
                  value={editForm.role}
                  onChange={(e) => setEditForm((p) => (p ? { ...p, role: e.target.value as CreatableManagedRole } : p))}
                >
                  <option value="prevencionista">Prevencionista</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="auditor">Auditor</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Nombre *</label>
                <input
                  className={inputClassName}
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => (p ? { ...p, name: e.target.value } : p))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">RUT / Documento *</label>
                <input
                  className={inputClassName}
                  type="text"
                  value={editForm.documentNumber}
                  onChange={(e) => setEditForm((p) => (p ? { ...p, documentNumber: e.target.value } : p))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Cargo</label>
                <input
                  className={inputClassName}
                  type="text"
                  value={editForm.position}
                  onChange={(e) => setEditForm((p) => (p ? { ...p, position: e.target.value } : p))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Empresa</label>
                <input
                  className={inputClassName}
                  type="text"
                  value={editForm.companyName}
                  onChange={(e) => setEditForm((p) => (p ? { ...p, companyName: e.target.value } : p))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">RUT Empresa</label>
                <input
                  className={inputClassName}
                  type="text"
                  value={editForm.companyRut}
                  onChange={(e) => setEditForm((p) => (p ? { ...p, companyRut: e.target.value } : p))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Email</label>
                <input
                  className={inputClassName}
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((p) => (p ? { ...p, email: e.target.value } : p))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Teléfono</label>
                <input
                  className={inputClassName}
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((p) => (p ? { ...p, phone: e.target.value } : p))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Nuevo PIN (opcional)</label>
                <input
                  className={inputClassName}
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  value={editForm.pin ?? ""}
                  onChange={(e) => setEditForm((p) => (p ? { ...p, pin: e.target.value.replace(/\D/g, "") } : p))}
                />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                onClick={() => setModal(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
                onClick={handleEditSubmit}
                disabled={editLoading}
              >
                {editLoading ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === "delete" && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6 overflow-y-auto overscroll-contain">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl" role="dialog" aria-modal="true">
            <h3 className="m-0 text-lg font-semibold text-slate-900">Eliminar usuario</h3>
            <p className="mt-2 text-sm text-slate-600">
              ¿Confirmas eliminar a <strong>{deleteTarget.name}</strong> ({String(deleteTarget.role)})? Esta acción no se puede deshacer.
            </p>
            {editError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{editError}</div>
            )}
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                onClick={() => setModal(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
