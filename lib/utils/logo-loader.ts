let cachedLogoDataUrl: string | null = null;
let loadingPromise: Promise<string | null> | null = null;

export async function getLogoDataUrl(): Promise<string | null> {
  if (cachedLogoDataUrl) {
    return cachedLogoDataUrl;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      if (typeof window === "undefined") {
        // Entorno del servidor (Next.js API / Server Actions)
        const fs = await import("fs/promises");
        const path = await import("path");
        const filePath = path.join(process.cwd(), "public", "branding", "logo.png");
        const buffer = await fs.readFile(filePath);
        cachedLogoDataUrl = `data:image/png;base64,${buffer.toString("base64")}`;
        return cachedLogoDataUrl;
      }

      // Entorno del navegador
      const response = await fetch("/branding/logo.png");
      if (!response.ok) throw new Error("No se pudo cargar el logo");
      const blob = await response.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      cachedLogoDataUrl = dataUrl;
      return cachedLogoDataUrl;
    } catch (error) {
      console.error("Error cargando el logo corporativo:", error);
      return null;
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

