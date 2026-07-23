export const LOAN_RULES = {
  version: "loan-simulation-v1.0.0",

  currency: "BOB",

  currencySymbol: "Bs",

  minimumAmount: 7000,

  /*
   * El documento funcional no define un monto máximo.
   * Por eso, la última regla acepta montos superiores
   * a Bs 50.000 sin establecer un límite artificial.
   */
  maximumAmount: Number.POSITIVE_INFINITY,

  annualInterestRate: 12,

  maximumDebtToIncomeRatio: 40,

  minimumResidualCapacity: 500,

  alternativeAmountStep: 500,

  paymentDays: [5, 10, 15, 20, 25],

  amortizationMethod: "FRENCH",

  ranges: [
    {
      id: "RANGE_7000_20000_YOUNG",
      minimumAmount: 7000,
      maximumAmount: 20000,
      minimumAge: 18,
      maximumAge: 24,
      minimumEmploymentSeniorityMonths: 36,
      availableTerms: [6, 12, 18, 24],
    },

    {
      id: "RANGE_7000_20000_ADULT",
      minimumAmount: 7000,
      maximumAmount: 20000,
      minimumAge: 25,
      maximumAge: 65,
      minimumEmploymentSeniorityMonths: 12,
      availableTerms: [6, 12, 18, 24],
    },

    {
      id: "RANGE_20001_35000",
      minimumAmount: 20001,
      maximumAmount: 35000,
      minimumAge: 25,
      maximumAge: 65,
      minimumEmploymentSeniorityMonths: 12,
      availableTerms: [6, 12, 18, 24, 36],
    },

    {
      id: "RANGE_35001_50000",
      minimumAmount: 35001,
      maximumAmount: 50000,
      minimumAge: 25,
      maximumAge: 65,
      minimumEmploymentSeniorityMonths: 12,
      availableTerms: [12, 24, 36, 48],
    },

    {
      id: "RANGE_50001_PLUS",
      minimumAmount: 50001,
      maximumAmount: Number.POSITIVE_INFINITY,
      minimumAge: 25,
      maximumAge: 65,
      minimumEmploymentSeniorityMonths: 12,
      availableTerms: [12, 24, 36, 48, 60, 72],
    },
  ],
};

export const SIMULATION_STATUS = {
  VIABLE: "VIABLE",

  ALTERNATIVE_AVAILABLE: "ALTERNATIVE_AVAILABLE",

  PAYMENT_CAPACITY_REJECTED:
    "PAYMENT_CAPACITY_REJECTED",

  BUSINESS_RULE_REJECTED:
    "BUSINESS_RULE_REJECTED",

  NO_ALTERNATIVE_AVAILABLE:
    "NO_ALTERNATIVE_AVAILABLE",

  INVALID_DATA: "INVALID_DATA",
};

export const SIMULATION_REASONS = {
  APPROVED: "SIMULATION_APPROVED",

  INVALID_AMOUNT: "INVALID_REQUESTED_AMOUNT",

  INVALID_TERM: "INVALID_TERM",

  INVALID_PAYMENT_DAY: "INVALID_PAYMENT_DAY",

  INVALID_FINANCIAL_DATA: "INVALID_FINANCIAL_DATA",

  AGE_NOT_ALLOWED: "AGE_NOT_ALLOWED",

  EMPLOYMENT_SENIORITY_NOT_ALLOWED:
    "EMPLOYMENT_SENIORITY_NOT_ALLOWED",

  DEBT_TO_INCOME_EXCEEDED:
    "DEBT_TO_INCOME_EXCEEDED",

  RESIDUAL_CAPACITY_INSUFFICIENT:
    "RESIDUAL_CAPACITY_INSUFFICIENT",

  PAYMENT_CAPACITY_NOT_ALLOWED:
    "PAYMENT_CAPACITY_NOT_ALLOWED",

  ALTERNATIVE_FOUND:
    "ALTERNATIVE_FOUND",

  NO_ALTERNATIVE_FOUND:
    "NO_ALTERNATIVE_FOUND",
};