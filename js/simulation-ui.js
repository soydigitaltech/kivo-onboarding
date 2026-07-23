import {
  formatMoney,
  formatPercentage,
} from "./simulation-engine.js";

import {
  LOAN_RULES,
  SIMULATION_STATUS,
} from "./simulation-config.js";

/**
 * Recupera todos los elementos de la interfaz de simulación.
 *
 * Los identificadores deben existir exactamente igual
 * en process-03/index.html.
 */
export function getSimulationElements() {
  return {
    form: document.getElementById(
      "loanSimulationForm",
    ),

    requestedAmountInput:
      document.getElementById(
        "requestedAmount",
      ),

    termOptions:
      document.getElementById(
        "termOptions",
      ),

    paymentDaySelect:
      document.getElementById(
        "paymentDay",
      ),

    visibleInterestRate:
      document.getElementById(
        "visibleInterestRate",
      ),

    emptyState:
      document.getElementById(
        "simulationEmptyState",
      ),

    result:
      document.getElementById(
        "simulationResult",
      ),

    monthlyPaymentResult:
      document.getElementById(
        "monthlyPaymentResult",
      ),

    selectedTermResult:
      document.getElementById(
        "selectedTermResult",
      ),

    requestedAmountResult:
      document.getElementById(
        "requestedAmountResult",
      ),

    totalDebtResult:
      document.getElementById(
        "totalDebtResult",
      ),

    debtToIncomeResult:
      document.getElementById(
        "debtToIncomeResult",
      ),

    residualCapacityResult:
      document.getElementById(
        "residualCapacityResult",
      ),

    viableResult:
      document.getElementById(
        "viableResult",
      ),

    alternativeResult:
      document.getElementById(
        "alternativeResult",
      ),

    unfavorableResult:
      document.getElementById(
        "unfavorableResult",
      ),

    unfavorableMessage:
      document.getElementById(
        "unfavorableMessage",
      ),

    alternativeAmount:
      document.getElementById(
        "alternativeAmount",
      ),

    alternativeTerm:
      document.getElementById(
        "alternativeTerm",
      ),

    alternativePayment:
      document.getElementById(
        "alternativePayment",
      ),

    acceptAlternativeButton:
      document.getElementById(
        "acceptAlternativeButton",
      ),

    modifySimulationButton:
      document.getElementById(
        "modifySimulationButton",
      ),

    discardAlternativeButton:
      document.getElementById(
        "discardAlternativeButton",
      ),

    continueButton:
      document.getElementById(
        "continueButton",
      ),

    simulateButton:
      document.querySelector(
        "[data-simulate-button]",
      ),
  };
}

/**
 * Inicializa los textos y estados básicos de la interfaz.
 */
export function initializeSimulationInterface() {
  const elements = getSimulationElements();

  if (elements.visibleInterestRate) {
    elements.visibleInterestRate.textContent =
      `${formatSimpleNumber(
        LOAN_RULES.annualInterestRate,
      )}% anual`;
  }

  populatePaymentDayOptions();

  renderTermOptions([]);

  resetSimulationResult();

  return elements;
}

/**
 * Llena el selector de días de pago usando la configuración.
 */
export function populatePaymentDayOptions(
  selectedDay = null,
) {
  const select =
    document.getElementById("paymentDay");

  if (!select) {
    return;
  }

  const currentValue =
    selectedDay ??
    Number(select.value || 0);

  select.innerHTML = `
    <option value="">
      Selecciona un día
    </option>
  `;

  LOAN_RULES.paymentDays.forEach((day) => {
    const option =
      document.createElement("option");

    option.value = String(day);
    option.textContent = `Día ${day}`;

    if (Number(currentValue) === day) {
      option.selected = true;
    }

    select.appendChild(option);
  });
}

/**
 * Conserva solamente números en el campo de monto.
 */
export function normalizeRequestedAmount(value) {
  return String(value)
    .replace(/\D/g, "")
    .slice(0, 9);
}

/**
 * Convierte el valor visible del campo a número.
 *
 * Ejemplos:
 * 7.000    -> 7000
 * 25.500   -> 25500
 * Bs 8.000 -> 8000
 */
export function parseRequestedAmount(value) {
  const normalizedValue = String(value)
    .trim()
    .replace(/\s/g, "")
    .replace(/Bs/gi, "")
    .replace(/\./g, "")
    .replace(/,/g, ".")
    .replace(/[^\d.]/g, "");

  const amount = Number(normalizedValue);

  return Number.isFinite(amount)
    ? amount
    : 0;
}

/**
 * Formatea el monto para mostrarlo dentro del input.
 */
export function formatRequestedAmountInput(value) {
  const amount =
    typeof value === "number"
      ? value
      : parseRequestedAmount(value);

  if (!amount) {
    return "";
  }

  return new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Dibuja los botones de plazo.
 */
export function renderTermOptions(
  terms,
  selectedTerm = null,
) {
  const container =
    document.getElementById("termOptions");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  if (
    !Array.isArray(terms) ||
    terms.length === 0
  ) {
    const emptyMessage =
      document.createElement("div");

    emptyMessage.className =
      "col-span-full rounded-xl border border-dashed border-[#cfd8e6] bg-[#f8faff] px-4 py-3 text-center text-xs leading-5 text-[#66728a]";

    emptyMessage.textContent =
      "Ingresa un monto desde Bs 7.000 para conocer los plazos disponibles.";

    container.appendChild(emptyMessage);

    return;
  }

  terms.forEach((term) => {
    const label =
      document.createElement("label");

    label.className =
      "flex min-h-[46px] cursor-pointer items-center justify-center rounded-xl border-2 border-[#d8deea] bg-white px-2 text-sm font-bold text-[#122044] transition hover:border-primary hover:bg-[#f4f8ff] has-[:checked]:border-primary has-[:checked]:bg-[#eaf3ff] has-[:checked]:text-[#075eeb] has-[:checked]:ring-4 has-[:checked]:ring-primary/10";

    const input =
      document.createElement("input");

    input.type = "radio";
    input.name = "termMonths";
    input.value = String(term);
    input.className = "sr-only";

    input.setAttribute(
      "aria-label",
      `${term} meses`,
    );

    if (
      Number(selectedTerm) ===
      Number(term)
    ) {
      input.checked = true;
    }

    const text =
      document.createElement("span");

    text.textContent = `${term} meses`;

    label.appendChild(input);
    label.appendChild(text);

    container.appendChild(label);
  });
}

/**
 * Recupera el plazo seleccionado.
 */
export function getSelectedTerm() {
  const selectedTerm =
    document.querySelector(
      'input[name="termMonths"]:checked',
    );

  return selectedTerm
    ? Number(selectedTerm.value)
    : 0;
}

/**
 * Muestra el error correspondiente a un campo.
 */
export function showSimulationFieldError(
  fieldName,
  message,
) {
  const field = getFieldByName(fieldName);

  const container = document.querySelector(
    `[data-field-container="${fieldName}"]`,
  );

  const error = document.querySelector(
    `[data-field-error="${fieldName}"]`,
  );

  field?.setAttribute(
    "aria-invalid",
    "true",
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
      error.querySelector("span");

    if (errorText) {
      errorText.textContent = message;
    } else {
      error.textContent = message;
    }

    error.classList.remove("hidden");
    error.classList.add("flex");
  }

  animateFieldError(
    container || error || field,
  );
}

/**
 * Elimina el error de un campo.
 */
export function clearSimulationFieldError(
  fieldName,
) {
  const field = getFieldByName(fieldName);

  const container = document.querySelector(
    `[data-field-container="${fieldName}"]`,
  );

  const error = document.querySelector(
    `[data-field-error="${fieldName}"]`,
  );

  field?.removeAttribute("aria-invalid");

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
 * Muestra el error del grupo de plazos.
 */
export function showTermError(message) {
  const container =
    document.querySelector(
      '[data-field-container="termMonths"]',
    ) ||
    document.getElementById(
      "termOptions",
    );

  const error =
    document.querySelector(
      '[data-field-error="termMonths"]',
    );

  container?.classList.add(
    "rounded-xl",
    "ring-4",
    "ring-error/10",
  );

  if (error) {
    const errorText =
      error.querySelector("span");

    if (errorText) {
      errorText.textContent = message;
    } else {
      error.textContent = message;
    }

    error.classList.remove("hidden");
    error.classList.add("flex");
  }

  animateFieldError(container);
}

/**
 * Elimina el error del grupo de plazos.
 */
export function clearTermError() {
  const container =
    document.querySelector(
      '[data-field-container="termMonths"]',
    ) ||
    document.getElementById(
      "termOptions",
    );

  const error =
    document.querySelector(
      '[data-field-error="termMonths"]',
    );

  container?.classList.remove(
    "ring-4",
    "ring-error/10",
  );

  error?.classList.add("hidden");
  error?.classList.remove("flex");
}

/**
 * Valida los campos principales antes de ejecutar
 * el motor financiero.
 */
export function validateSimulationForm({
  requestedAmount,
  termMonths,
  paymentDay,
}) {
  let valid = true;
  let firstInvalidElement = null;

  if (
    requestedAmount <
    LOAN_RULES.minimumAmount
  ) {
    showSimulationFieldError(
      "requestedAmount",
      `El monto mínimo disponible es ${formatMoney(
        LOAN_RULES.minimumAmount,
      )}.`,
    );

    valid = false;

    firstInvalidElement ||=
      document.getElementById(
        "requestedAmount",
      );
  } else {
    clearSimulationFieldError(
      "requestedAmount",
    );
  }

  if (!termMonths) {
    showTermError(
      "Selecciona un plazo para continuar.",
    );

    valid = false;

    firstInvalidElement ||=
      document.querySelector(
        'input[name="termMonths"]',
      ) ||
      document.getElementById(
        "termOptions",
      );
  } else {
    clearTermError();
  }

  if (
    !LOAN_RULES.paymentDays.includes(
      Number(paymentDay),
    )
  ) {
    showSimulationFieldError(
      "paymentDay",
      "Selecciona el día en que prefieres pagar.",
    );

    valid = false;

    firstInvalidElement ||=
      document.getElementById(
        "paymentDay",
      );
  } else {
    clearSimulationFieldError(
      "paymentDay",
    );
  }

  return {
    valid,
    firstInvalidElement,
  };
}

/**
 * Lleva el foco al primer campo inválido.
 */
export function focusFirstInvalidElement(
  element,
) {
  if (!element) {
    return;
  }

  if (typeof element.focus === "function") {
    element.focus({
      preventScroll: true,
    });
  }

  const target =
    element.closest?.(
      "[data-field-container]",
    ) ||
    document.getElementById(
      "termOptions",
    ) ||
    element;

  target?.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
}

/**
 * Muestra el resultado completo de la evaluación.
 */
export function renderSimulationEvaluation(
  evaluation,
) {
  resetSimulationResult({
    preserveMetrics: true,
  });

  const primarySimulation =
    evaluation?.simulation;

  if (!primarySimulation) {
    showUnfavorableResult(
      "No fue posible calcular la simulación.",
    );

    return;
  }

  showMetrics(primarySimulation);

  switch (evaluation.status) {
    case SIMULATION_STATUS.VIABLE:
      showViableResult();
      break;

    case SIMULATION_STATUS.ALTERNATIVE_AVAILABLE:
      showAlternativeResult(
        evaluation.alternative,
      );
      break;

    case SIMULATION_STATUS.BUSINESS_RULE_REJECTED:
    case SIMULATION_STATUS.PAYMENT_CAPACITY_REJECTED:
    case SIMULATION_STATUS.NO_ALTERNATIVE_AVAILABLE:
    case SIMULATION_STATUS.INVALID_DATA:
    default:
      showUnfavorableResult(
        primarySimulation.message ||
          "Por ahora no podemos continuar con esta opción.",
      );
      break;
  }
}

/**
 * Actualiza las métricas visibles.
 */
export function showMetrics(simulation) {
  const elements =
    getSimulationElements();

  elements.emptyState?.classList.add(
    "hidden",
  );

  elements.result?.classList.remove(
    "hidden",
  );

  if (
    elements.monthlyPaymentResult
  ) {
    elements.monthlyPaymentResult.textContent =
      formatMoney(
        simulation.monthlyPayment || 0,
      );
  }

  if (
    elements.selectedTermResult
  ) {
    elements.selectedTermResult.textContent =
      `Durante ${
        simulation.termMonths || 0
      } meses`;
  }

  if (
    elements.requestedAmountResult
  ) {
    elements.requestedAmountResult.textContent =
      formatMoney(
        simulation.requestedAmount || 0,
      );
  }

  if (
    elements.totalDebtResult
  ) {
    elements.totalDebtResult.textContent =
      formatMoney(
        simulation.totalDebt || 0,
      );
  }

  if (
    elements.debtToIncomeResult
  ) {
    elements.debtToIncomeResult.textContent =
      formatPercentage(
        simulation.debtToIncomeRatio ||
          0,
      );
  }

  if (
    elements.residualCapacityResult
  ) {
    elements.residualCapacityResult.textContent =
      formatMoney(
        simulation.residualCapacity || 0,
      );
  }
}

/**
 * Muestra el bloque de simulación viable.
 */
export function showViableResult() {
  const elements =
    getSimulationElements();

  hideDecisionBlocks();

  elements.viableResult?.classList.remove(
    "hidden",
  );

  elements.continueButton?.classList.remove(
    "hidden",
  );

  elements.continueButton?.classList.add(
    "flex",
  );
}

/**
 * Muestra la propuesta alternativa.
 */
export function showAlternativeResult(
  alternative,
) {
  const elements =
    getSimulationElements();

  hideDecisionBlocks();

  if (!alternative) {
    showUnfavorableResult(
      "No encontramos una alternativa disponible.",
    );

    return;
  }

  elements.alternativeResult?.classList.remove(
    "hidden",
  );

  if (elements.alternativeAmount) {
    elements.alternativeAmount.textContent =
      formatMoney(
        alternative.requestedAmount ||
          0,
      );
  }

  if (elements.alternativeTerm) {
    elements.alternativeTerm.textContent =
      `${
        alternative.termMonths || 0
      } meses`;
  }

  if (
    elements.alternativePayment
  ) {
    elements.alternativePayment.textContent =
      formatMoney(
        alternative.monthlyPayment ||
          0,
      );
  }
}

/**
 * Actualiza el resultado cuando el usuario acepta
 * la alternativa sugerida.
 */
export function showAcceptedAlternative(
  alternative,
) {
  if (!alternative) {
    return;
  }

  showMetrics(alternative);
  showViableResult();

  const viableTitle =
    document.querySelector(
      "#viableResult h4",
    );

  const viableMessage =
    document.querySelector(
      "#viableResult p",
    );

  if (viableTitle) {
    viableTitle.textContent =
      "Alternativa seleccionada";
  }

  if (viableMessage) {
    viableMessage.textContent =
      "Actualizamos tu simulación con la alternativa que seleccionaste.";
  }
}

/**
 * Muestra el resultado desfavorable.
 */
export function showUnfavorableResult(
  message,
) {
  const elements =
    getSimulationElements();

  hideDecisionBlocks();

  elements.unfavorableResult?.classList.remove(
    "hidden",
  );

  if (
    elements.unfavorableMessage
  ) {
    elements.unfavorableMessage.textContent =
      message ||
      "En este momento no encontramos una opción compatible con tu capacidad preliminar de pago.";
  }
}

/**
 * Restablece la zona de resultados.
 */
export function resetSimulationResult({
  preserveMetrics = false,
} = {}) {
  const elements =
    getSimulationElements();

  hideDecisionBlocks();

  if (!preserveMetrics) {
    elements.result?.classList.add(
      "hidden",
    );

    elements.emptyState?.classList.remove(
      "hidden",
    );
  }

  resetViableContent();
}

/**
 * Cambia el botón de simulación al estado de carga.
 */
export function setSimulationLoading(
  isLoading,
) {
  const button =
    document.querySelector(
      "[data-simulate-button]",
    );

  if (!button) {
    return;
  }

  button.disabled = isLoading;

  button.classList.toggle(
    "cursor-not-allowed",
    isLoading,
  );

  button.classList.toggle(
    "opacity-70",
    isLoading,
  );

  if (isLoading) {
    button.innerHTML = `
      <span
        class="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
        aria-hidden="true"
      ></span>

      <span class="ml-3">
        Calculando...
      </span>
    `;

    return;
  }

  button.innerHTML = `
    <span>
      Calcular simulación
    </span>

    <i
      data-lucide="calculator"
      class="ml-3 h-5 w-5"
    ></i>
  `;
}

/**
 * Oculta los bloques de decisión.
 */
export function hideDecisionBlocks() {
  const elements =
    getSimulationElements();

  elements.viableResult?.classList.add(
    "hidden",
  );

  elements.alternativeResult?.classList.add(
    "hidden",
  );

  elements.unfavorableResult?.classList.add(
    "hidden",
  );

  elements.continueButton?.classList.add(
    "hidden",
  );

  elements.continueButton?.classList.remove(
    "flex",
  );
}

/**
 * Cambia el texto del botón para volver a simular.
 */
export function setSimulationButtonLabel(
  label,
) {
  const button =
    document.querySelector(
      "[data-simulate-button]",
    );

  if (!button) {
    return;
  }

  button.innerHTML = `
    <span>
      ${escapeHtml(
        label ||
          "Calcular simulación",
      )}
    </span>

    <i
      data-lucide="calculator"
      class="ml-3 h-5 w-5"
    ></i>
  `;
}

/**
 * Limpia todos los errores del formulario.
 */
export function clearAllSimulationErrors() {
  clearSimulationFieldError(
    "requestedAmount",
  );

  clearSimulationFieldError(
    "paymentDay",
  );

  clearTermError();
}

function resetViableContent() {
  const viableTitle =
    document.querySelector(
      "#viableResult h4",
    );

  const viableMessage =
    document.querySelector(
      "#viableResult p",
    );

  if (viableTitle) {
    viableTitle.textContent =
      "Esta opción es compatible contigo";
  }

  if (viableMessage) {
    viableMessage.textContent =
      "La cuota estimada se encuentra dentro de tu capacidad preliminar de pago.";
  }
}

function getFieldByName(fieldName) {
  if (fieldName === "termMonths") {
    return document.querySelector(
      'input[name="termMonths"]',
    );
  }

  return document.getElementById(
    fieldName,
  );
}

function animateFieldError(element) {
  element?.animate(
    [
      {
        transform:
          "translateX(0)",
      },

      {
        transform:
          "translateX(-6px)",
      },

      {
        transform:
          "translateX(6px)",
      },

      {
        transform:
          "translateX(-4px)",
      },

      {
        transform:
          "translateX(4px)",
      },

      {
        transform:
          "translateX(0)",
      },
    ],
    {
      duration: 320,
      easing: "ease-out",
    },
  );
}

function formatSimpleNumber(value) {
  return new Intl.NumberFormat(
    "es-BO",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
  ).format(Number(value) || 0);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}