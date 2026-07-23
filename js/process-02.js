import { initIcons } from "./icons.js";

const FINANCIAL_RULES = {
  version: "financial-pre-evaluation-v1.0.0",
  maximumDebtCount: 10,
};

document.addEventListener("DOMContentLoaded", () => {
  initIcons();
  initializeFinancialForm();
  restoreSavedData();
});

function initializeFinancialForm() {
  const form = document.getElementById("financialDataForm");
  const debtCountInput = document.getElementById("debtCount");
  const backButton = document.querySelector("[data-back-button]");

  form?.addEventListener("submit", handleFormSubmit);

  backButton?.addEventListener("click", () => {
    window.location.href = "/process-01/";
  });

  const standardFields = form?.querySelectorAll(
    "input:not([type='radio'])",
  );

  standardFields?.forEach((field) => {
    field.addEventListener("input", () => {
      normalizeField(field);

      if (field.getAttribute("aria-invalid") === "true") {
        validateField(field);
      }

      hideEvaluationResult();
    });

    field.addEventListener("blur", () => {
      if (field.value.trim()) {
        validateField(field);
      }
    });
  });

  debtCountInput?.addEventListener("input", () => {
    normalizeField(debtCountInput);
    renderDebtFields();
    validateMonthlyDebtPayment();
  });

  document
    .querySelectorAll('input[name="hasNegativeReport"]')
    .forEach((radio) => {
      radio.addEventListener("change", () => {
        clearRadioError();
        hideEvaluationResult();
      });
    });
}

function normalizeField(field) {
  if (
    field.id === "employmentSeniorityMonths" ||
    field.id === "dependents" ||
    field.id === "debtCount"
  ) {
    field.value = field.value.replace(/\D/g, "");
  }

  if (
    field.id === "netMonthlyIncome" ||
    field.id === "totalMonthlyDebtPayment"
  ) {
    field.value = normalizeMoneyValue(field.value);
  }
}

function normalizeMoneyValue(value) {
  const cleanValue = value
    .replace(/[^\d.,]/g, "")
    .replace(",", ".");

  const parts = cleanValue.split(".");

  if (parts.length > 2) {
    return `${parts[0]}.${parts.slice(1).join("")}`;
  }

  return cleanValue;
}

function renderDebtFields(savedDebts = []) {
  const debtCountInput = document.getElementById("debtCount");
  const debtsSection = document.getElementById("debtsSection");
  const debtsContainer = document.getElementById("debtsContainer");
  const debtCounter = document.getElementById("debtCounter");

  if (
    !debtCountInput ||
    !debtsSection ||
    !debtsContainer ||
    !debtCounter
  ) {
    return;
  }

  let debtCount = Number(debtCountInput.value || 0);

  if (debtCount > FINANCIAL_RULES.maximumDebtCount) {
    debtCount = FINANCIAL_RULES.maximumDebtCount;
    debtCountInput.value = String(debtCount);
  }

  debtsContainer.innerHTML = "";

  if (debtCount === 0) {
    debtsSection.classList.add("hidden");
    debtCounter.textContent = "0 deudas";
    return;
  }

  debtsSection.classList.remove("hidden");

  debtCounter.textContent =
    debtCount === 1
      ? "1 deuda"
      : `${debtCount} deudas`;

  for (let index = 0; index < debtCount; index += 1) {
    const debtNumber = index + 1;
    const savedDebt = savedDebts[index] || {};

    const debtRow = document.createElement("div");

    debtRow.className =
      "grid gap-2 rounded-xl border border-[#e0e6f0] bg-white p-2.5 lg:grid-cols-[1fr_180px]";

    debtRow.innerHTML = `
      <div>
        <label
          for="debtEntity-${index}"
          class="mb-1 block text-xs font-bold text-[#0b1739]"
        >
          Entidad de la deuda ${debtNumber}
        </label>

        <div
          data-dynamic-field-container="debtEntity-${index}"
          class="rounded-lg border-2 border-[#d8deea] bg-white transition focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10"
        >
          <input
            id="debtEntity-${index}"
            name="debtEntity-${index}"
            type="text"
            autocomplete="organization"
            placeholder="Ej. Banco o cooperativa"
            value="${escapeHtml(savedDebt.entityName || "")}"
            class="h-10 w-full rounded-lg bg-transparent px-3 text-sm text-[#122044] outline-none placeholder:text-[#8a94a8]"
            data-debt-entity
            data-debt-index="${index}"
          />
        </div>

        <p
          data-dynamic-field-error="debtEntity-${index}"
          class="mt-1 hidden text-[11px] font-semibold text-error"
          role="alert"
        >
          Ingresa el nombre de la entidad.
        </p>
      </div>

      <div>
        <label
          for="debtAmount-${index}"
          class="mb-1 block text-xs font-bold text-[#0b1739]"
        >
          Monto adeudado
        </label>

        <div
          data-dynamic-field-container="debtAmount-${index}"
          class="rounded-lg border-2 border-[#d8deea] bg-white transition focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10"
        >
          <div class="flex items-center">
            <span
              class="border-r border-[#d8deea] px-3 text-xs font-bold text-[#122044]"
            >
              Bs
            </span>

            <input
              id="debtAmount-${index}"
              name="debtAmount-${index}"
              type="text"
              inputmode="decimal"
              autocomplete="off"
              placeholder="Ej. 10.000"
              value="${escapeHtml(String(savedDebt.amountOwed || ""))}"
              class="h-10 min-w-0 flex-1 rounded-r-lg bg-transparent px-3 text-sm text-[#122044] outline-none placeholder:text-[#8a94a8]"
              data-debt-amount
              data-debt-index="${index}"
            />
          </div>
        </div>

        <p
          data-dynamic-field-error="debtAmount-${index}"
          class="mt-1 hidden text-[11px] font-semibold text-error"
          role="alert"
        >
          Ingresa un monto mayor a cero.
        </p>
      </div>
    `;

    debtsContainer.appendChild(debtRow);
  }

  initializeDynamicDebtFields();
}

function initializeDynamicDebtFields() {
  document
    .querySelectorAll("[data-debt-entity]")
    .forEach((field) => {
      field.addEventListener("input", () => {
        clearDynamicFieldError(field);
        hideEvaluationResult();
      });
    });

  document
    .querySelectorAll("[data-debt-amount]")
    .forEach((field) => {
      field.addEventListener("input", () => {
        field.value = normalizeMoneyValue(field.value);
        clearDynamicFieldError(field);
        hideEvaluationResult();
      });
    });
}

function handleFormSubmit(event) {
  event.preventDefault();

  const fields = [
    document.getElementById("netMonthlyIncome"),
    document.getElementById("employmentSeniorityMonths"),
    document.getElementById("dependents"),
    document.getElementById("debtCount"),
    document.getElementById("totalMonthlyDebtPayment"),
  ].filter(Boolean);

  let firstInvalidElement = null;
  let isValid = true;

  fields.forEach((field) => {
    const fieldIsValid = validateField(field);

    if (!fieldIsValid) {
      isValid = false;

      if (!firstInvalidElement) {
        firstInvalidElement = field;
      }
    }
  });

  const debtsAreValid = validateDebtDetails();

  if (!debtsAreValid.valid) {
    isValid = false;

    if (!firstInvalidElement) {
      firstInvalidElement = debtsAreValid.firstInvalidElement;
    }
  }

  const declarationIsValid = validateCreditDeclaration();

  if (!declarationIsValid) {
    isValid = false;

    if (!firstInvalidElement) {
      firstInvalidElement = document.querySelector(
        'input[name="hasNegativeReport"]',
      );
    }
  }

  if (!isValid) {
    focusInvalidElement(firstInvalidElement);
    return;
  }

  evaluateCreditDeclaration();
}

function validateField(field) {
  const value = field.value.trim();
  const numericValue = parseMoney(value);

  if (!value) {
    showFieldError(
      field,
      field.dataset.requiredMessage || "Completa este campo.",
    );

    return false;
  }

  if (field.id === "netMonthlyIncome") {
    if (numericValue <= 0) {
      showFieldError(
        field,
        "El ingreso mensual debe ser mayor a cero.",
      );

      return false;
    }
  }

  if (field.id === "employmentSeniorityMonths") {
    const months = Number(value);

    if (!Number.isInteger(months) || months < 0) {
      showFieldError(
        field,
        "Ingresa una antigüedad válida en meses.",
      );

      return false;
    }
  }

  if (field.id === "dependents") {
    const dependents = Number(value);

    if (!Number.isInteger(dependents) || dependents < 0) {
      showFieldError(
        field,
        "Ingresa un número de dependientes válido.",
      );

      return false;
    }
  }

  if (field.id === "debtCount") {
    const debtCount = Number(value);

    if (
      !Number.isInteger(debtCount) ||
      debtCount < 0 ||
      debtCount > FINANCIAL_RULES.maximumDebtCount
    ) {
      showFieldError(
        field,
        `Puedes registrar entre 0 y ${FINANCIAL_RULES.maximumDebtCount} deudas.`,
      );

      return false;
    }
  }

  if (field.id === "totalMonthlyDebtPayment") {
    const debtCount = Number(
      document.getElementById("debtCount")?.value || 0,
    );

    if (debtCount === 0 && numericValue !== 0) {
      showFieldError(
        field,
        "Si no tienes deudas, la cuota mensual debe ser 0.",
      );

      return false;
    }

    if (debtCount > 0 && numericValue <= 0) {
      showFieldError(
        field,
        "Ingresa una cuota mensual mayor a cero.",
      );

      return false;
    }
  }

  clearFieldError(field);
  return true;
}

function validateMonthlyDebtPayment() {
  const debtCount = Number(
    document.getElementById("debtCount")?.value || 0,
  );

  const paymentInput = document.getElementById(
    "totalMonthlyDebtPayment",
  );

  if (!paymentInput) {
    return;
  }

  if (debtCount === 0) {
    paymentInput.value = "0";
  } else if (paymentInput.value === "0") {
    paymentInput.value = "";
  }

  if (
    paymentInput.getAttribute("aria-invalid") === "true"
  ) {
    validateField(paymentInput);
  }
}

function validateDebtDetails() {
  const debtCount = Number(
    document.getElementById("debtCount")?.value || 0,
  );

  if (debtCount === 0) {
    return {
      valid: true,
      firstInvalidElement: null,
    };
  }

  const entityFields = Array.from(
    document.querySelectorAll("[data-debt-entity]"),
  );

  const amountFields = Array.from(
    document.querySelectorAll("[data-debt-amount]"),
  );

  let isValid = true;
  let firstInvalidElement = null;

  entityFields.forEach((field) => {
    if (!field.value.trim()) {
      showDynamicFieldError(
        field,
        "Ingresa el nombre de la entidad.",
      );

      isValid = false;
      firstInvalidElement ||= field;
    } else {
      clearDynamicFieldError(field);
    }
  });

  amountFields.forEach((field) => {
    if (parseMoney(field.value) <= 0) {
      showDynamicFieldError(
        field,
        "Ingresa un monto mayor a cero.",
      );

      isValid = false;
      firstInvalidElement ||= field;
    } else {
      clearDynamicFieldError(field);
    }
  });

  return {
    valid: isValid,
    firstInvalidElement,
  };
}

function validateCreditDeclaration() {
  const selectedDeclaration = document.querySelector(
    'input[name="hasNegativeReport"]:checked',
  );

  if (!selectedDeclaration) {
    showRadioError();
    return false;
  }

  clearRadioError();
  return true;
}

function evaluateCreditDeclaration() {
  const selectedDeclaration = document.querySelector(
    'input[name="hasNegativeReport"]:checked',
  );

  const hasNegativeReport =
    selectedDeclaration?.value === "true";

  if (hasNegativeReport) {
    showEvaluationResult({
      approved: false,
      title: "Por ahora no podemos continuar",
      message:
        "Según la información que declaraste, actualmente tienes un reporte negativo en la central de riesgos. Esta respuesta es una declaración personal y todavía no ha sido verificada.",
      reason: "NEGATIVE_CREDIT_REPORT_SELF_DECLARED",
    });

    return;
  }

  showEvaluationResult({
    approved: true,
    title: "¡Puedes continuar!",
    message:
      "Tu declaración crediticia inicial permite continuar con la evaluación de tu solicitud.",
    reason: "NO_NEGATIVE_CREDIT_REPORT_SELF_DECLARED",
  });
}

function showEvaluationResult({
  approved,
  title,
  message,
  reason,
}) {
  const result = document.querySelector(
    "[data-evaluation-result]",
  );

  const resultIcon = document.querySelector(
    "[data-result-icon]",
  );

  const resultLucide = document.querySelector(
    "[data-result-lucide]",
  );

  const resultEyebrow = document.querySelector(
    "[data-result-eyebrow]",
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

    resultEyebrow?.classList.add("text-success");

    resultLucide?.setAttribute(
      "data-lucide",
      "circle-check-big",
    );

    if (submitLabel) {
      submitLabel.textContent =
        "Continuar con mi solicitud";
    }

    submitButton?.setAttribute("type", "button");

    submitButton?.removeEventListener(
      "click",
      continueToNextProcess,
    );

    submitButton?.addEventListener(
      "click",
      continueToNextProcess,
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

    resultEyebrow?.classList.add("text-error");

    resultLucide?.setAttribute(
      "data-lucide",
      "circle-x",
    );

    if (submitLabel) {
      submitLabel.textContent =
        "Solicitud finalizada";
    }

    submitButton?.setAttribute("type", "button");
    submitButton?.setAttribute("disabled", "true");
  }

  saveFinancialData({
    approved,
    reason,
  });

  initIcons();
}

function hideEvaluationResult() {
  const result = document.querySelector(
    "[data-evaluation-result]",
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
    submitLabel.textContent =
      "Evaluar y continuar";
  }
}

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
    const text = error.querySelector("span");

    if (text) {
      text.textContent = message;
    }

    error.classList.remove("hidden");
    error.classList.add("flex");
  }
}

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

function showDynamicFieldError(field, message) {
  field.setAttribute("aria-invalid", "true");

  const container = document.querySelector(
    `[data-dynamic-field-container="${field.id}"]`,
  );

  const error = document.querySelector(
    `[data-dynamic-field-error="${field.id}"]`,
  );

  container?.classList.remove(
    "border-[#d8deea]",
    "focus-within:border-primary",
    "focus-within:ring-primary/10",
  );

  container?.classList.add(
    "border-error",
    "ring-4",
    "ring-error/10",
  );

  if (error) {
    error.textContent = message;
    error.classList.remove("hidden");
  }
}

function clearDynamicFieldError(field) {
  field.removeAttribute("aria-invalid");

  const container = document.querySelector(
    `[data-dynamic-field-container="${field.id}"]`,
  );

  const error = document.querySelector(
    `[data-dynamic-field-error="${field.id}"]`,
  );

  container?.classList.remove(
    "border-error",
    "ring-4",
    "ring-error/10",
  );

  container?.classList.add(
    "border-[#d8deea]",
    "focus-within:border-primary",
    "focus-within:ring-primary/10",
  );

  error?.classList.add("hidden");
}

function showRadioError() {
  const fieldset = document.querySelector(
    '[data-field-container="hasNegativeReport"]',
  );

  const error = document.querySelector(
    '[data-field-error="hasNegativeReport"]',
  );

  fieldset?.classList.remove("border-[#dce5f2]");
  fieldset?.classList.add(
    "border-error",
    "ring-4",
    "ring-error/10",
  );

  error?.classList.remove("hidden");
  error?.classList.add("flex");
}

function clearRadioError() {
  const fieldset = document.querySelector(
    '[data-field-container="hasNegativeReport"]',
  );

  const error = document.querySelector(
    '[data-field-error="hasNegativeReport"]',
  );

  fieldset?.classList.remove(
    "border-error",
    "ring-4",
    "ring-error/10",
  );

  fieldset?.classList.add("border-[#dce5f2]");

  error?.classList.add("hidden");
  error?.classList.remove("flex");
}

function focusInvalidElement(element) {
  if (!element) {
    return;
  }

  element.focus({
    preventScroll: true,
  });

  const target =
    element.type === "radio"
      ? document.querySelector(
          '[data-field-container="hasNegativeReport"]',
        )
      : element.closest(
          "[data-field-container], [data-dynamic-field-container]",
        );

  target?.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });

  target?.animate(
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

function saveFinancialData({
  approved,
  reason,
}) {
  const selectedDeclaration = document.querySelector(
    'input[name="hasNegativeReport"]:checked',
  );

  const debts = Array.from(
    document.querySelectorAll("[data-debt-entity]"),
  ).map((entityField) => {
    const index = entityField.dataset.debtIndex;

    const amountField = document.querySelector(
      `[data-debt-amount][data-debt-index="${index}"]`,
    );

    return {
      entityName: entityField.value.trim(),
      amountOwed: parseMoney(amountField?.value || "0"),
    };
  });

  const financialData = {
    netMonthlyIncome: parseMoney(
      document.getElementById("netMonthlyIncome")?.value || "0",
    ),

    employmentSeniorityMonths: Number(
      document.getElementById("employmentSeniorityMonths")?.value || 0,
    ),

    dependents: Number(
      document.getElementById("dependents")?.value || 0,
    ),

    debtCount: Number(
      document.getElementById("debtCount")?.value || 0,
    ),

    totalMonthlyDebtPayment: parseMoney(
      document.getElementById("totalMonthlyDebtPayment")?.value || "0",
    ),

    debts,

    creditRiskDeclaration: {
      hasNegativeReport:
        selectedDeclaration?.value === "true",

      source: "SELF_DECLARED",

      verified: false,

      declaredAt: new Date().toISOString(),
    },

    continuity: {
      approved,
      reason,
      ruleVersion: FINANCIAL_RULES.version,
      evaluatedAt: new Date().toISOString(),
    },
  };

  sessionStorage.setItem(
    "kivo-financial-data",
    JSON.stringify(financialData),
  );

  console.log(
    "Información financiera:",
    financialData,
  );
}

function restoreSavedData() {
  const savedData = JSON.parse(
    sessionStorage.getItem("kivo-financial-data") || "null",
  );

  if (!savedData) {
    return;
  }

  setFieldValue(
    "netMonthlyIncome",
    savedData.netMonthlyIncome,
  );

  setFieldValue(
    "employmentSeniorityMonths",
    savedData.employmentSeniorityMonths,
  );

  setFieldValue(
    "dependents",
    savedData.dependents,
  );

  setFieldValue(
    "debtCount",
    savedData.debtCount,
  );

  setFieldValue(
    "totalMonthlyDebtPayment",
    savedData.totalMonthlyDebtPayment,
  );

  renderDebtFields(savedData.debts || []);

  const declarationValue = String(
    savedData.creditRiskDeclaration?.hasNegativeReport,
  );

  const declarationRadio = document.querySelector(
    `input[name="hasNegativeReport"][value="${declarationValue}"]`,
  );

  if (declarationRadio) {
    declarationRadio.checked = true;
  }
}

function setFieldValue(fieldId, value) {
  const field = document.getElementById(fieldId);

  if (
    field &&
    value !== undefined &&
    value !== null
  ) {
    field.value = String(value);
  }
}

function parseMoney(value) {
  const normalizedValue = String(value)
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");

  const number = Number(normalizedValue);

  return Number.isFinite(number)
    ? number
    : 0;
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function continueToNextProcess() {
  window.location.href = "/process-03/";
}