document.addEventListener("DOMContentLoaded", async () => {
  try {
    if (document.getElementById("accessibility-widget-container")) {
      if (typeof window.initAccessibilityTools === "function") {
        window.initAccessibilityTools();
      }
      return;
    }

    const response = await fetch("/partials/accessibility-widget.html");
    if (!response.ok) {
      throw new Error(`Failed to load accessibility widget: ${response.status}`);
    }

    const html = await response.text();

    const container = document.createElement("div");
    container.id = "accessibility-widget-container";
    container.innerHTML = html;
    document.body.appendChild(container);

    if (typeof window.initAccessibilityTools === "function") {
      window.initAccessibilityTools();
    } else {
      console.warn("initAccessibilityTools is not loaded yet");
    }
  } catch (error) {
    console.error("Accessibility widget load error:", error);
  }
});
