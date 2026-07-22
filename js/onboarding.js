import { pulse, shake, showMessage, hideMessage } from "./animations.js";

export function initOnboarding() {
  initPasswordToggle();
  initFormValidation();
  initButtons();
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
      icon.setAttribute("data-lucide", isPassword ? "eye-off" : "eye");

      document.dispatchEvent(new CustomEvent("refresh-icons"));
    });
  });
}

function initFormValidation() {
  const form = document.querySelector("[data-onboarding-form]");

  if (!form) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const emailInput = form.querySelector('input[type="email"]');
    const passwordInput = form.querySelector('input[type="password"]');
    const errorMessage = form.querySelector("[data-error-message]");
    const successMessage = form.querySelector("[data-success-message]");

    hideMessage(errorMessage);
    hideMessage(successMessage);

    const email = emailInput?.value.trim() || "";
    const password = passwordInput?.value.trim() || "";

    if (!isValidEmail(email)) {
      showMessage(errorMessage);
      shake(emailInput);
      emailInput?.focus();
      return;
    }

    if (password.length < 8) {
      if (errorMessage) {
        const text = errorMessage.querySelector("[data-message-text]");

        if (text) {
          text.textContent = "La contraseña debe tener al menos 8 caracteres.";
        }
      }

      showMessage(errorMessage);
      shake(passwordInput);
      passwordInput?.focus();
      return;
    }

    showMessage(successMessage);

    const submitButton = form.querySelector('button[type="submit"]');
    pulse(submitButton);
  });
}

function initButtons() {
  const animatedButtons = document.querySelectorAll("[data-button-animation]");

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
