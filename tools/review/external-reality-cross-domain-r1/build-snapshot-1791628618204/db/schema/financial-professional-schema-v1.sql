-- PHI OS M4A-W8 Financial Professional Infrastructure schema.
-- Monetary amounts use integer minor units. Sensitive source documents and
-- full account, policy, tax, identity or address values do not belong here.

CREATE TABLE IF NOT EXISTS client_household (
  household_id TEXT PRIMARY KEY,
  primary_client_id TEXT NOT NULL,
  household_type TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  data_date TEXT NOT NULL,
  consent_id TEXT NOT NULL,
  retention_decision_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (length(trim(household_id)) > 0),
  CHECK (length(trim(primary_client_id)) > 0),
  CHECK (household_type IN ('individual', 'joint', 'family', 'business')),
  CHECK (status IN ('draft', 'active', 'review_due', 'closed'))
);

CREATE TABLE IF NOT EXISTS financial_objective (
  objective_id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  data_subject_id TEXT NOT NULL,
  objective_type TEXT NOT NULL,
  priority_score INTEGER NOT NULL,
  time_horizon TEXT NOT NULL,
  target_amount_minor INTEGER,
  currency TEXT,
  target_date TEXT,
  current_progress_minor INTEGER,
  evidence_source_type TEXT NOT NULL,
  evidence_reference_id TEXT,
  evidence_date TEXT NOT NULL,
  verification_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (priority_score BETWEEN 1 AND 10),
  CHECK (target_amount_minor IS NULL OR target_amount_minor >= 0),
  CHECK (current_progress_minor IS NULL OR current_progress_minor >= 0),
  CHECK (evidence_source_type IN (
    'user_entered', 'document_extracted', 'professional_entered',
    'calculated', 'estimated', 'projected', 'unverified'
  )),
  FOREIGN KEY (household_id) REFERENCES client_household(household_id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS income_item (
  income_id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  data_subject_id TEXT NOT NULL,
  income_type TEXT NOT NULL,
  amount_minor INTEGER NOT NULL,
  currency TEXT NOT NULL,
  amount_basis TEXT NOT NULL,
  frequency TEXT NOT NULL,
  owner_reference TEXT NOT NULL,
  evidence_source_type TEXT NOT NULL,
  evidence_reference_id TEXT,
  evidence_date TEXT NOT NULL,
  verification_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (amount_minor >= 0),
  CHECK (amount_basis IN ('gross', 'net')),
  CHECK (frequency IN ('monthly', 'annual', 'irregular')),
  CHECK (evidence_source_type IN (
    'user_entered', 'document_extracted', 'professional_entered',
    'calculated', 'estimated', 'projected', 'unverified'
  )),
  FOREIGN KEY (household_id) REFERENCES client_household(household_id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS expense_item (
  expense_id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  data_subject_id TEXT NOT NULL,
  expense_type TEXT NOT NULL,
  amount_minor INTEGER NOT NULL,
  currency TEXT NOT NULL,
  frequency TEXT NOT NULL,
  owner_reference TEXT NOT NULL,
  evidence_source_type TEXT NOT NULL,
  evidence_reference_id TEXT,
  evidence_date TEXT NOT NULL,
  verification_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (amount_minor >= 0),
  CHECK (frequency IN ('monthly', 'annual', 'irregular')),
  CHECK (evidence_source_type IN (
    'user_entered', 'document_extracted', 'professional_entered',
    'calculated', 'estimated', 'projected', 'unverified'
  )),
  FOREIGN KEY (household_id) REFERENCES client_household(household_id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS asset_item (
  asset_id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  data_subject_id TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  current_value_minor INTEGER NOT NULL,
  currency TEXT NOT NULL,
  ownership_reference TEXT NOT NULL,
  ownership_basis_points INTEGER NOT NULL DEFAULT 10000,
  valuation_date TEXT NOT NULL,
  evidence_source_type TEXT NOT NULL,
  evidence_reference_id TEXT,
  verification_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (current_value_minor >= 0),
  CHECK (ownership_basis_points BETWEEN 0 AND 10000),
  CHECK (evidence_source_type IN (
    'user_entered', 'document_extracted', 'professional_entered',
    'calculated', 'estimated', 'projected', 'unverified'
  )),
  FOREIGN KEY (household_id) REFERENCES client_household(household_id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS liability_item (
  liability_id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  data_subject_id TEXT NOT NULL,
  liability_type TEXT NOT NULL,
  lender TEXT,
  original_amount_minor INTEGER,
  outstanding_amount_minor INTEGER NOT NULL,
  currency TEXT NOT NULL,
  interest_basis_points INTEGER,
  monthly_repayment_minor INTEGER,
  remaining_term_months INTEGER,
  secured_asset_reference TEXT,
  borrower_reference TEXT NOT NULL,
  guarantor_reference TEXT,
  evidence_source_type TEXT NOT NULL,
  evidence_reference_id TEXT,
  evidence_date TEXT NOT NULL,
  verification_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (original_amount_minor IS NULL OR original_amount_minor >= 0),
  CHECK (outstanding_amount_minor >= 0),
  CHECK (interest_basis_points IS NULL OR interest_basis_points >= 0),
  CHECK (monthly_repayment_minor IS NULL OR monthly_repayment_minor >= 0),
  CHECK (remaining_term_months IS NULL OR remaining_term_months >= 0),
  CHECK (evidence_source_type IN (
    'user_entered', 'document_extracted', 'professional_entered',
    'calculated', 'estimated', 'projected', 'unverified'
  )),
  FOREIGN KEY (household_id) REFERENCES client_household(household_id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bank_account_summary (
  bank_summary_id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  data_subject_id TEXT NOT NULL,
  institution TEXT NOT NULL,
  account_type TEXT NOT NULL,
  masked_account_number TEXT NOT NULL,
  currency TEXT NOT NULL,
  balance_minor INTEGER NOT NULL,
  interest_basis_points INTEGER,
  maturity_date TEXT,
  ownership_reference TEXT NOT NULL,
  ownership_basis_points INTEGER NOT NULL DEFAULT 10000,
  evidence_source_type TEXT NOT NULL,
  evidence_reference_id TEXT,
  evidence_date TEXT NOT NULL,
  verification_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (masked_account_number GLOB '[*][*][*][*][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9]'),
  CHECK (length(masked_account_number) = 8),
  CHECK (balance_minor >= 0),
  CHECK (interest_basis_points IS NULL OR interest_basis_points >= 0),
  CHECK (ownership_basis_points BETWEEN 0 AND 10000),
  CHECK (evidence_source_type IN (
    'user_entered', 'document_extracted', 'professional_entered',
    'calculated', 'estimated', 'projected', 'unverified'
  )),
  FOREIGN KEY (household_id) REFERENCES client_household(household_id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS investment_item (
  investment_id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  data_subject_id TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  instrument_reference TEXT,
  institution TEXT,
  acquired_date TEXT,
  amount_invested_minor INTEGER,
  current_value_minor INTEGER NOT NULL,
  currency TEXT NOT NULL,
  ownership_reference TEXT NOT NULL,
  ownership_basis_points INTEGER NOT NULL DEFAULT 10000,
  valuation_date TEXT NOT NULL,
  risk_classification TEXT NOT NULL,
  evidence_source_type TEXT NOT NULL,
  evidence_reference_id TEXT,
  verification_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (amount_invested_minor IS NULL OR amount_invested_minor >= 0),
  CHECK (current_value_minor >= 0),
  CHECK (ownership_basis_points BETWEEN 0 AND 10000),
  CHECK (evidence_source_type IN (
    'user_entered', 'document_extracted', 'professional_entered',
    'calculated', 'estimated', 'projected', 'unverified'
  )),
  FOREIGN KEY (household_id) REFERENCES client_household(household_id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS property_item (
  property_id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  data_subject_id TEXT NOT NULL,
  property_type TEXT NOT NULL,
  general_location TEXT NOT NULL,
  acquired_date TEXT,
  tenure TEXT,
  size_summary TEXT,
  purchase_price_minor INTEGER,
  other_cost_minor INTEGER,
  current_market_value_minor INTEGER NOT NULL,
  outstanding_loan_minor INTEGER,
  monthly_instalment_minor INTEGER,
  rental_income_minor INTEGER,
  currency TEXT NOT NULL,
  ownership_reference TEXT NOT NULL,
  ownership_basis_points INTEGER NOT NULL DEFAULT 10000,
  valuation_date TEXT NOT NULL,
  evidence_source_type TEXT NOT NULL,
  evidence_reference_id TEXT,
  verification_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (purchase_price_minor IS NULL OR purchase_price_minor >= 0),
  CHECK (other_cost_minor IS NULL OR other_cost_minor >= 0),
  CHECK (current_market_value_minor >= 0),
  CHECK (outstanding_loan_minor IS NULL OR outstanding_loan_minor >= 0),
  CHECK (monthly_instalment_minor IS NULL OR monthly_instalment_minor >= 0),
  CHECK (rental_income_minor IS NULL OR rental_income_minor >= 0),
  CHECK (ownership_basis_points BETWEEN 0 AND 10000),
  CHECK (evidence_source_type IN (
    'user_entered', 'document_extracted', 'professional_entered',
    'calculated', 'estimated', 'projected', 'unverified'
  )),
  FOREIGN KEY (household_id) REFERENCES client_household(household_id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS insurance_policy (
  insurance_policy_id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  data_subject_id TEXT NOT NULL,
  policy_holder_reference TEXT NOT NULL,
  insured_person_reference TEXT NOT NULL,
  company TEXT NOT NULL,
  policy_type TEXT NOT NULL,
  masked_policy_number TEXT NOT NULL,
  commencement_date TEXT,
  premium_minor INTEGER,
  payment_mode TEXT,
  maturity_date TEXT,
  life_cover_minor INTEGER,
  tpd_cover_minor INTEGER,
  critical_illness_cover_minor INTEGER,
  medical_cover_minor INTEGER,
  hospital_benefit_minor INTEGER,
  cash_value_minor INTEGER,
  currency TEXT NOT NULL,
  nomination_status TEXT,
  waiver_status TEXT,
  evidence_source_type TEXT NOT NULL,
  evidence_reference_id TEXT,
  evidence_date TEXT NOT NULL,
  verification_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (masked_policy_number GLOB '[*][*][*][*][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9]'),
  CHECK (length(masked_policy_number) = 8),
  CHECK (premium_minor IS NULL OR premium_minor >= 0),
  CHECK (life_cover_minor IS NULL OR life_cover_minor >= 0),
  CHECK (tpd_cover_minor IS NULL OR tpd_cover_minor >= 0),
  CHECK (critical_illness_cover_minor IS NULL OR critical_illness_cover_minor >= 0),
  CHECK (medical_cover_minor IS NULL OR medical_cover_minor >= 0),
  CHECK (hospital_benefit_minor IS NULL OR hospital_benefit_minor >= 0),
  CHECK (cash_value_minor IS NULL OR cash_value_minor >= 0),
  CHECK (evidence_source_type IN (
    'user_entered', 'document_extracted', 'professional_entered',
    'calculated', 'estimated', 'projected', 'unverified'
  )),
  FOREIGN KEY (household_id) REFERENCES client_household(household_id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tax_profile (
  tax_profile_id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  data_subject_id TEXT NOT NULL,
  taxpayer_type TEXT NOT NULL,
  income_basis TEXT NOT NULL,
  estimated_assessable_income_minor INTEGER,
  reliefs_minor INTEGER,
  deductions_minor INTEGER,
  business_expenses_minor INTEGER,
  estimated_tax_minor INTEGER,
  currency TEXT NOT NULL,
  filing_status TEXT NOT NULL,
  professional_referral_required INTEGER NOT NULL DEFAULT 0,
  evidence_source_type TEXT NOT NULL,
  evidence_reference_id TEXT,
  evidence_date TEXT NOT NULL,
  verification_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (estimated_assessable_income_minor IS NULL OR estimated_assessable_income_minor >= 0),
  CHECK (reliefs_minor IS NULL OR reliefs_minor >= 0),
  CHECK (deductions_minor IS NULL OR deductions_minor >= 0),
  CHECK (business_expenses_minor IS NULL OR business_expenses_minor >= 0),
  CHECK (estimated_tax_minor IS NULL OR estimated_tax_minor >= 0),
  CHECK (professional_referral_required IN (0, 1)),
  CHECK (evidence_source_type IN (
    'user_entered', 'document_extracted', 'professional_entered',
    'calculated', 'estimated', 'projected', 'unverified'
  )),
  FOREIGN KEY (household_id) REFERENCES client_household(household_id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS retirement_plan (
  retirement_plan_id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  data_subject_id TEXT NOT NULL,
  current_age INTEGER NOT NULL,
  desired_retirement_age INTEGER NOT NULL,
  expected_expenses_minor INTEGER NOT NULL,
  existing_assets_minor INTEGER NOT NULL,
  expected_income_minor INTEGER,
  funding_gap_minor INTEGER NOT NULL,
  currency TEXT NOT NULL,
  assumption_ids TEXT NOT NULL DEFAULT '[]',
  evidence_source_type TEXT NOT NULL,
  evidence_reference_id TEXT,
  evidence_date TEXT NOT NULL,
  verification_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (current_age BETWEEN 0 AND 120),
  CHECK (desired_retirement_age BETWEEN current_age AND 120),
  CHECK (expected_expenses_minor >= 0),
  CHECK (existing_assets_minor >= 0),
  CHECK (expected_income_minor IS NULL OR expected_income_minor >= 0),
  CHECK (funding_gap_minor >= 0),
  CHECK (json_valid(assumption_ids)),
  CHECK (evidence_source_type IN (
    'user_entered', 'document_extracted', 'professional_entered',
    'calculated', 'estimated', 'projected', 'unverified'
  )),
  FOREIGN KEY (household_id) REFERENCES client_household(household_id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS education_plan (
  education_plan_id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  child_reference_id TEXT NOT NULL,
  current_age INTEGER NOT NULL,
  target_education_age INTEGER NOT NULL,
  general_location TEXT,
  education_type TEXT NOT NULL,
  current_cost_minor INTEGER NOT NULL,
  existing_fund_minor INTEGER NOT NULL,
  funding_gap_minor INTEGER NOT NULL,
  currency TEXT NOT NULL,
  assumption_ids TEXT NOT NULL DEFAULT '[]',
  evidence_source_type TEXT NOT NULL,
  evidence_reference_id TEXT,
  evidence_date TEXT NOT NULL,
  verification_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (current_age BETWEEN 0 AND 120),
  CHECK (target_education_age BETWEEN current_age AND 120),
  CHECK (current_cost_minor >= 0),
  CHECK (existing_fund_minor >= 0),
  CHECK (funding_gap_minor >= 0),
  CHECK (json_valid(assumption_ids)),
  CHECK (evidence_source_type IN (
    'user_entered', 'document_extracted', 'professional_entered',
    'calculated', 'estimated', 'projected', 'unverified'
  )),
  FOREIGN KEY (household_id) REFERENCES client_household(household_id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS estate_profile (
  estate_profile_id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  data_subject_id TEXT NOT NULL,
  will_status TEXT NOT NULL,
  nomination_status TEXT NOT NULL,
  beneficiary_count INTEGER,
  guardian_consideration INTEGER NOT NULL DEFAULT 0,
  trust_consideration INTEGER NOT NULL DEFAULT 0,
  property_ownership_structure TEXT,
  business_succession_status TEXT,
  professional_referral_required INTEGER NOT NULL DEFAULT 0,
  evidence_source_type TEXT NOT NULL,
  evidence_reference_id TEXT,
  evidence_date TEXT NOT NULL,
  verification_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (beneficiary_count IS NULL OR beneficiary_count >= 0),
  CHECK (guardian_consideration IN (0, 1)),
  CHECK (trust_consideration IN (0, 1)),
  CHECK (professional_referral_required IN (0, 1)),
  CHECK (evidence_source_type IN (
    'user_entered', 'document_extracted', 'professional_entered',
    'calculated', 'estimated', 'projected', 'unverified'
  )),
  FOREIGN KEY (household_id) REFERENCES client_household(household_id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS financial_ratio (
  ratio_id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  formula_id TEXT NOT NULL,
  formula_version TEXT NOT NULL,
  value_numeric REAL,
  unit TEXT NOT NULL,
  calculation_status TEXT NOT NULL,
  input_date TEXT NOT NULL,
  input_sources TEXT NOT NULL DEFAULT '[]',
  assumption_ids TEXT NOT NULL DEFAULT '[]',
  calculated_at TEXT NOT NULL,
  review_status TEXT NOT NULL,
  professional_override TEXT,
  created_at TEXT NOT NULL,
  CHECK (json_valid(input_sources)),
  CHECK (json_valid(assumption_ids)),
  CHECK (professional_override IS NULL OR json_valid(professional_override)),
  CHECK (calculation_status IN ('calculated', 'insufficient_input')),
  CHECK (review_status IN ('pending', 'reviewed', 'overridden')),
  FOREIGN KEY (household_id) REFERENCES client_household(household_id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS financial_risk (
  risk_id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  risk_type TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL,
  evidence_references TEXT NOT NULL DEFAULT '[]',
  triggered_at TEXT NOT NULL,
  review_status TEXT NOT NULL,
  reviewed_by TEXT,
  recommendation_created INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (json_valid(evidence_references)),
  CHECK (severity IN ('information', 'attention', 'material', 'critical')),
  CHECK (status IN ('open', 'confirmed', 'dismissed', 'resolved')),
  CHECK (review_status IN ('pending', 'reviewed')),
  CHECK (recommendation_created = 0),
  FOREIGN KEY (household_id) REFERENCES client_household(household_id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS financial_recommendation (
  recommendation_id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  direction_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  evidence_references TEXT NOT NULL DEFAULT '[]',
  constraint_references TEXT NOT NULL DEFAULT '[]',
  missing_data_references TEXT NOT NULL DEFAULT '[]',
  authority_record_id TEXT NOT NULL,
  recommendation_status TEXT NOT NULL,
  product_specific INTEGER NOT NULL DEFAULT 0,
  conflict_disclosure_recorded INTEGER NOT NULL DEFAULT 0,
  commission_disclosure_recorded INTEGER NOT NULL DEFAULT 0,
  client_decision_required INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (json_valid(evidence_references)),
  CHECK (json_valid(constraint_references)),
  CHECK (json_valid(missing_data_references)),
  CHECK (recommendation_status IN (
    'draft', 'professional_review_required', 'approved', 'declined',
    'superseded'
  )),
  CHECK (product_specific = 0),
  CHECK (conflict_disclosure_recorded IN (0, 1)),
  CHECK (commission_disclosure_recorded IN (0, 1)),
  CHECK (client_decision_required = 1),
  FOREIGN KEY (household_id) REFERENCES client_household(household_id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS financial_action (
  action_id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  recommendation_id TEXT,
  action_type TEXT NOT NULL,
  responsible_reference TEXT NOT NULL,
  target_date TEXT,
  status TEXT NOT NULL,
  result_reference TEXT,
  client_decision_recorded INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (status IN (
    'planned', 'client_accepted', 'in_progress', 'completed', 'paused',
    'declined'
  )),
  CHECK (client_decision_recorded IN (0, 1)),
  FOREIGN KEY (household_id) REFERENCES client_household(household_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (recommendation_id)
    REFERENCES financial_recommendation(recommendation_id)
    ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS financial_review (
  review_id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  review_type TEXT NOT NULL,
  financial_data_date TEXT NOT NULL,
  reviewed_at TEXT NOT NULL,
  reviewer_id TEXT NOT NULL,
  authority_record_id TEXT NOT NULL,
  review_status TEXT NOT NULL,
  outcome TEXT NOT NULL,
  next_review_at TEXT,
  source_references TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (json_valid(source_references)),
  CHECK (review_status IN (
    'pending', 'clarification_required', 'completed', 'superseded'
  )),
  FOREIGN KEY (household_id) REFERENCES client_household(household_id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_financial_household_client
  ON client_household(primary_client_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_financial_household_status
  ON client_household(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_financial_objective_household
  ON financial_objective(household_id, priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_income_household_date
  ON income_item(household_id, evidence_date DESC);
CREATE INDEX IF NOT EXISTS idx_expense_household_date
  ON expense_item(household_id, evidence_date DESC);
CREATE INDEX IF NOT EXISTS idx_asset_household_valuation
  ON asset_item(household_id, valuation_date DESC);
CREATE INDEX IF NOT EXISTS idx_liability_household_date
  ON liability_item(household_id, evidence_date DESC);
CREATE INDEX IF NOT EXISTS idx_bank_summary_household_date
  ON bank_account_summary(household_id, evidence_date DESC);
CREATE INDEX IF NOT EXISTS idx_investment_household_valuation
  ON investment_item(household_id, valuation_date DESC);
CREATE INDEX IF NOT EXISTS idx_property_household_valuation
  ON property_item(household_id, valuation_date DESC);
CREATE INDEX IF NOT EXISTS idx_insurance_household_date
  ON insurance_policy(household_id, evidence_date DESC);
CREATE INDEX IF NOT EXISTS idx_tax_household_date
  ON tax_profile(household_id, evidence_date DESC);
CREATE INDEX IF NOT EXISTS idx_retirement_household_date
  ON retirement_plan(household_id, evidence_date DESC);
CREATE INDEX IF NOT EXISTS idx_education_household_date
  ON education_plan(household_id, evidence_date DESC);
CREATE INDEX IF NOT EXISTS idx_estate_household_date
  ON estate_profile(household_id, evidence_date DESC);
CREATE INDEX IF NOT EXISTS idx_ratio_household_formula
  ON financial_ratio(household_id, formula_id, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_household_status
  ON financial_risk(household_id, status, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendation_household_status
  ON financial_recommendation(household_id, recommendation_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_action_household_status
  ON financial_action(household_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_household_date
  ON financial_review(household_id, reviewed_at DESC);
