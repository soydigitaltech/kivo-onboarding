import {
  pulse,
  shake,
} from "./animations.js";

export function initOnboarding() {
  initRequiredForms();
  initPasswordToggle();
  initButtons();
}

function initRequiredForms() {
  const forms = document.querySelectorAll("[data-onboarding-form]");

  forms.forEach((form) => {
    const requiredFields = form.querySelectorAll("[required]");
    const successMessage = form.querySelector("[data-success-message]");

    requiredFields.forEach((field) => {
      field.addEventListener("input", () => {
        validateField(field);
        hideValidationMessage(successMessage);
      });

      field.addEventListener("blur", () => {
        validateField(field);
      });
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      hideValidationMessage(successMessage);

      let firstInvalidField = null;
      let formIsValid = true;

      requiredFields.forEach((field) => {
        const fieldIsValid = validateField(field);

        if (!fieldIsValid) {
          formIsValid = false;

          if (!firstInvalidField) {
            firstInvalidField = field;
          }
        }
      });

      if (!formIsValid) {
        if (firstInvalidField) {
          shake(firstInvalidField);
          firstInvalidField.focus();
        }

        return;
      }

      showValidationMessage(successMessage);

      const submitButton = form.querySelector('button[type="submit"]');

      pulse(submitButton);

      /*
       * Aquí colocaremos la navegación al siguiente paso.
       *
       * Ejemplo:
       * window.location.href = "/pages/onboarding/process-02/";
       */
    });
  });
}

function validateField(field) {
  const value = field.value.trim();

  if (!value) {
    setFieldError(
      field,
      getRequiredMessage(field),
    );

    return false;
  }

  if (field.type === "email" && !isValidEmail(value)) {
    setFieldError(
      field,
      "Ingresa un correo electrónico válido.",
    );

    return false;
  }

  clearFieldError(field);

  return true;
}

function getRequiredMessage(field) {
  const customMessage = field.dataset.requiredMessage;

  if (customMessage) {
    return customMessage;
  }

  if (field.type === "email") {
    return "Ingresa tu correo electrónico.";
  }

  if (field.type === "password") {
    return "Ingresa tu contraseña.";
  }

  return "Completa este campo.";
}

function setFieldError(field, message) {
  field.setAttribute("aria-invalid", "true");

  const fieldContainer = document.querySelector(
    `[data-field-container="${field.id}"]`,
  );

  if (fieldContainer) {
    fieldContainer.classList.remove(
      "border-[#075eeb]",
      "focus-within:border-primary",
      "focus-within:ring-primary/15",
    );

    fieldContainer.classList.add(
      "border-error",
      "ring-4",
      "ring-error/10",
      "focus-within:border-error",
      "focus-within:ring-error/15",
    );
  }

  const fieldError = document.querySelector(
    `[data-field-error="${field.id}"]`,
  );

  if (!fieldError) {
    return;
  }

  const errorText = fieldError.querySelector("span");

  if (errorText) {
    errorText.textContent = message;
  }

  fieldError.classList.remove("hidden");
  fieldError.classList.add("flex");
}

function clearFieldError(field) {
  field.removeAttribute("aria-invalid");

  const fieldContainer = document.querySelector(
    `[data-field-container="${field.id}"]`,
  );

  if (fieldContainer) {
    fieldContainer.classList.remove(
      "border-error",
      "ring-4",
      "ring-error/10",
      "focus-within:border-error",
      "focus-within:ring-error/15",
    );

    fieldContainer.classList.add(
      "border-[#075eeb]",
      "focus-within:border-primary",
      "focus-within:ring-primary/15",
    );
  }

  const fieldError = document.querySelector(
    `[data-field-error="${field.id}"]`,
  );

  if (!fieldError) {
    return;
  }

  fieldError.classList.add("hidden");
  fieldError.classList.remove("flex");
}

function showValidationMessage(element) {
  if (!element) {
    return;
  }

  element.getAnimations().forEach((animation) => {
    animation.cancel();
  });

  element.classList.remove("hidden");

  element.animate(
    [
      {
        opacity: 0,
        transform: "translateY(-6px)",
      },
      {
        opacity: 1,
        transform: "translateY(0)",
      },
    ],
    {
      duration: 220,
      easing: "ease-out",
      fill: "forwards",
    },
  );
}

function hideValidationMessage(element) {
  if (!element) {
    return;
  }

  element.getAnimations().forEach((animation) => {
    animation.cancel();
  });

  element.classList.add("hidden");
}

function initPasswordToggle() {
  const buttons = document.querySelectorAll("[data-password-toggle]");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.passwordToggle;
      const input = document.getElementById(targetId);
      const icon = button.querySelector("[data-lucide]");

      if (!input || !icon) {
        return;
      }

      const isPassword = input.type === "password";

      input.type = isPassword ? "text" : "password";

      icon.setAttribute(
        "data-lucide",
        isPassword ? "eye-off" : "eye",
      );

      document.dispatchEvent(
        new CustomEvent("refresh-icons"),
      );
    });
  });
}

function initButtons() {
  const animatedButtons = document.querySelectorAll(
    "[data-button-animation]",
  );

  animatedButtons.forEach((button) => {
    button.addEventListener("mouseenter", () => {
      button.style.transform = "translateY(-2px)";
    });

    button.addEventListener("mouseleave", () => {
      button.style.transform = "translateY(0)";
    });
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}