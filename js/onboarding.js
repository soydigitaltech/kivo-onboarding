import { initIcons } from "./icons.js";

const ELIGIBILITY_RULES = {
  version: "eligibility-v1.0.0",

  minimumAge: 18,

  maximumAge: 65,

  eligibleCities: [
    "la-paz",
    "el-alto",
    "cochabamba",
    "santa-cruz",
  ],
};

document.addEventListener("DOMContentLoaded", () => {
  initIcons();
  initializeForm();
  initializeCustomSelect();
});

function initializeCustomSelect() {
  const customSelect = document.querySelector("[data-custom-select]");
  const button = document.querySelector("[data-select-button]");
  const menu = document.querySelector("[data-select-menu]");
  const label = document.querySelector("[data-select-label]");
  const chevron = document.querySelector("[data-select-chevron]");
  const cityInput = document.getElementById("city");

  const options = document.querySelectorAll("[data-select-option]");

  if (
    !customSelect ||
    !button ||
    !menu ||
    !label ||
    !cityInput
  ) {
    console.error("No se pudo inicializar el selector de ciudad.");
    return;
  }

  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    const isOpen = !menu.classList.contains("hidden");

    if (isOpen) {
      closeCitySelect();
    } else {
      openCitySelect();
    }
  });

  options.forEach((option) => {
    option.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const value = option.dataset.value;
      const text =
        option.querySelector("span")?.textContent.trim() ||
        option.textContent.trim();

      cityInput.value = value;
      label.textContent = text;

      label.classList.remove("text-[#8a94a8]");
      label.classList.add(
        "text-[#122044]",
        "font-medium",
      );

      button.classList.remove("text-[#8a94a8]");
      button.classList.add("text-[#122044]");

      options.forEach((item) => {
        item.setAttribute("aria-selected", "false");

        item.classList.remove(
          "bg-[#edf5ff]",
          "text-[#075eeb]",
          "font-bold",
        );

        item.classList.add(
          "text-[#122044]",
          "font-medium",
        );

        const check = item.querySelector("[data-option-check]");

        check?.classList.add("hidden");
      });

      option.setAttribute("aria-selected", "true");

      option.classList.remove(
        "text-[#122044]",
        "font-medium",
      );

      option.classList.add(
        "bg-[#edf5ff]",
        "text-[#075eeb]",
        "font-bold",
      );

      const selectedCheck =
        option.querySelector("[data-option-check]");

      selectedCheck?.classList.remove("hidden");

      clearFieldError(cityInput);
      hideEligibilityResult();

      cityInput.dispatchEvent(
        new Event("change", {
          bubbles: true,
        }),
      );

      closeCitySelect();
    });
  });

  document.addEventListener("click", (event) => {
    if (!customSelect.contains(event.target)) {
      closeCitySelect();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeCitySelect();
      button.focus();
    }
  });

  function openCitySelect() {
    menu.classList.remove("hidden");
    button.setAttribute("aria-expanded", "true");
    chevron?.classList.add("rotate-180");
  }

  function closeCitySelect() {
    menu.classList.add("hidden");
    button.setAttribute("aria-expanded", "false");
    chevron?.classList.remove("rotate-180");
  }
}