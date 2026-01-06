import { useEffect, useState } from "react";
import { EliLogo } from "./icons/EliLogo";

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  }
}

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isInStandaloneMode = () => (window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches;

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    }

    function onAppInstalled() {
      setInstalled(true);
      setVisible(false);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (isInStandaloneMode()) {
      setInstalled(true);
      setVisible(false);
    }
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
        setVisible(false);
      } else {
        setDeferredPrompt(null);
        setVisible(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (installed || !visible) return null;

  return (
    <div className="install-banner-wrapper">
      <div className="install-banner-card">
        <div className="install-banner-content">
          <div className="install-banner-icon">
            <EliLogo size={64} />
          </div>
          <div className="install-banner-text">
            {isIos() && !isInStandaloneMode() ? (
              <>
                <div className="install-banner-title">Instala PreviNet</div>
                <div className="install-banner-subtitle">
                  Pulsa <span>Compartir</span> y luego <span>Añadir a pantalla de inicio</span>.
                </div>
              </>
            ) : (
              <>
                <div className="install-banner-title">PreviNet en tu pantalla</div>
                <div className="install-banner-subtitle">Acceso rápido y mejor experiencia sin conexión.</div>
              </>
            )}
          </div>
        </div>
        <div className="install-banner-actions">
          {(!isIos() || isInStandaloneMode()) && (
            <button className="btn-install-primary" onClick={promptInstall}>Instalar</button>
          )}
          <button className="btn-install-secondary" onClick={() => setVisible(false)}>Ahora no</button>
        </div>
      </div>
    </div>
  );
}
