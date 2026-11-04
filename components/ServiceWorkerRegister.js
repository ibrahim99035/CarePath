"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (process.env.NODE_ENV !== "production") {
      console.info(
        "[CarePath] Service worker is disabled in development. Run `npm run build && npm run preview` to test offline mode."
      );
      return;
    }

    if (!("serviceWorker" in navigator)) {
      console.warn(
        "[CarePath] This browser does not support service workers, so offline mode is unavailable."
      );
      return;
    }

    if (!window.isSecureContext) {
      console.warn(
        "[CarePath] Offline mode needs HTTPS or localhost. The service worker was not registered."
      );
      return;
    }

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          if (registration.waiting) {
            console.info(
              "[CarePath] A new offline cache is ready. Reload the page to activate it."
            );
          }
        })
        .catch((error) => {
          console.warn(
            "[CarePath] Service worker registration failed, so offline mode is unavailable.",
            error
          );
        });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
