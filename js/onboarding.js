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

/**
 * Inicializa la lógica de la primera pantalla del onboarding.
 * Esta función es llamada desde js/app.js.
 */
export function initOnboarding() {
  initializeForm();
  initializeCustomSelect();
}

/**
 * Inicializa el formulario y sus validaciones.
 */
function initializeForm() {
  const form = document.querySelector("[data-onboarding-form]");

  if (!form) {
    console.warn(
      "No se encontró el formulario con data-onboarding-form.",
    );
    return;
  }

  const requiredFields = Array.from(
    form.querySelectorAll("[required]"),
  );

  requiredFields.forEach((field) => {
    field.addEventListener("input", () => {
      clearFieldError(field);
      hideEligibilityResult();
    });

    field.addEventListener("change", () => {
      clearFieldError(field);
      hideEligibilityResult();
    });

    field.addEventListener("blur", () => {
      if (field.value.trim()) {
        validateField(field);
      }
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    hideEligibilityResult();

    const validationResult = validateForm(requiredFields);

    if (!validationResult.valid) {
      validationResult.firstInvalidField?.focus();
      return;
    }

    const eligibilityResult = evaluateEligibility(form);

    saveOnboardingData(form, eligibilityResult);
    showEligibilityResult(eligibilityResult);
  });
}

/**
 * Valida todos los campos obligatorios.
 */
function validateForm(fields) {
  let isValid = true;
  let firstInvalidField = null;

  fields.forEach((field) => {
    const fieldIsValid = validateField(field);

    if (!fieldIsValid) {
      isValid = false;
      firstInvalidField ||= field;
    }
  });

  return {
    valid: isValid,
    firstInvalidField,
  };
}

/**
 * Valida un campo individual.
 */
function validateField(field) {
  const value = field.value.trim();

  if (!value) {
    showFieldError(
      field,
      getRequiredFieldMessage(field),
    );

    return false;
  }

  if (field.type === "email" && !isValidEmail(value)) {
    showFieldError(
      field,
      "Ingresa un correo electrónico válido.",
    );

    return false;
  }

  if (
    field.type === "date" ||
    field.id === "birthDate" ||
    field.id === "birthdate" ||
    field.id === "dateOfBirth"
  ) {
    const age = calculateAge(value);

    if (age === null) {
      showFieldError(
        field,
        "Ingresa una fecha de nacimiento válida.",
      );

      return false;
    }

    if (age < ELIGIBILITY_RULES.minimumAge) {
      showFieldError(
        field,
        `Debes tener al menos ${ELIGIBILITY_RULES.minimumAge} años.`,
      );

      return false;
    }

    if (age > ELIGIBILITY_RULES.maximumAge) {
      showFieldError(
        field,
        `La edad máxima permitida es de ${ELIGIBILITY_RULES.maximumAge} años.`,
      );

      return false;
    }
  }

  if (field.id === "city") {
    if (!ELIGIBILITY_RULES.eligibleCities.includes(value)) {
      showFieldError(
        field,
        "Por el momento Kivo no está disponible en esta ciudad.",
      );

      return false;
    }
  }

  clearFieldError(field);
  return true;
}

/**
 * Devuelve el mensaje obligatorio apropiado para cada campo.
 */
function getRequiredFieldMessage(field) {
  const label =
    field.dataset.fieldLabel ||
    field.getAttribute("aria-label") ||
    "";

  if (field.id === "city") {
    return "Selecciona tu ciudad de residencia.";
  }

  if (
    field.id === "birthDate" ||
    field.id === "birthdate" ||
    field.id === "dateOfBirth"
  ) {
    return "Selecciona tu fecha de nacimiento.";
  }

  if (
    field.id === "fullName" ||
    field.id === "name"
  ) {
    return "Ingresa tu nombre completo.";
  }

  if (
    field.id === "documentNumber" ||
    field.id === "document"
  ) {
    return "Ingresa tu número de documento.";
  }

  if (
    field.id === "phone" ||
    field.id === "phoneNumber"
  ) {
    return "Ingresa tu número de teléfono.";
  }

  if (field.type === "email") {
    return "Ingresa tu correo electrónico.";
  }

  if (label) {
    return `Completa el campo ${label}.`;
  }

  return "Este campo es obligatorio.";
}

/**
 * Evalúa la edad y la ciudad seleccionada.
 */
function evaluateEligibility(form) {
  const formData = new FormData(form);

  const birthDate =
    formData.get("birthDate") ||
    formData.get("birthdate") ||
    formData.get("dateOfBirth") ||
    document.getElementById("birthDate")?.value ||
    document.getElementById("birthdate")?.value ||
    document.getElementById("dateOfBirth")?.value ||
    "";

  const city =
    formData.get("city") ||
    document.getElementById("city")?.value ||
    "";

  const age = birthDate
    ? calculateAge(String(birthDate))
    : null;

  if (
    age !== null &&
    age < ELIGIBILITY_RULES.minimumAge
  ) {
    return {
      eligible: false,
      reason: "AGE_BELOW_MINIMUM",
      title: "Por ahora no puedes continuar",
      message: `Debes tener al menos ${ELIGIBILITY_RULES.minimumAge} años para solicitar un préstamo.`,
    };
  }

  if (
    age !== null &&
    age > ELIGIBILITY_RULES.maximumAge
  ) {
    return {
      eligible: false,
      reason: "AGE_ABOVE_MAXIMUM",
      title: "Por ahora no puedes continuar",
      message: `La edad máxima permitida es de ${ELIGIBILITY_RULES.maximumAge} años.`,
    };
  }

  if (
    city &&
    !ELIGIBILITY_RULES.eligibleCities.includes(
      String(city),
    )
  ) {
    return {
      eligible: false,
      reason: "CITY_NOT_SUPPORTED",
      title: "Aún no llegamos a tu ciudad",
      message:
        "Actualmente Kivo no está disponible en tu ciudad de residencia.",
    };
  }

  return {
    eligible: true,
    reason: "INITIAL_REQUIREMENTS_MET",
    title: "¡Puedes continuar!",
    message:
      "Cumples con los requisitos iniciales para continuar con tu solicitud.",
  };
}

/**
 * Inicializa el selector personalizado de ciudad.
 */
function initializeCustomSelect() {
  const customSelect = document.querySelector(
    "[data-custom-select]",
  );

  const button = document.querySelector(
    "[data-select-button]",
  );

  const menu = document.querySelector(
    "[data-select-menu]",
  );

  const label = document.querySelector(
    "[data-select-label]",
  );

  const chevron = document.querySelector(
    "[data-select-chevron]",
  );

  const cityInput = document.getElementById("city");

  const options = document.querySelectorAll(
    "[data-select-option]",
  );

  if (
    !customSelect ||
    !button ||
    !menu ||
    !label ||
    !cityInput
  ) {
    console.warn(
      "No se encontró el selector personalizado de ciudad.",
    );

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
        option
          .querySelector("span")
          ?.textContent.trim() ||
        option.textContent.trim();

      if (!value) {
        console.error(
          "La opción seleccionada no tiene data-value.",
        );
        return;
      }

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

        const check = item.querySelector(
          "[data-option-check]",
        );

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

      const selectedCheck = option.querySelector(
        "[data-option-check]",
      );

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

/**
 * Muestra el mensaje de error de un campo.
 */
function showFieldError(field, message) {
  field.setAttribute("aria-invalid", "true");

  const container = document.querySelector(
    `[data-field-container="${field.id}"]`,
  );

  const error = document.querySelector(
    `[data-field-error="${field.id}"]`,
  );

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

  if (error) {
    const errorText =
      error.querySelector("span") || error;

    errorText.textContent = message;

    error.classList.remove("hidden");
    error.classList.add("flex");
  }
}

/**
 * Limpia el mensaje de error de un campo.
 */
function clearFieldError(field) {
  field.removeAttribute("aria-invalid");

  const container = document.querySelector(
    `[data-field-container="${field.id}"]`,
  );

  const error = document.querySelector(
    `[data-field-error="${field.id}"]`,
  );

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

  error?.classList.add("hidden");
  error?.classList.remove("flex");
}

/**
 * Muestra el resultado de elegibilidad.
 */
function showEligibilityResult({
  eligible,
  title,
  message,
}) {
  const result = document.querySelector(
    "[data-eligibility-result]",
  );

  const resultTitle = document.querySelector(
    "[data-result-title]",
  );

  const resultMessage = document.querySelector(
    "[data-result-message]",
  );

  const submitButton = document.querySelector(
    "[data-submit-button]",
  );

  const submitLabel = document.querySelector(
    "[data-submit-label]",
  );

  if (!result) {
    if (eligible) {
      continueToNextProcess();
    }

    return;
  }

  result.classList.remove("hidden");

  if (resultTitle) {
    resultTitle.textContent = title;
  }

  if (resultMessage) {
    resultMessage.textContent = message;
  }

  result.dataset.status = eligible
    ? "approved"
    : "rejected";

  if (!submitButton) {
    return;
  }

  if (eligible) {
    submitButton.setAttribute("type", "button");
    submitButton.removeAttribute("disabled");

    if (submitLabel) {
      submitLabel.textContent = "Continuar";
    }

    submitButton.removeEventListener(
      "click",
      continueToNextProcess,
    );

    submitButton.addEventListener(
      "click",
      continueToNextProcess,
      {
        once: true,
      },
    );
  } else {
    submitButton.setAttribute("type", "button");
    submitButton.setAttribute("disabled", "true");

    if (submitLabel) {
      submitLabel.textContent =
        "No puedes continuar";
    }
  }

  document.dispatchEvent(
    new CustomEvent("refresh-icons"),
  );
}

/**
 * Oculta el resultado anterior.
 */
function hideEligibilityResult() {
  const result = document.querySelector(
    "[data-eligibility-result]",
  );

  const submitButton = document.querySelector(
    "[data-submit-button]",
  );

  const submitLabel = document.querySelector(
    "[data-submit-label]",
  );

  result?.classList.add("hidden");

  submitButton?.removeAttribute("disabled");
  submitButton?.setAttribute("type", "submit");

  submitButton?.removeEventListener(
    "click",
    continueToNextProcess,
  );

  if (submitLabel) {
    submitLabel.textContent = "Continuar";
  }
}

/**
 * Guarda temporalmente la información del formulario.
 */
function saveOnboardingData(form, eligibilityResult) {
  const formData = Object.fromEntries(
    new FormData(form).entries(),
  );

  const payload = {
    ...formData,
    eligibility: eligibilityResult,
    eligibilityRulesVersion:
      ELIGIBILITY_RULES.version,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(
      "kivo:onboarding",
      JSON.stringify(payload),
    );
  } catch (error) {
    console.error(
      "No se pudo guardar la información del onboarding.",
      error,
    );
  }
}

/**
 * Continúa hacia la siguiente pantalla.
 */
function continueToNextProcess() {
  window.location.href = "/process-02/";
}

/**
 * Calcula la edad a partir de la fecha de nacimiento.
 */
function calculateAge(dateValue) {
  if (!dateValue) {
    return null;
  }

  const birthDate = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();

  if (birthDate > today) {
    return null;
  }

  let age =
    today.getFullYear() - birthDate.getFullYear();

  const monthDifference =
    today.getMonth() - birthDate.getMonth();

  const birthdayHasNotOccurred =
    monthDifference < 0 ||
    (monthDifference === 0 &&
      today.getDate() < birthDate.getDate());

  if (birthdayHasNotOccurred) {
    age -= 1;
  }

  return age;
}

/**
 * Valida un correo electrónico.
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email,
  );
}