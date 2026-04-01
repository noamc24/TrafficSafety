window.initAccessibilityTools = function () {
  const increaseText = document.getElementById("increaseText");
  const highContrast = document.getElementById("highContrast");
  const disableAnimations = document.getElementById("disableAnimations");
  const readableFont = document.getElementById("readableFont");
  const applyButton = document.getElementById("applyAccessibility");

  if (!increaseText || !highContrast || !disableAnimations || !readableFont || !applyButton) {
    return;
  }

  if (applyButton.dataset.initialized === "true") {
    return;
  }
  applyButton.dataset.initialized = "true";

  const savedSettings = JSON.parse(localStorage.getItem("accessibilitySettings")) || {};

  increaseText.checked = !!savedSettings.increaseText;
  highContrast.checked = !!savedSettings.highContrast;
  disableAnimations.checked = !!savedSettings.disableAnimations;
  readableFont.checked = !!savedSettings.readableFont;

  applyAccessibilitySettings(savedSettings);

  applyButton.addEventListener("click", () => {
    const settings = {
      increaseText: increaseText.checked,
      highContrast: highContrast.checked,
      disableAnimations: disableAnimations.checked,
      readableFont: readableFont.checked,
    };

    localStorage.setItem("accessibilitySettings", JSON.stringify(settings));
    applyAccessibilitySettings(settings);

    const modalElement = document.getElementById("accessibilityModal");
    if (modalElement && window.bootstrap) {
      const modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
      modalInstance.hide();
    }
  });
};

function applyAccessibilitySettings(settings) {
  document.body.classList.toggle("accessibility-text-large", !!settings.increaseText);
  document.body.classList.toggle("accessibility-high-contrast", !!settings.highContrast);
  document.body.classList.toggle("accessibility-no-animations", !!settings.disableAnimations);
  document.body.classList.toggle("accessibility-readable-font", !!settings.readableFont);
}