from pathlib import Path
import json
p=Path('content/world/local-answer-quality-r1.json');d=json.loads(p.read_text(encoding='utf-8'))
facets={'energy-food':'energy_inputs_food_production_and_pass_through','fuel-transport':'fuel_transport_costs_subsidies_and_import_exposure','gdp':'output_vs_household_accounts','wages':'wage_distribution_disposable_income_and_prices','resource':'resource_revenues_governance_investment_and_linkages','ai-work':'task_exposure_adoption_and_human_input','age':'age_structure_participation_health_and_care','site':'site_specific_utilities_and_connectivity','infrastructure':'water_power_transport_disruptions','ports':'shipping_disruption_delays_and_costs','manufacturing':'manufacturing_measures_denominators_and_price_basis','rates':'loan_pricing_repricing_and_fixed_contracts','eligibility':'income_debt_assets_and_credit_eligibility'}
for unit in d['units']:
 for c in [unit['direct'],*unit['reasons']]:
  c['sourceFacets']={id:[facets[id]] for id in c['sourceIds']}
  c['requiredFacets']=[facets[id] for id in c['sourceIds']]
  c['supportReview']='ENGINEERING_REVIEW_OF_LINKED_OFFICIAL_PASSAGES; NOT_GENERAL_SEMANTIC_INFERENCE'
p.write_bytes(json.dumps(d,ensure_ascii=False,indent=2).encode())
