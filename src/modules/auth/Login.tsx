import { useState, useEffect } from "react";
import { loginWithPin } from "./auth.service";
import type { UserRole } from "./auth.service";
import { listEmpresas } from "../empresas/empresas.service";
import type { Empresa } from "../empresas/empresas.service";

type Props = {
  onLogin: () => void;
};

const ROLES: { id: UserRole; label: string; icon: string }[] = [
  { id: "trabajador", label: "Trabajador", icon: "👷" },
  { id: "prevencionista", label: "Prevencionista", icon: "🧑‍💼" },
  { id: "administrador", label: "Administrador", icon: "🏢" },
  { id: "supervisor", label: "Supervisor", icon: "🧑‍🔧" },
  { id: "auditor", label: "Auditor", icon: "📋" },
  { id: "superadmin", label: "Superadmin", icon: "👑" },
];

const PreventNetLogo = () => (
  <svg
    width="160"
    height="160"
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="login-logo"
  >
    <circle cx="60" cy="60" r="58" fill="#2563eb" fillOpacity="0.1" />
    <circle cx="60" cy="60" r="50" stroke="#2563eb" strokeWidth="3" />
    <path
      d="M60 25 L75 45 L85 40 L70 60 L85 80 L75 75 L60 95 L45 75 L35 80 L50 60 L35 40 L45 45 Z"
      fill="#2563eb"
    />
    <circle cx="60" cy="60" r="12" fill="white" />
    <circle cx="60" cy="60" r="8" fill="#2563eb" />
  </svg>
);

export default function Login({ onLogin }: Props) {
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<UserRole | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Empresa[]>([]);
  const [selectedCompanyRut, setSelectedCompanyRut] = useState("");

  useEffect(() => {
    listEmpresas().then(setCompanies);
  }, []);

  const handleSubmit = async () => {
    setError("");

    if (!role) {
      setError("Selecciona tu perfil");
      return;
    }

    if (pin.length < 4) {
      setError("El PIN debe tener al menos 4 dígitos");
      return;
    }

    setLoading(true);
    try {
      await loginWithPin(pin, role, selectedCompanyRut || undefined);
      onLogin();
    } catch (e) {
      const message = e instanceof Error ? e.message : "No se pudo iniciar sesión";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <div className="login-container">
        {/* LEFT SIDE - BRANDING */}
        <div className="login-brand">
          <div className="login-brand-content">
            <PreventNetLogo />
            <h1 className="login-brand-title">PREVINET</h1>
            <p className="login-brand-tagline">Sistema de Gestión de Prevención de Riesgos</p>

          </div>
        </div>

        {/* RIGHT SIDE - FORM */}
        <div className="login-form">
          <div className="login-form-content">
            <div className="login-form-header">
              <h2>Bienvenido</h2>
              <p>Selecciona tu perfil e ingresa tu PIN</p>
            </div>

            {/* SELECTOR DE PERFIL */}
            <div className="login-roles">
              <label className="login-label">Perfil de usuario</label>
              <div className="login-role-grid">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={`login-role-btn ${role === r.id ? "active" : ""}`}
                    onClick={() => setRole(r.id)}
                  >
                    <span className="login-role-icon">{r.icon}</span>
                    <span className="login-role-label">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* PIN */}

            {/* SELECTOR DE EMPRESA */}
            {role !== "superadmin" && role !== "trabajador" && companies.length > 0 && (
              <div className="login-company mb-4">
                <label className="login-label">Empresa</label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10"
                  value={selectedCompanyRut}
                  onChange={(e) => setSelectedCompanyRut(e.target.value)}
                >
                  <option value="">-- Selecciona Empresa --</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.rut}>{c.nombreRazonSocial}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="login-pin">
              <label className="login-label">PIN de acceso</label>
              <input
                type="password"
                inputMode="numeric"
                placeholder="Ingresa tu PIN"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                className="login-pin-input"
              />
            </div>

            {error && (
              <div className="login-error">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              className="login-submit-btn"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>

            <div className="login-blue-footer">
              <span className="login-brand-icon">📡</span>
              <span>Funciona sin conexión</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
