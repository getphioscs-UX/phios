export const REPORT_TEMPLATE_SECTIONS = Object.freeze({
  runtime_report: ['runtime_summary', 'observed_change', 'sequence', 'conditions', 'evidence', 'unknowns', 'coordinates', 'signatures', 'current_position'],
  professional_readout: ['professional_interpretation', 'evidence_review', 'unsupported_inference_removed', 'clarifications', 'risk_flags', 'professional_boundary'],
  navigation_plan: ['selected_direction', 'next_step', 'required_conditions', 'evidence_to_observe', 'review_date', 'stop_conditions', 'change_conditions'],
  follow_up_report: ['what_changed', 'what_remained_stable', 'new_evidence', 'navigation_outcome', 'updated_constraints', 'revised_direction', 'next_review'],
  human_design_foundation_report: ['chart_overview', 'type', 'strategy', 'authority', 'profile', 'definition', 'centers', 'channels', 'key_gates', 'variables_phs', 'environment', 'cognition', 'motivation', 'general_operating_conditions', 'limitations'],
  human_design_runtime_interpretation: ['runtime_carrier', 'decision_architecture', 'environmental_conditions', 'relational_operation', 'experience_style', 'expression_style', 'action_style', 'recurrent_signatures', 'navigation_considerations'],
  reality_specific_external_reader_report: ['current_reality_question', 'confirmed_runtime_evidence', 'external_reader_perspective', 'possible_correspondence', 'conflicting_evidence', 'unverified_interpretation', 'professional_observation', 'navigation_considerations', 'what_to_observe_next'],
  integrated_runtime_review: ['runtime_evidence', 'professional_interpretation', 'human_design_perspective', 'future_reader_perspectives', 'shared_themes', 'conflicting_interpretations', 'what_remains_unverified', 'navigation_considerations']
});
