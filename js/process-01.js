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

function initializeForm() {
  const form = document.getElementById("personalDataForm");

  const visibleFields = document.querySelectorAll(
    "#personalDataForm input:not([type='hidden'])",
  );

  const cityField = document.getElementById("city");

  configureBirthDate();

  form?.addEventListener("submit", handleFormSubmit);

  visibleFields.forEach((field) => {
    field.addEventListener("input", () => {
      normalizeFieldValue(field);

      if (field.getAttribute("aria-invalid") === "true") {
        validateField(field);
      }

      hideEligibilityResult();
    });

    field.addEventListener("change", () => {
      if (field.getAttribute("aria-invalid") === "true") {
        validateField(field);
      }

      hideEligibilityResult();
    });

    field.addEventListener("blur", () => {
      if (field.value.trim()) {
        validateField(field);
      }
    });
  });

  cityField?.addEventListener("change", () => {
    validateField(cityField);
    hideEligibilityResult();
  });
}

function initializeCustomSelect() {
  const customSelect = document.querySelector("[data-custom-select]");
  const selectButton = document.querySelector("[data-select-button]");
  const selectMenu = document.querySelector("[data-select-menu]");
  const selectLabel = document.querySelector("[data-select-label]");
  const selectChevron = document.querySelector("[data-select-chevron]");
  const cityInput = document.getElementById("city");

  const options = Array.from(
    document.querySelectorAll("[data-select-option]"),
  );

  if (
    !customSelect ||
    !selectButton ||
    !selectMenu ||
    !selectLabel ||
    !cityInput ||
    options.length === 0
  ) {
    console.error("No se pudo inicializar el selector de ciudad.");
    return;
  }

  selectButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    const isOpen =
      selectButton.getAttribute("aria-expanded") === "true";

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

      selectCity(option);
    });

    option.addEventListener("keydown", (event) => {
      const currentIndex = options.indexOf(option);

      if (event.key === "ArrowDown") {
        event.preventDefault();

        const nextIndex =
          currentIndex === options.length - 1
            ? 0
            : currentIndex + 1;

        options[nextIndex].focus();
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();

        const previousIndex =
          currentIndex === 0
            ? options.length - 1
            : currentIndex - 1;

        options[previousIndex].focus();
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();

        selectCity(option);
      }

      if (event.key === "Escape") {
        event.preventDefault();

        closeCitySelect();
        selectButton.focus();
      }
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
    }
  });

  function openCitySelect() {
    selectMenu.classList.remove("hidden");

    selectButton.setAttribute(
      "aria-expanded",
      "true",
    );

    selectChevron?.classList.add("rotate-180");

    const selectedOption = options.find(
      (option) =>
        option.getAttribute("aria-selected") === "true",
    );

    window.setTimeout(() => {
      selectedOption?.focus();

      if (!selectedOption) {
        options[0]?.focus();
      }
    }, 10);
  }

  function closeCitySelect() {
    selectMenu.classList.add("hidden");

    selectButton.setAttribute(
      "aria-expanded",
      "false",
    );

    selectChevron?.classList.remove("rotate-180");
  }

  function selectCity(option) {
    const cityValue = option.dataset.value;

    const cityName =
      option.querySelector("span")?.textContent.trim() ||
      option.textContent.trim();

    if (!cityValue) {
      return;
    }

    cityInput.value = cityValue;
    selectLabel.textContent = cityName;

    selectLabel.classList.remove("text-[#8a94a8]");
    selectLabel.classList.add(
      "text-[#122044]",
      "font-medium",
    );

    selectButton.classList.remove("text-[#8a94a8]");
    selectButton.classList.add("text-[#122044]");

    options.forEach((item) => {
      item.setAttribute(
        "aria-selected",
        "false",
      );

      item.classList.remove(
        "bg-[#edf5ff]",
        "text-[#075eeb]",
        "font-bold",
      );

      item.classList.add(
        "text-[#122044]",
        "font-medium",
      );

      const checkIcon =
        item.querySelector("[data-option-check]");

      checkIcon?.classList.add("hidden");
    });

    option.setAttribute(
      "aria-selected",
      "true",
    );

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
    selectButton.focus();
  }
}

function configureBirthDate() {
  const birthDateInput =
    document.getElementById("birthDate");

  if (!birthDateInput) {
    return;
  }

  birthDateInput.max =
    formatDateForInput(new Date());
}

function normalizeFieldValue(field) {
  if (
    field.id === "identityNumber" ||
    field.id === "phone"
  ) {
    field.value = field.value.replace(/\D/g, "");
  }

  if (field.id === "fullName") {
    field.value = field.value.replace(/\s{2,}/g, " ");
  }
}

function handleFormSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;

  const fields = [
    ...form.querySelectorAll(
      "input:not([type='hidden'])",
    ),
    document.getElementById("city"),
  ].filter(Boolean);

  let firstInvalidField = null;
  let isFormValid = true;

  fields.forEach((field) => {
    const isFieldValid =
      validateField(field);

    if (!isFieldValid) {
      isFormValid = false;

      if (!firstInvalidField) {
        firstInvalidField = field;
      }
    }
  });

  if (!isFormValid) {
    focusInvalidField(firstInvalidField);
    return;
  }

  evaluateEligibility();
}

function validateField(field) {
  const value = field.value.trim();

  if (!value) {
    showFieldError(
      field,
      field.dataset.requiredMessage ||
        "Completa este campo.",
    );

    return false;
  }

  if (field.id === "fullName") {
    const words = value
      .split(/\s+/)
      .filter(Boolean);

    if (words.length < 2) {
      showFieldError(
        field,
        "Ingresa al menos un nombre y un apellido.",
      );

      return false;
    }

    const validNamePattern =
      /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]+$/;

    if (!validNamePattern.test(value)) {
      showFieldError(
        field,
        "El nombre contiene caracteres no válidos.",
      );

      return false;
    }
  }

  if (field.id === "identityNumber") {
    if (!/^\d{5,12}$/.test(value)) {
      showFieldError(
        field,
        "Ingresa un número de CI válido.",
      );

      return false;
    }
  }

  if (field.id === "phone") {
    if (!/^[67]\d{7}$/.test(value)) {
      showFieldError(
        field,
        "Ingresa un celular válido de 8 dígitos.",
      );

      return false;
    }
  }

  if (field.id === "birthDate") {
    const birthDate =
      parseLocalDate(value);

    if (
      !birthDate ||
      Number.isNaN(birthDate.getTime())
    ) {
      showFieldError(
        field,
        "Selecciona una fecha de nacimiento válida.",
      );

      return false;
    }

    if (birthDate > new Date()) {
      showFieldError(
        field,
        "La fecha de nacimiento no puede ser futura.",
      );

      return false;
    }
  }

  if (field.id === "city" && !value) {
    showFieldError(
      field,
      "Selecciona tu ciudad.",
    );

    return false;
  }

  clearFieldError(field);

  return true;
}

function showFieldError(field, message) {
  field.setAttribute(
    "aria-invalid",
    "true",
  );

  const container =
    document.querySelector(
      `[data-field-container="${field.id}"]`,
    );

  const error =
    document.querySelector(
      `[data-field-error="${field.id}"]`,
    );

  if (field.id === "city") {
    const cityButton =
      document.querySelector(
        "[data-select-button]",
      );

    cityButton?.classList.remove(
      "border-[#d8deea]",
      "focus:border-primary",
      "focus:ring-primary/15",
    );

    cityButton?.classList.add(
      "border-error",
      "ring-4",
      "ring-error/10",
      "focus:border-error",
      "focus:ring-error/15",
    );

    cityButton?.setAttribute(
      "aria-invalid",
      "true",
    );
  } else {
    container?.classList.remove(
      "border-[#d8deea]",
      "focus-within:border-primary",
      "focus-within:ring-primary/15",
    );

    container?.classList.add(
      "border-error",
      "ring-4",
      "ring-error/10",
      "focus-within:border-error",
      "focus-within:ring-error/15",
    );
  }

  if (error) {
    const messageElement =
      error.querySelector("span");

    if (messageElement) {
      messageElement.textContent = message;
    }

    error.classList.remove("hidden");
    error.classList.add("flex");
  }
}

function clearFieldError(field) {
  field.removeAttribute("aria-invalid");

  const container =
    document.querySelector(
      `[data-field-container="${field.id}"]`,
    );

  const error =
    document.querySelector(
      `[data-field-error="${field.id}"]`,
    );

  if (field.id === "city") {
    const cityButton =
      document.querySelector(
        "[data-select-button]",
      );

    cityButton?.classList.remove(
      "border-error",
      "ring-4",
      "ring-error/10",
      "focus:border-error",
      "focus:ring-error/15",
    );

    cityButton?.classList.add(
      "border-[#d8deea]",
      "focus:border-primary",
      "focus:ring-primary/15",
    );

    cityButton?.removeAttribute(
      "aria-invalid",
    );
  } else {
    container?.classList.remove(
      "border-error",
      "ring-4",
      "ring-error/10",
      "focus-within:border-error",
      "focus-within:ring-error/15",
    );

    container?.classList.add(
      "border-[#d8deea]",
      "focus-within:border-primary",
      "focus-within:ring-primary/15",
    );
  }

  error?.classList.add("hidden");
  error?.classList.remove("flex");
}

function focusInvalidField(field) {
  if (!field) {
    return;
  }

  const focusTarget =
    field.id === "city"
      ? document.querySelector(
          "[data-select-button]",
        )
      : field;

  focusTarget?.focus({
    preventScroll: true,
  });

  const animationTarget =
    field.id === "city"
      ? document.querySelector(
          "[data-select-button]",
        )
      : document.querySelector(
          `[data-field-container="${field.id}"]`,
        );

  animationTarget?.animate(
    [
      { transform: "translateX(0)" },
      { transform: "translateX(-6px)" },
      { transform: "translateX(6px)" },
      { transform: "translateX(-4px)" },
      { transform: "translateX(4px)" },
      { transform: "translateX(0)" },
    ],
    {
      duration: 320,
      easing: "ease-out",
    },
  );
}

function evaluateEligibility() {
  const birthDateValue =
    document.getElementById(
      "birthDate",
    )?.value;

  const city =
    document.getElementById(
      "city",
    )?.value;

  const birthDate =
    parseLocalDate(birthDateValue);

  const age =
    calculateExactAge(birthDate);

  if (
    age <
    ELIGIBILITY_RULES.minimumAge
  ) {
    showEligibilityResult({
      approved: false,
      title: "Aún no puedes continuar",
      message:
        `Para solicitar un préstamo debes tener al menos ` +
        `${ELIGIBILITY_RULES.minimumAge} años.`,
      reason: "AGE_BELOW_MINIMUM",
      age,
    });

    return;
  }

  if (
    age >
    ELIGIBILITY_RULES.maximumAge
  ) {
    showEligibilityResult({
      approved: false,
      title: "Por ahora no podemos continuar",
      message:
        `Actualmente nuestros préstamos están disponibles hasta los ` +
        `${ELIGIBILITY_RULES.maximumAge} años.`,
      reason: "AGE_ABOVE_MAXIMUM",
      age,
    });

    return;
  }

  if (
    !ELIGIBILITY_RULES.eligibleCities.includes(
      city,
    )
  ) {
    showEligibilityResult({
      approved: false,
      title: "Todavía no llegamos a tu ciudad",
      message:
        "Actualmente tu ciudad no se encuentra dentro de nuestra cobertura.",
      reason: "CITY_OUTSIDE_COVERAGE",
      age,
    });

    return;
  }

  showEligibilityResult({
    approved: true,
    title: "¡Puedes continuar!",
    message:
      "Tus datos cumplen nuestras condiciones iniciales de elegibilidad.",
    reason: "ELIGIBLE",
    age,
  });
}

function showEligibilityResult({
  approved,
  title,
  message,
  reason,
  age,
}) {
  const result =
    document.querySelector(
      "[data-eligibility-result]",
    );

  const resultIcon =
    document.querySelector(
      "[data-result-icon]",
    );

  const resultLucide =
    document.querySelector(
      "[data-result-lucide]",
    );

  const resultEyebrow =
    document.querySelector(
      "[data-result-eyebrow]",
    );

  const resultTitle =
    document.querySelector(
      "[data-result-title]",
    );

  const resultMessage =
    document.querySelector(
      "[data-result-message]",
    );

  const submitButton =
    document.querySelector(
      "[data-submit-button]",
    );

  const submitLabel =
    document.querySelector(
      "[data-submit-label]",
    );

  resetResultStyles({
    result,
    resultIcon,
    resultEyebrow,
  });

  result?.classList.remove("hidden");

  if (resultTitle) {
    resultTitle.textContent = title;
  }

  if (resultMessage) {
    resultMessage.textContent = message;
  }

  if (approved) {
    result?.classList.add(
      "border-success/25",
      "bg-success/5",
    );

    resultIcon?.classList.add(
      "bg-success/10",
      "text-success",
    );

    resultEyebrow?.classList.add(
      "text-success",
    );

    resultLucide?.setAttribute(
      "data-lucide",
      "circle-check-big",
    );

    if (submitLabel) {
      submitLabel.textContent =
        "Continuar con mi solicitud";
    }

    submitButton?.setAttribute(
      "type",
      "button",
    );

    submitButton?.removeEventListener(
      "click",
      continueToNextProcess,
    );

    submitButton?.addEventListener(
      "click",
      continueToNextProcess,
      {
        once: true,
      },
    );
  } else {
    result?.classList.add(
      "border-error/25",
      "bg-error/5",
    );

    resultIcon?.classList.add(
      "bg-error/10",
      "text-error",
    );

    resultEyebrow?.classList.add(
      "text-error",
    );

    resultLucide?.setAttribute(
      "data-lucide",
      "circle-x",
    );

    submitButton?.classList.add("hidden");
  }

  saveApplicationData({
    approved,
    reason,
    age,
  });

  initIcons();
}

function resetResultStyles({
  result,
  resultIcon,
  resultEyebrow,
}) {
  result?.classList.remove(
    "border-success/25",
    "bg-success/5",
    "border-error/25",
    "bg-error/5",
  );

  resultIcon?.classList.remove(
    "bg-success/10",
    "text-success",
    "bg-error/10",
    "text-error",
  );

  resultEyebrow?.classList.remove(
    "text-success",
    "text-error",
  );
}

function hideEligibilityResult() {
  const result =
    document.querySelector(
      "[data-eligibility-result]",
    );

  const submitButton =
    document.querySelector(
      "[data-submit-button]",
    );

  const submitLabel =
    document.querySelector(
      "[data-submit-label]",
    );

  result?.classList.add("hidden");

  submitButton?.classList.remove("hidden");

  submitButton?.setAttribute(
    "type",
    "submit",
  );

  submitButton?.removeEventListener(
    "click",
    continueToNextProcess,
  );

  if (submitLabel) {
    submitLabel.textContent =
      "Verificar y continuar";
  }
}

function calculateExactAge(birthDate) {
  const today = new Date();

  let age =
    today.getFullYear() -
    birthDate.getFullYear();

  const birthdayNotReached =
    today.getMonth() <
      birthDate.getMonth() ||
    (today.getMonth() ===
      birthDate.getMonth() &&
      today.getDate() <
        birthDate.getDate());

  if (birthdayNotReached) {
    age -= 1;
  }

  return age;
}

function parseLocalDate(value) {
  if (!value) {
    return null;
  }

  const [year, month, day] =
    value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(
    year,
    month - 1,
    day,
  );
}

function formatDateForInput(date) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(2, "0");

  const day =
    String(
      date.getDate(),
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function saveApplicationData({
  approved,
  reason,
  age,
}) {
  const cityInput =
    document.getElementById("city");

  const cityOption =
    document.querySelector(
      `[data-select-option][data-value="${cityInput?.value}"] span`,
    );

  const formData = {
    fullName:
      document
        .getElementById("fullName")
        ?.value.trim(),

    identityNumber:
      document
        .getElementById("identityNumber")
        ?.value.trim(),

    phone:
      document
        .getElementById("phone")
        ?.value.trim(),

    birthDate:
      document.getElementById(
        "birthDate",
      )?.value,

    city:
      cityInput?.value,

    cityName:
      cityOption?.textContent.trim() || "",

    age,

    eligibility: {
      approved,
      reason,
      ruleVersion:
        ELIGIBILITY_RULES.version,
      evaluatedAt:
        new Date().toISOString(),
    },
  };

  sessionStorage.setItem(
    "kivo-personal-data",
    JSON.stringify(formData),
  );

  console.log(
    "Datos personales:",
    formData,
  );
}

function continueToNextProcess() {
  window.location.href = "/process-02/";
}