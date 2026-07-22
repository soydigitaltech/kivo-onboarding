import { initIcons } from "./icons.js";
import { initPageAnimations } from "./animations.js";
import { initOnboarding } from "./onboarding.js";

function initApp() {
  initIcons();
  initPageAnimations();
  initOnboarding();
}

document.addEventListener("DOMContentLoaded", initApp);

document.addEventListener("refresh-icons", () => {
  initIcons();
});
