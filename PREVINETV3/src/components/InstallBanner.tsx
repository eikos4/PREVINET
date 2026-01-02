import { useEffect, useState } from "react";

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

  if (installed) return null;

  if (isIos() && !isInStandaloneMode()) {
    return visible ? (
      <div className="install-banner" style={{position: 'fixed', bottom: 10, left: 10, right: 10, background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,.15)', zIndex: 9999}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div style={{fontSize: 14}}>
            Para instalar en iOS: pulsa <strong>Compartir → Añadir a pantalla de inicio</strong>
          </div>
          <div>
            <button className="btn" onClick={() => setVisible(false)} style={{marginLeft: 8}}>Cerrar</button>
          </div>
        </div>
      </div>
    ) : null;
  }

  return visible ? (
    <div className="install-banner" style={{position: 'fixed', bottom: 10, left: 10, right: 10, background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,.15)', zIndex: 9999}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{fontSize: 14}}>¿Quieres instalar la app?</div>
        <div>
          <button className="btn-primary" onClick={promptInstall}>Instalar</button>
          <button className="btn" onClick={() => setVisible(false)} style={{marginLeft: 8}}>Cerrar</button>
        </div>
      </div>
    </div>
  ) : null;
}
