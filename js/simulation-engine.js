import {
  LOAN_RULES,
  SIMULATION_REASONS,
  SIMULATION_STATUS,
} from "./simulation-config.js";

/**
 * Obtiene la regla correspondiente al monto y edad.
 */
export function getLoanRule({
  requestedAmount,
  age,
}) {
  const amount = toFiniteNumber(requestedAmount);
  const customerAge = toFiniteNumber(age);

  return (
    LOAN_RULES.ranges.find((range) => {
      const amountIsAllowed =
        amount >= range.minimumAmount &&
        amount <= range.maximumAmount;

      const ageIsAllowed =
        customerAge >= range.minimumAge &&
        customerAge <= range.maximumAge;

      return amountIsAllowed && ageIsAllowed;
    }) || null
  );
}

/**
 * Devuelve todos los plazos disponibles para un monto,
 * sin evaluar todavía antigüedad laboral.
 *
 * Esto permite dibujar los botones de plazo apenas
 * el usuario escribe el monto.
 */
export function getAvailableTermsForAmount(
  requestedAmount,
) {
  const amount = toFiniteNumber(requestedAmount);

  if (amount < LOAN_RULES.minimumAmount) {
    return [];
  }

  const amountRange = LOAN_RULES.ranges.find(
    (range) =>
      amount >= range.minimumAmount &&
      amount <= range.maximumAmount,
  );

  return amountRange
    ? [...amountRange.availableTerms]
    : [];
}

/**
 * Calcula la cuota usando el sistema francés.
 *
 * Fórmula:
 * cuota = capital × [i(1+i)^n] / [(1+i)^n - 1]
 */
export function calculateMonthlyPayment({
  principal,
  annualInterestRate,
  termMonths,
}) {
  const capital = toFiniteNumber(principal);
  const annualRate = toFiniteNumber(
    annualInterestRate,
  );
  const months = Math.trunc(
    toFiniteNumber(termMonths),
  );

  if (capital <= 0 || months <= 0) {
    return 0;
  }

  const monthlyRate = annualRate / 100 / 12;

  if (monthlyRate === 0) {
    return roundMoney(capital / months);
  }

  const compoundedRate = Math.pow(
    1 + monthlyRate,
    months,
  );

  const payment =
    capital *
    ((monthlyRate * compoundedRate) /
      (compoundedRate - 1));

  return roundMoney(payment);
}

/**
 * Calcula la deuda total generada por el préstamo.
 */
export function calculateTotalDebt({
  monthlyPayment,
  termMonths,
}) {
  const payment = toFiniteNumber(monthlyPayment);
  const months = Math.trunc(
    toFiniteNumber(termMonths),
  );

  return roundMoney(payment * months);
}

/**
 * Calcula el porcentaje total de compromisos mensuales
 * respecto al ingreso mensual.
 */
export function calculateDebtToIncomeRatio({
  netMonthlyIncome,
  currentMonthlyDebtPayment,
  newMonthlyPayment,
}) {
  const income = toFiniteNumber(netMonthlyIncome);

  if (income <= 0) {
    return 100;
  }

  const existingPayment = Math.max(
    0,
    toFiniteNumber(currentMonthlyDebtPayment),
  );

  const proposedPayment = Math.max(
    0,
    toFiniteNumber(newMonthlyPayment),
  );

  const ratio =
    ((existingPayment + proposedPayment) / income) *
    100;

  return roundPercentage(ratio);
}

/**
 * Dinero disponible después de pagar deudas actuales
 * y la nueva cuota.
 */
export function calculateResidualCapacity({
  netMonthlyIncome,
  currentMonthlyDebtPayment,
  newMonthlyPayment,
}) {
  const income = toFiniteNumber(netMonthlyIncome);

  const existingPayment = Math.max(
    0,
    toFiniteNumber(currentMonthlyDebtPayment),
  );

  const proposedPayment = Math.max(
    0,
    toFiniteNumber(newMonthlyPayment),
  );

  return roundMoney(
    income - existingPayment - proposedPayment,
  );
}

/**
 * Valida las reglas demográficas y laborales
 * asociadas al monto solicitado.
 */
export function validateBusinessRules({
  requestedAmount,
  termMonths,
  age,
  employmentSeniorityMonths,
}) {
  const amount = toFiniteNumber(requestedAmount);
  const term = Math.trunc(
    toFiniteNumber(termMonths),
  );
  const customerAge = toFiniteNumber(age);
  const seniority = Math.trunc(
    toFiniteNumber(employmentSeniorityMonths),
  );

  if (
    amount < LOAN_RULES.minimumAmount ||
    amount > LOAN_RULES.maximumAmount
  ) {
    return {
      valid: false,
      reason: SIMULATION_REASONS.INVALID_AMOUNT,
      message: `El monto mínimo disponible es ${formatMoney(
        LOAN_RULES.minimumAmount,
      )}.`,
      rule: null,
    };
  }

  const rule = getLoanRule({
    requestedAmount: amount,
    age: customerAge,
  });

  if (!rule) {
    return {
      valid: false,
      reason: SIMULATION_REASONS.AGE_NOT_ALLOWED,
      message:
        "El monto seleccionado no está disponible para tu rango de edad.",
      rule: null,
    };
  }

  if (
    seniority <
    rule.minimumEmploymentSeniorityMonths
  ) {
    return {
      valid: false,

      reason:
        SIMULATION_REASONS
          .EMPLOYMENT_SENIORITY_NOT_ALLOWED,

      message: `Para este monto necesitas una antigüedad laboral mínima de ${rule.minimumEmploymentSeniorityMonths} meses.`,

      rule,
    };
  }

  if (!rule.availableTerms.includes(term)) {
    return {
      valid: false,
      reason: SIMULATION_REASONS.INVALID_TERM,
      message:
        "El plazo seleccionado no está disponible para este monto.",
      rule,
    };
  }

  return {
    valid: true,
    reason: SIMULATION_REASONS.APPROVED,
    message: "Las reglas iniciales fueron cumplidas.",
    rule,
  };
}

/**
 * Ejecuta el cálculo completo para una combinación
 * específica de monto y plazo.
 */
export function calculateSimulation({
  requestedAmount,
  termMonths,
  paymentDay,
  age,
  netMonthlyIncome,
  employmentSeniorityMonths,
  currentMonthlyDebtPayment,
}) {
  const amount = toFiniteNumber(requestedAmount);
  const term = Math.trunc(
    toFiniteNumber(termMonths),
  );
  const selectedPaymentDay = Math.trunc(
    toFiniteNumber(paymentDay),
  );
  const income = toFiniteNumber(netMonthlyIncome);
  const currentDebtPayment = Math.max(
    0,
    toFiniteNumber(currentMonthlyDebtPayment),
  );

  if (income <= 0) {
    return createInvalidSimulation({
      requestedAmount: amount,
      termMonths: term,
      paymentDay: selectedPaymentDay,
      reason:
        SIMULATION_REASONS.INVALID_FINANCIAL_DATA,
      message:
        "No encontramos un ingreso mensual válido para realizar la simulación.",
    });
  }

  if (
    !LOAN_RULES.paymentDays.includes(
      selectedPaymentDay,
    )
  ) {
    return createInvalidSimulation({
      requestedAmount: amount,
      termMonths: term,
      paymentDay: selectedPaymentDay,
      reason: SIMULATION_REASONS.INVALID_PAYMENT_DAY,
      message:
        "Selecciona un día de pago mensual válido.",
    });
  }

  const businessValidation = validateBusinessRules({
    requestedAmount: amount,
    termMonths: term,
    age,
    employmentSeniorityMonths,
  });

  if (!businessValidation.valid) {
    return {
      status:
        SIMULATION_STATUS.BUSINESS_RULE_REJECTED,

      viable: false,

      requestedAmount: amount,

      termMonths: term,

      paymentDay: selectedPaymentDay,

      monthlyPayment: 0,

      totalDebt: 0,

      totalInterest: 0,

      debtToIncomeRatio: 0,

      residualCapacity: income - currentDebtPayment,

      reason: businessValidation.reason,

      message: businessValidation.message,

      appliedRule: businessValidation.rule,

      ruleVersion: LOAN_RULES.version,

      calculatedAt: new Date().toISOString(),
    };
  }

  const monthlyPayment = calculateMonthlyPayment({
    principal: amount,

    annualInterestRate:
      LOAN_RULES.annualInterestRate,

    termMonths: term,
  });

  const totalDebt = calculateTotalDebt({
    monthlyPayment,
    termMonths: term,
  });

  const totalInterest = roundMoney(
    totalDebt - amount,
  );

  const debtToIncomeRatio =
    calculateDebtToIncomeRatio({
      netMonthlyIncome: income,

      currentMonthlyDebtPayment:
        currentDebtPayment,

      newMonthlyPayment: monthlyPayment,
    });

  const residualCapacity =
    calculateResidualCapacity({
      netMonthlyIncome: income,

      currentMonthlyDebtPayment:
        currentDebtPayment,

      newMonthlyPayment: monthlyPayment,
    });

  const debtToIncomeIsAllowed =
    debtToIncomeRatio <=
    LOAN_RULES.maximumDebtToIncomeRatio;

  const residualCapacityIsAllowed =
    residualCapacity >=
    LOAN_RULES.minimumResidualCapacity;

  const viable =
    debtToIncomeIsAllowed &&
    residualCapacityIsAllowed;

  let reason = SIMULATION_REASONS.APPROVED;
  let message =
    "La cuota estimada se encuentra dentro de tu capacidad preliminar de pago.";

  if (!debtToIncomeIsAllowed) {
    reason =
      SIMULATION_REASONS
        .DEBT_TO_INCOME_EXCEEDED;

    message = `Tus compromisos mensuales superarían el ${LOAN_RULES.maximumDebtToIncomeRatio}% de tus ingresos.`;
  } else if (!residualCapacityIsAllowed) {
    reason =
      SIMULATION_REASONS
        .RESIDUAL_CAPACITY_INSUFFICIENT;

    message = `Después de pagar tus compromisos necesitas conservar al menos ${formatMoney(
      LOAN_RULES.minimumResidualCapacity,
    )} disponibles.`;
  }

  return {
    status: viable
      ? SIMULATION_STATUS.VIABLE
      : SIMULATION_STATUS.PAYMENT_CAPACITY_REJECTED,

    viable,

    requestedAmount: amount,

    termMonths: term,

    paymentDay: selectedPaymentDay,

    annualInterestRate:
      LOAN_RULES.annualInterestRate,

    monthlyPayment,

    totalDebt,

    totalInterest,

    currentMonthlyDebtPayment:
      currentDebtPayment,

    totalMonthlyCommitments: roundMoney(
      currentDebtPayment + monthlyPayment,
    ),

    debtToIncomeRatio,

    residualCapacity,

    reason,

    message,

    appliedRule: businessValidation.rule,

    ruleVersion: LOAN_RULES.version,

    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Busca primero conservar el monto y ampliar el plazo.
 *
 * Si ninguna opción funciona, reduce el monto en
 * intervalos configurables y vuelve a evaluar los plazos.
 */
export function findAlternative({
  requestedAmount,
  selectedTermMonths,
  paymentDay,
  age,
  netMonthlyIncome,
  employmentSeniorityMonths,
  currentMonthlyDebtPayment,
}) {
  const originalAmount = toFiniteNumber(
    requestedAmount,
  );

  const originalTerm = Math.trunc(
    toFiniteNumber(selectedTermMonths),
  );

  /*
   * Primera estrategia:
   * conservar monto y probar plazos mayores.
   */
  const sameAmountTerms =
    getEligibleTermsForCustomer({
      requestedAmount: originalAmount,
      age,
      employmentSeniorityMonths,
    })
      .filter((term) => term > originalTerm)
      .sort((a, b) => a - b);

  for (const term of sameAmountTerms) {
    const simulation = calculateSimulation({
      requestedAmount: originalAmount,
      termMonths: term,
      paymentDay,
      age,
      netMonthlyIncome,
      employmentSeniorityMonths,
      currentMonthlyDebtPayment,
    });

    if (simulation.viable) {
      return createAlternativeResult({
        simulation,
        originalAmount,
        originalTerm,
        strategy: "EXTEND_TERM",
      });
    }
  }

  /*
   * Segunda estrategia:
   * reducir monto y probar los plazos disponibles,
   * comenzando por el plazo más largo para encontrar
   * una cuota más baja.
   */
  const initialAlternativeAmount =
    roundDownToStep(
      originalAmount -
        LOAN_RULES.alternativeAmountStep,

      LOAN_RULES.alternativeAmountStep,
    );

  for (
    let amount = initialAlternativeAmount;
    amount >= LOAN_RULES.minimumAmount;
    amount -= LOAN_RULES.alternativeAmountStep
  ) {
    const availableTerms =
      getEligibleTermsForCustomer({
        requestedAmount: amount,
        age,
        employmentSeniorityMonths,
      }).sort((a, b) => b - a);

    for (const term of availableTerms) {
      const simulation = calculateSimulation({
        requestedAmount: amount,
        termMonths: term,
        paymentDay,
        age,
        netMonthlyIncome,
        employmentSeniorityMonths,
        currentMonthlyDebtPayment,
      });

      if (simulation.viable) {
        return createAlternativeResult({
          simulation,
          originalAmount,
          originalTerm,

          strategy:
            term > originalTerm
              ? "REDUCE_AMOUNT_AND_EXTEND_TERM"
              : "REDUCE_AMOUNT",
        });
      }
    }
  }

  return {
    found: false,

    status:
      SIMULATION_STATUS.NO_ALTERNATIVE_AVAILABLE,

    reason:
      SIMULATION_REASONS.NO_ALTERNATIVE_FOUND,

    message:
      "No encontramos una combinación disponible dentro de tu capacidad preliminar de pago.",

    originalAmount,

    originalTerm,

    alternative: null,

    ruleVersion: LOAN_RULES.version,

    evaluatedAt: new Date().toISOString(),
  };
}

/**
 * Evalúa una solicitud y busca una alternativa
 * automáticamente cuando corresponde.
 */
export function evaluateLoanSimulation({
  requestedAmount,
  termMonths,
  paymentDay,
  age,
  netMonthlyIncome,
  employmentSeniorityMonths,
  currentMonthlyDebtPayment,
}) {
  const simulation = calculateSimulation({
    requestedAmount,
    termMonths,
    paymentDay,
    age,
    netMonthlyIncome,
    employmentSeniorityMonths,
    currentMonthlyDebtPayment,
  });

  if (simulation.viable) {
    return {
      status: SIMULATION_STATUS.VIABLE,

      simulation,

      alternative: null,
    };
  }

  const alternativeResult = findAlternative({
    requestedAmount,
    selectedTermMonths: termMonths,
    paymentDay,
    age,
    netMonthlyIncome,
    employmentSeniorityMonths,
    currentMonthlyDebtPayment,
  });

  if (alternativeResult.found) {
    return {
      status:
        SIMULATION_STATUS.ALTERNATIVE_AVAILABLE,

      simulation,

      alternative:
        alternativeResult.alternative,

      alternativeStrategy:
        alternativeResult.strategy,
    };
  }

  return {
    status:
      simulation.status ===
      SIMULATION_STATUS.BUSINESS_RULE_REJECTED
        ? SIMULATION_STATUS.BUSINESS_RULE_REJECTED
        : SIMULATION_STATUS.NO_ALTERNATIVE_AVAILABLE,

    simulation,

    alternative: null,
  };
}

export function getEligibleTermsForCustomer({
  requestedAmount,
  age,
  employmentSeniorityMonths,
}) {
  const rule = getLoanRule({
    requestedAmount,
    age,
  });

  if (!rule) {
    return [];
  }

  const seniority = Math.trunc(
    toFiniteNumber(employmentSeniorityMonths),
  );

  if (
    seniority <
    rule.minimumEmploymentSeniorityMonths
  ) {
    return [];
  }

  return [...rule.availableTerms];
}

export function formatMoney(value) {
  const amount = toFiniteNumber(value);

  return new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency: LOAN_RULES.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace("BOB", LOAN_RULES.currencySymbol)
    .trim();
}

export function formatPercentage(value) {
  const percentage = toFiniteNumber(value);

  return `${new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(percentage)}%`;
}

function createAlternativeResult({
  simulation,
  originalAmount,
  originalTerm,
  strategy,
}) {
  return {
    found: true,

    status:
      SIMULATION_STATUS.ALTERNATIVE_AVAILABLE,

    reason:
      SIMULATION_REASONS.ALTERNATIVE_FOUND,

    message:
      "Encontramos una combinación que puede ajustarse mejor a tu capacidad preliminar de pago.",

    strategy,

    originalAmount,

    originalTerm,

    alternative: {
      ...simulation,

      accepted: false,

      proposedAt: new Date().toISOString(),
    },

    ruleVersion: LOAN_RULES.version,

    evaluatedAt: new Date().toISOString(),
  };
}

function createInvalidSimulation({
  requestedAmount,
  termMonths,
  paymentDay,
  reason,
  message,
}) {
  return {
    status: SIMULATION_STATUS.INVALID_DATA,

    viable: false,

    requestedAmount,

    termMonths,

    paymentDay,

    monthlyPayment: 0,

    totalDebt: 0,

    totalInterest: 0,

    debtToIncomeRatio: 0,

    residualCapacity: 0,

    reason,

    message,

    appliedRule: null,

    ruleVersion: LOAN_RULES.version,

    calculatedAt: new Date().toISOString(),
  };
}

function roundDownToStep(value, step) {
  const numericValue = toFiniteNumber(value);
  const numericStep = Math.max(
    1,
    toFiniteNumber(step),
  );

  return (
    Math.floor(numericValue / numericStep) *
    numericStep
  );
}

function roundMoney(value) {
  return Math.round(
    (toFiniteNumber(value) + Number.EPSILON) * 100,
  ) / 100;
}

function roundPercentage(value) {
  return Math.round(
    (toFiniteNumber(value) + Number.EPSILON) * 10,
  ) / 10;
}

function toFiniteNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}