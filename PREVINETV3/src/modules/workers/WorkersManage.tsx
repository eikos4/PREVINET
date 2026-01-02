import { useEffect, useMemo, useState } from "react";
import WorkerForm from "./WorkerForm";
import WorkerList from "./WorkerList";
import { getWorkers } from "./worker.service";
import type { Worker } from "./worker.service";

import { getCurrentUser } from "../auth/auth.service";

export default function WorkersManage({ readOnly = false }: { readOnly?: boolean }) {
  const [openCreate, setOpenCreate] = useState(false);
  const [reload, setReload] = useState(0);
  const [workers, setWorkers] = useState<Worker[]>([]);

  useEffect(() => {
    getCurrentUser().then(user => {
      const scopeRut = user?.role === "superadmin" ? undefined : user?.companyRut;
      getWorkers(scopeRut).then(setWorkers);
    });
  }, [reload]);

  const metrics = useMemo(() => {
    const total = workers.length;
    const firmados = workers.filter((w) => !!w.enrolamientoFirmadoEn).length;
    const noFirmados = total - firmados;
    const habilitados = workers.filter((w) => !!w.habilitado).length;
    const noHabilitados = total - habilitados;
    return { total, firmados, noFirmados, habilitados, noHabilitados };
  }, [workers]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="m-0 flex items-center gap-2 text-xl font-semibold text-white">
              <span className="text-2xl">👷</span>
              <span>Trabajadores</span>
            </h3>
            {!readOnly && (
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-white/20"
                onClick={() => setOpenCreate(true)}
              >
                Enrolar trabajador
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">Total</div>
              <div className="mt-1 text-2xl font-extrabold text-slate-900">{metrics.total}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">Firmados</div>
              <div className="mt-1 text-2xl font-extrabold text-slate-900">{metrics.firmados}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">Sin firma</div>
              <div className="mt-1 text-2xl font-extrabold text-slate-900">{metrics.noFirmados}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">Habilitados</div>
              <div className="mt-1 text-2xl font-extrabold text-slate-900">{metrics.habilitados}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">No habilitados</div>
              <div className="mt-1 text-2xl font-extrabold text-slate-900">{metrics.noHabilitados}</div>
            </div>
          </div>
        </div>
      </div>

      <WorkerList key={`wl-${reload}`} readOnly={readOnly} />

      {openCreate && !readOnly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6 overflow-y-auto overscroll-contain">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl" role="dialog" aria-modal="true">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="m-0 text-lg font-semibold text-slate-900">Enrolar trabajador</h3>
              <button
                className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
                onClick={() => setOpenCreate(false)}
              >
                Cerrar
              </button>
            </div>
            <WorkerForm onCreated={() => { setOpenCreate(false); setReload((r) => r + 1); }} />
          </div>
        </div>
      )}
    </div>
  );
}
