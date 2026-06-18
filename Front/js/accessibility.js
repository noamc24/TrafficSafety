window.initAccessibilityTools = function () {
  const increaseText = document.getElementById("increaseText");
  const highContrast = document.getElementById("highContrast");
  const disableAnimations = document.getElementById("disableAnimations");
  const readableFont = document.getElementById("readableFont");
  const applyButton = document.getElementById("applyAccessibility");
  const resetButton = document.getElementById("resetAccessibility");

  if (!increaseText || !highContrast || !disableAnimations || !readableFont || !applyButton) {
    return;
  }

  if (applyButton.dataset.initialized === "true") {
    return;
  }
  applyButton.dataset.initialized = "true";

  const controls = [increaseText, highContrast, disableAnimations, readableFont];
  const readSavedSettings = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem("accessibilitySettings") || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      localStorage.removeItem("accessibilitySettings");
      return {};
    }
  };

  const syncControls = (settings) => {
    increaseText.checked = !!settings.increaseText;
    highContrast.checked = !!settings.highContrast;
    disableAnimations.checked = !!settings.disableAnimations;
    readableFont.checked = !!settings.readableFont;
  };

  const collectSettings = () => ({
    increaseText: increaseText.checked,
    highContrast: highContrast.checked,
    disableAnimations: disableAnimations.checked,
    readableFont: readableFont.checked,
  });

  const saveAndApply = (settings) => {
    localStorage.setItem("accessibilitySettings", JSON.stringify(settings));
    applyAccessibilitySettings(settings);
  };

  const savedSettings = readSavedSettings();

  syncControls(savedSettings);
  applyAccessibilitySettings(savedSettings);

  controls.forEach((control) => {
    control.addEventListener("change", () => {
      applyAccessibilitySettings(collectSettings());
    });
  });

  applyButton.addEventListener("click", () => {
    saveAndApply(collectSettings());
    const modalElement = document.getElementById("accessibilityModal");
    if (modalElement && window.bootstrap) {
      const modalInstance =
        bootstrap.Modal.getInstance(modalElement) ||
        new bootstrap.Modal(modalElement);
      modalInstance.hide();
    }
  });

  resetButton?.addEventListener("click", () => {
    const emptySettings = {
      increaseText: false,
      highContrast: false,
      disableAnimations: false,
      readableFont: false,
    };
    syncControls(emptySettings);
    saveAndApply(emptySettings);
  });
};

function applyAccessibilitySettings(settings) {
  try {
    const root = document.documentElement;
    const body = document.body;
    if (!root || !body) return;

    root.classList.toggle("accessibility-text-large", !!settings.increaseText);

    body.classList.toggle("accessibility-high-contrast", !!settings.highContrast);
    body.classList.toggle("accessibility-no-animations", !!settings.disableAnimations);
    body.classList.toggle("accessibility-readable-font", !!settings.readableFont);
  } catch (err) {
    // Prevent accessibility toggles from throwing and breaking other UI
    console.error('applyAccessibilitySettings error', err);
  }
}
