let accessibilityWidgetLoadPromise = null;

async function loadAccessibilityWidget() {
  if (accessibilityWidgetLoadPromise) {
    return accessibilityWidgetLoadPromise;
  }

  accessibilityWidgetLoadPromise = (async () => {
  try {
    const existingContainer = document.getElementById("accessibility-widget-container");
    if (existingContainer?.querySelector("#accessibilityModal")) {
      if (typeof window.initAccessibilityTools === "function") {
        window.initAccessibilityTools();
      }
      return;
    }

    const response = await fetch("/partials/accessibility-widget.html", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load accessibility widget: ${response.status}`);
    }

    const html = await response.text();

    const container = existingContainer || document.createElement("div");
    container.id = "accessibility-widget-container";
    container.innerHTML = html;
    if (!existingContainer) document.body.appendChild(container);

    if (typeof window.initAccessibilityTools === "function") {
      window.initAccessibilityTools();
    } else {
      setTimeout(() => window.initAccessibilityTools?.(), 0);
    }
  } catch (error) {
    console.error("Accessibility widget load error:", error);
  }
  })();

  try {
    return await accessibilityWidgetLoadPromise;
  } finally {
    accessibilityWidgetLoadPromise = null;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadAccessibilityWidget, { once: true });
} else {
  loadAccessibilityWidget();
}

window.addEventListener("load", () => {
  if (!document.getElementById("accessibility-widget-container")) {
    loadAccessibilityWidget();
  }
}, { once: true });
