import { initIcons } from "./icons.js";

import {
  evaluateLoanSimulation,
  getAvailableTermsForAmount,
} from "./simulation-engine.js";

import {
  clearAllSimulationErrors,
  clearSimulationFieldError,
  clearTermError,
  focusFirstInvalidElement,
  formatRequestedAmountInput,
  getSelectedTerm,
  getSimulationElements,
  initializeSimulationInterface,
  normalizeRequestedAmount,
  parseRequestedAmount,
  renderSimulationEvaluation,
  renderTermOptions,
  resetSimulationResult,
  setSimulationButtonLabel,
  setSimulationLoading,
  showAcceptedAlternative,
  showSimulationFieldError,
  validateSimulationForm,
} from "./simulation-ui.js";

const STORAGE_KEYS = {
  personalData: "kivo-personal-data",
  financialData: "kivo-financial-data",
  simulationData: "kivo-loan-simulation",
};

let currentEvaluation = null;
let acceptedSimulation = null;

document.addEventListener("DOMContentLoaded", () => {
  initIcons();

  initializeSimulationInterface();
  initializeSimulationForm();
  restoreSavedSimulation();
});

function initializeSimulationForm() {
  const elements = getSimulationElements();

  const backButton = document.querySelector(
    "[data-back-button]",
  );

  elements.form?.addEventListener(
    "submit",
    handleSimulationSubmit,
  );

  elements.requestedAmountInput?.addEventListener(
    "input",
    handleRequestedAmountInput,
  );

  elements.requestedAmountInput?.addEventListener(
    "blur",
    handleRequestedAmountBlur,
  );

  elements.termOptions?.addEventListener(
    "change",
    handleTermChange,
  );

  elements.paymentDaySelect?.addEventListener(
    "change",
    () => {
      clearSimulationFieldError("paymentDay");
      invalidatePreviousEvaluation();
    },
  );

  elements.acceptAlternativeButton?.addEventListener(
    "click",
    acceptAlternative,
  );

  elements.modifySimulationButton?.addEventListener(
    "click",
    modifySimulation,
  );

  elements.discardAlternativeButton?.addEventListener(
    "click",
    discardAlternative,
  );

  elements.continueButton?.addEventListener(
    "click",
    continueWithSimulation,
  );

  backButton?.addEventListener("click", () => {
    window.location.href = "/process-02/";
  });
}

function handleRequestedAmountInput(event) {
  const input = event.currentTarget;

  input.value = normalizeRequestedAmount(
    input.value,
  );

  const requestedAmount =
    parseRequestedAmount(input.value);

  const currentSelectedTerm =
    getSelectedTerm();

  const availableTerms =
    getAvailableTermsForAmount(
      requestedAmount,
    );

  const selectedTermIsStillAvailable =
    availableTerms.includes(
      currentSelectedTerm,
    );

  renderTermOptions(
    availableTerms,
    selectedTermIsStillAvailable
      ? currentSelectedTerm
      : null,
  );

  clearSimulationFieldError(
    "requestedAmount",
  );

  clearTermError();

  invalidatePreviousEvaluation();
}

function handleRequestedAmountBlur(event) {
  const input = event.currentTarget;

  const requestedAmount =
    parseRequestedAmount(input.value);

  input.value =
    formatRequestedAmountInput(
      requestedAmount,
    );
}

function handleTermChange() {
  clearTermError();
  invalidatePreviousEvaluation();
}

function handleSimulationSubmit(event) {
  event.preventDefault();

  const elements = getSimulationElements();

  const requestedAmount =
    parseRequestedAmount(
      elements.requestedAmountInput?.value ||
        "0",
    );

  const termMonths =
    getSelectedTerm();

  const paymentDay = Number(
    elements.paymentDaySelect?.value || 0,
  );

  const validation =
    validateSimulationForm({
      requestedAmount,
      termMonths,
      paymentDay,
    });

  if (!validation.valid) {
    focusFirstInvalidElement(
      validation.firstInvalidElement,
    );

    return;
  }

  const customerData =
    readCustomerData();

  if (!customerData.valid) {
    showSimulationFieldError(
      "requestedAmount",
      customerData.message,
    );

    focusFirstInvalidElement(
      elements.requestedAmountInput,
    );

    return;
  }

  setSimulationLoading(true);
  initIcons();

  window.setTimeout(() => {
    currentEvaluation =
      evaluateLoanSimulation({
        requestedAmount,
        termMonths,
        paymentDay,

        age: customerData.age,

        netMonthlyIncome:
          customerData.netMonthlyIncome,

        employmentSeniorityMonths:
          customerData.employmentSeniorityMonths,

        currentMonthlyDebtPayment:
          customerData.currentMonthlyDebtPayment,
      });

    acceptedSimulation =
      currentEvaluation.status ===
      "VIABLE"
        ? currentEvaluation.simulation
        : null;

    renderSimulationEvaluation(
      currentEvaluation,
    );

    saveSimulationData({
      evaluation: currentEvaluation,
      acceptedSimulation,
      decision:
        currentEvaluation.status ===
        "VIABLE"
          ? "DIRECT_OPTION_AVAILABLE"
          : "PENDING_CUSTOMER_DECISION",
    });

    setSimulationLoading(false);
    setSimulationButtonLabel(
      "Volver a calcular",
    );

    initIcons();

    document
      .getElementById(
        "simulationResult",
      )
      ?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
  }, 350);
}

function readCustomerData() {
  const personalData = readStorage(
    STORAGE_KEYS.personalData,
  );

  const financialData = readStorage(
    STORAGE_KEYS.financialData,
  );

  if (!financialData) {
    return {
      valid: false,
      message:
        "No encontramos tus datos financieros. Vuelve al paso anterior para completarlos.",
    };
  }

  if (
    financialData.continuity?.approved !==
    true
  ) {
    return {
      valid: false,
      message:
        "La evaluación financiera anterior no permite continuar con la simulación.",
    };
  }

  const age = resolveCustomerAge(
    personalData,
  );

  if (!age) {
    return {
      valid: false,
      message:
        "No encontramos una edad válida. Vuelve al primer paso para revisar tus datos personales.",
    };
  }

  const netMonthlyIncome = Number(
    financialData.netMonthlyIncome || 0,
  );

  const employmentSeniorityMonths =
    Number(
      financialData
        .employmentSeniorityMonths ||
        0,
    );

  const currentMonthlyDebtPayment =
    Number(
      financialData
        .totalMonthlyDebtPayment ||
        0,
    );

  if (netMonthlyIncome <= 0) {
    return {
      valid: false,
      message:
        "No encontramos un ingreso mensual válido para realizar la simulación.",
    };
  }

  return {
    valid: true,
    age,
    netMonthlyIncome,
    employmentSeniorityMonths,
    currentMonthlyDebtPayment,
    financialData,
    personalData,
  };
}

function resolveCustomerAge(personalData) {
  if (!personalData) {
    return 0;
  }

  const directAge = Number(
    personalData.age ||
      personalData.customerAge ||
      0,
  );

  if (
    Number.isInteger(directAge) &&
    directAge > 0
  ) {
    return directAge;
  }

  const birthDate =
    personalData.birthDate ||
    personalData.dateOfBirth ||
    personalData.birthdate ||
    personalData.fechaNacimiento ||
    null;

  if (!birthDate) {
    return 0;
  }

  return calculateAge(birthDate);
}

function calculateAge(birthDateValue) {
  const birthDate =
    new Date(birthDateValue);

  if (
    Number.isNaN(
      birthDate.getTime(),
    )
  ) {
    return 0;
  }

  const today = new Date();

  let age =
    today.getFullYear() -
    birthDate.getFullYear();

  const monthDifference =
    today.getMonth() -
    birthDate.getMonth();

  const birthdayHasNotOccurred =
    monthDifference < 0 ||
    (monthDifference === 0 &&
      today.getDate() <
        birthDate.getDate());

  if (birthdayHasNotOccurred) {
    age -= 1;
  }

  return age;
}

function acceptAlternative() {
  const alternative =
    currentEvaluation?.alternative;

  if (!alternative) {
    return;
  }

  acceptedSimulation = {
    ...alternative,
    acceptedAlternative: true,
    acceptedAt:
      new Date().toISOString(),
  };

  showAcceptedAlternative(
    acceptedSimulation,
  );

  saveSimulationData({
    evaluation: currentEvaluation,
    acceptedSimulation,
    decision:
      "ALTERNATIVE_ACCEPTED",
  });

  initIcons();
}

function modifySimulation() {
  acceptedSimulation = null;

  saveSimulationData({
    evaluation: currentEvaluation,
    acceptedSimulation: null,
    decision:
      "ALTERNATIVE_MODIFICATION_REQUESTED",
  });

  resetSimulationResult();

  setSimulationButtonLabel(
    "Calcular simulación",
  );

  initIcons();

  const amountInput =
    document.getElementById(
      "requestedAmount",
    );

  amountInput?.focus();

  amountInput?.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
}

function discardAlternative() {
  acceptedSimulation = null;

  saveSimulationData({
    evaluation: currentEvaluation,
    acceptedSimulation: null,
    decision:
      "ALTERNATIVE_REJECTED",
  });

  const alternativeResult =
    document.getElementById(
      "alternativeResult",
    );

  const unfavorableResult =
    document.getElementById(
      "unfavorableResult",
    );

  const unfavorableMessage =
    document.getElementById(
      "unfavorableMessage",
    );

  alternativeResult?.classList.add(
    "hidden",
  );

  unfavorableResult?.classList.remove(
    "hidden",
  );

  if (unfavorableMessage) {
    unfavorableMessage.textContent =
      "Descartaste la alternativa propuesta. Puedes modificar la simulación e intentar con otra combinación.";
  }

  initIcons();
}

function continueWithSimulation() {
  const selectedSimulation =
    acceptedSimulation ||
    currentEvaluation?.simulation;

  if (
    !selectedSimulation ||
    selectedSimulation.viable !== true
  ) {
    return;
  }

  saveSimulationData({
    evaluation: currentEvaluation,
    acceptedSimulation:
      selectedSimulation,
    decision:
      selectedSimulation
        .acceptedAlternative
        ? "ALTERNATIVE_CONFIRMED"
        : "DIRECT_OPTION_CONFIRMED",

    completionStatus:
      "006_SIMULACION_REALIZADA",
  });

  /*
   * Cuando process-04 esté creado:
   *
   * window.location.href = "/process-04/";
   */

  console.log(
    "Simulación confirmada:",
    selectedSimulation,
  );
}

function restoreSavedSimulation() {
  const savedSimulation =
    readStorage(
      STORAGE_KEYS.simulationData,
    );

  if (!savedSimulation) {
    return;
  }

  const requestedAmount =
    Number(
      savedSimulation
        .formData
        ?.requestedAmount ||
        savedSimulation
          .acceptedSimulation
          ?.requestedAmount ||
        savedSimulation
          .evaluation
          ?.simulation
          ?.requestedAmount ||
        0,
    );

  const termMonths =
    Number(
      savedSimulation
        .formData
        ?.termMonths ||
        savedSimulation
          .acceptedSimulation
          ?.termMonths ||
        savedSimulation
          .evaluation
          ?.simulation
          ?.termMonths ||
        0,
    );

  const paymentDay =
    Number(
      savedSimulation
        .formData
        ?.paymentDay ||
        savedSimulation
          .acceptedSimulation
          ?.paymentDay ||
        savedSimulation
          .evaluation
          ?.simulation
          ?.paymentDay ||
        0,
    );

  const elements = getSimulationElements();

  if (
    elements.requestedAmountInput &&
    requestedAmount
  ) {
    elements.requestedAmountInput.value =
      formatRequestedAmountInput(
        requestedAmount,
      );
  }

  const availableTerms =
    getAvailableTermsForAmount(
      requestedAmount,
    );

  renderTermOptions(
    availableTerms,
    termMonths,
  );

  if (
    elements.paymentDaySelect &&
    paymentDay
  ) {
    elements.paymentDaySelect.value =
      String(paymentDay);
  }

  if (
    savedSimulation.evaluation
  ) {
    currentEvaluation =
      savedSimulation.evaluation;

    acceptedSimulation =
      savedSimulation.acceptedSimulation ||
      null;

    renderSimulationEvaluation(
      currentEvaluation,
    );

    if (acceptedSimulation) {
      showAcceptedAlternative(
        acceptedSimulation,
      );
    }

    setSimulationButtonLabel(
      "Volver a calcular",
    );

    initIcons();
  }
}

function invalidatePreviousEvaluation() {
  currentEvaluation = null;
  acceptedSimulation = null;

  clearAllSimulationErrors();
  resetSimulationResult();

  setSimulationButtonLabel(
    "Calcular simulación",
  );

  initIcons();
}

function saveSimulationData({
  evaluation,
  acceptedSimulation:
    selectedSimulation,
  decision,
  completionStatus = null,
}) {
  const elements =
    getSimulationElements();

  const simulationData = {
    formData: {
      requestedAmount:
        parseRequestedAmount(
          elements
            .requestedAmountInput
            ?.value || "0",
        ),

      termMonths:
        getSelectedTerm(),

      paymentDay:
        Number(
          elements
            .paymentDaySelect
            ?.value || 0,
        ),
    },

    evaluation:
      evaluation || null,

    acceptedSimulation:
      selectedSimulation || null,

    customerDecision:
      decision || null,

    completionStatus,

    ruleVersion:
      evaluation?.simulation
        ?.ruleVersion ||
      evaluation?.alternative
        ?.ruleVersion ||
      null,

    updatedAt:
      new Date().toISOString(),
  };

  sessionStorage.setItem(
    STORAGE_KEYS.simulationData,
    JSON.stringify(
      simulationData,
    ),
  );

  console.log(
    "Simulación guardada:",
    simulationData,
  );
}

function readStorage(key) {
  try {
    return JSON.parse(
      sessionStorage.getItem(key) ||
        "null",
    );
  } catch (error) {
    console.error(
      `No se pudo leer ${key}:`,
      error,
    );

    return null;
  }
}