/**
 * PHI OS Runtime Navigation copy — English.
 *
 * These strings are used by the server-side Rule Navigation Engine.
 * They are separate from assets/js/locales, which serves frontend UI copy.
 */

export const NAVIGATION_RUNTIME_EN = Object.freeze({
  locale: 'en',
  outputLanguage: 'en',

  defaults: Object.freeze({
    runtimeTransition:
      'the current Runtime transition',

    knownBoundary:
      'the current known boundary',

    materialRisk:
      'any material increase in risk',

    currentRuntime:
      'Not established',

    transitionLabel:
      'Clarify the current Runtime transition'
  }),

  priority: Object.freeze({
    unknown: Object.freeze({
      focus: unknown =>
        `Clarify the unresolved Reality most likely to change the current Reading: ${unknown}`,

      reason:
        'An unresolved Reality may materially change the current Reading.'
    }),

    evidence: Object.freeze({
      focus: evidence =>
        `Observe whether evidence related to "${evidence}" appears, changes, or remains absent.`,

      reason:
        'The current Reading requires observable evidence before stronger Navigation is justified.'
    }),

    transition: Object.freeze({
      focus: transition =>
        `Observe whether the "${transition}" transition stabilizes, reverses, or changes direction.`,

      reason:
        'No stronger evidence-supported Navigation priority has been established.'
    })
  }),

  guidance: Object.freeze({
    desiredFallback:
      'Move the current transition toward a clearer, more stable, and reviewable state.',

    suggestedDirection: label =>
      `Suggested starting direction: ${label}`,

    suggestedReason: priority =>
      `This direction addresses the current Navigation priority first: ${priority}`,

    userChoice:
      'This is a suggested starting point, not an automatic decision. Confirm that it fits the current Reality before acting.',

    reviewAfterStep:
      'Complete one bounded step, record what happened, and return the result to Reality Review before expanding the action.'
  }),

  paths: Object.freeze({
    observe: Object.freeze({
      label: 'Observe',

      directionWithEvidence: evidence =>
        `Collect or notice observable evidence related to: ${evidence}`,

      directionWithoutEvidence:
        'Collect one observable signal before changing the current Reading.',

      boundary:
        'Do not convert a feeling, interpretation, symbolic lens, expectation, or assumption into Observed Evidence.',

      rationale:
        'Observation is appropriate when the current Reading remains provisional or evidence is still incomplete.',

      reviewEvidence: evidence =>
        `Review when evidence appears, changes, or remains absent for: ${evidence}`,

      reviewTransition:
        'Review when the current transition stabilizes, reverses, or changes direction.',

      reviewImpact:
        'Review before moving from observation into a higher-impact path.'
    }),

    clarify: Object.freeze({
      label: 'Clarify',

      directionWithUnknown: unknown =>
        `Clarify what is currently known, reported, interpreted, and still unknown about: ${unknown}`,

      directionWithoutUnknown:
        'Clarify which part of the current transition remains insufficiently established.',

      boundary:
        'Clarification may refine a question or distinction, but it cannot manufacture missing evidence or establish causation.',

      rationaleWithUnknown:
        'An unresolved Reality may materially alter the current Reading or later Navigation.',

      rationaleWithoutUnknown:
        'The current transition remains too broad for a more specific path.',

      reviewUnknown: unknown =>
        `Review after new information becomes available about: ${unknown}`,

      reviewPrecision:
        'Review after the unresolved part of the transition can be stated more precisely.',

      reviewContradiction:
        'Review if clarification reveals a contradiction between reported experience and observed evidence.',

      returnObservation:
        'Return to Observation when clarification produces no new evidence.'
    }),

    verify: Object.freeze({
      label: 'Verify',

      directionWithAlternative:
        'Compare the primary Runtime pattern with the Alternative Reading and identify evidence that would distinguish between them.',

      directionWithoutAlternative:
        'Identify one observable condition that could support or contradict the current Reading.',

      boundary:
        'Verification tests whether evidence supports a Reading; it does not prove that an interpretation is universally true.',

      rationaleWithAlternative:
        'More than one bounded interpretation remains possible.',

      rationaleWithoutAlternative:
        'The current interpretation requires observable support or contradiction.',

      alternativeUnknown:
        'Which Reading better fits later observable evidence remains unknown.',

      reviewPrimary:
        'Review when distinguishing evidence supports the primary Reading.',

      reviewAlternative:
        'Review when distinguishing evidence supports the Alternative Reading.',

      reviewNeither:
        'Review when evidence contradicts both current Readings.',

      absenceWarning:
        'Do not treat the absence of evidence as automatic confirmation.'
    }),

    experiment: Object.freeze({
      label: 'Small Experiment',

      direction:
        'When a practical test is appropriate, choose one small, reversible, low-impact change connected to the current transition.',

      boundary:
        'The experiment must remain reversible and must not involve medical, legal, financial, child-safety, abuse, or other high-risk decisions without qualified professional judgment.',

      rationale:
        'A bounded experiment may generate new evidence without committing the Runtime Entity to a large or irreversible change.',

      outcomeUnknown:
        'The outcome of the experiment remains unknown until it is observed.',

      defineResult:
        'Define what observable result would count as support, contradiction, or no meaningful change before beginning.',

      reviewRisk:
        'Review immediately if cost, risk, distress, dependency, or loss of reversibility increases.',

      reviewWindow:
        'Review after the pre-defined observation window.',

      generalizationWarning:
        'Do not generalize one test result beyond the tested condition.'
    }),

    reposition: Object.freeze({
      label: 'Reposition',

      directionWithRegion:
        'Temporarily shift attention, effort, or decision weight away from the current pressure point while preserving the original Reading for later Review.',

      directionWithoutRegion:
        'Temporarily adjust the current position without treating the adjustment as proof that the Reading was correct.',

      boundary:
        'Repositioning changes the current relationship to a condition; it does not establish why that condition exists.',

      rationale:
        'The present position may be increasing pressure, narrowing observation, or reducing the ability to compare alternatives.',

      outcomeUnknown:
        'Whether repositioning changes the underlying Runtime or only the immediate experience remains unknown.',

      reviewState:
        'Review whether the repositioned state changes observable pressure, access, choice, or stability.',

      reviewTransfer:
        'Review if the adjustment creates new constraints or transfers cost to another person or system.',

      reviewPermanent:
        'Review before making the repositioning permanent.',

      returnReading:
        'Return to the original Reading if no meaningful change is observed.'
    }),

    reconnect: Object.freeze({
      label: 'Reconnect',

      direction:
        'Re-establish contact with a relevant person, resource, routine, responsibility, or source of information when disconnection is explicitly supported by the current evidence.',

      boundary:
        'Do not assume that reconnection is safe, mutual, possible, or desirable. Abuse, coercion, entrapment, boundary violations, and safety risks require professional or protective review.',

      rationale:
        'A relevant connection may be missing, weakened, interrupted, or insufficiently represented in the current Runtime.',

      outcomeUnknown:
        'Whether reconnection is available, safe, reciprocal, and useful remains to be established.',

      reviewReciprocity:
        'Review whether the connection is reciprocal rather than one-sided.',

      reviewResponsibility:
        'Review whether responsibility, cost, and decision authority are becoming clearer or more distorted.',

      escalation:
        'Stop and escalate if coercion, intimidation, abuse, entrapment, or unsafe dependency appears.',

      reviewSupport:
        'Review whether reconnection produces observable support rather than only expected support.'
    }),

    recover: Object.freeze({
      label: 'Recover',

      direction:
        'Reduce avoidable load and create a bounded recovery window before requiring further interpretation, decision, or change.',

      boundary:
        'Recovery is not a diagnosis or treatment. Medical or psychological symptoms, acute distress, self-harm risk, or functional collapse require qualified professional assessment.',

      rationale:
        'Current pressure, uncertainty, or repeated demand may be reducing the Runtime Entity’s capacity to observe and respond reliably.',

      causeUnknown:
        'Whether reduced capacity is temporary, structural, medical, psychological, environmental, or relational remains unknown.',

      reviewFunction:
        'Review whether basic functioning, attention, stability, or decision capacity changes during the recovery window.',

      reviewReturn:
        'Review if the same load rapidly returns after temporary relief.',

      escalation:
        'Escalate when symptoms, distress, impairment, or safety risks increase.',

      reliefWarning:
        'Do not interpret temporary relief as proof of a specific cause.'
    }),

    professionalReview: Object.freeze({
      label: 'Professional Review',

      direction:
        'Bring the bounded Runtime record, Evidence Boundary, unresolved Reality, relevant risks, and contemplated high-impact action to an appropriately qualified professional.',

      boundary:
        'PHI OS may organize the record and identify uncertainty, but it does not diagnose, prescribe, provide regulated advice, or replace professional judgment.',

      rationale:
        'Professional Review is appropriate when risk, uncertainty, supplied professional material, legal or financial consequence, health, child safety, abuse, coercion, or irreversible action exceeds the Rule Engine boundary.',

      fallbackEvidence:
        'The current Navigation includes uncertainty or potential impact that may exceed automated interpretation boundaries.',

      conclusionUnknown:
        'The relevant professional conclusion remains unknown until an appropriately qualified professional completes an assessment.',

      reviewAssessment:
        'Review after the professional assessment is received.',

      preserveClass:
        'Preserve the professional assessment as a separate Evidence Class.',

      evidenceWarning:
        'Do not rewrite a professional opinion as Observed Evidence.',

      returnRuntime:
        'Return new findings to the same Runtime Entity without modifying the original record.'
    }),

    financialProfessionalReview: Object.freeze({
      label:
        'Financial Reality Review',

      direction:
        'Clarify the financial Reality through a separate, guided evidence intake and qualified professional review.',

      boundary:
        'This path does not collect sensitive financial records, recommend products, provide regulated advice, or replace qualified professional judgment.',

      rationale:
        'Income, expenses, cash flow, assets, liabilities, protection, investment, tax, estate, retirement, property, or business-finance conditions may materially affect the current Reality.',

      suitableWhen: Object.freeze([
        'The current transition involves income, expenses, debt, protection, investment, tax, retirement, estate, property, or business finances.',
        'A material financial decision is being considered.',
        'Important financial evidence remains incomplete or unverified.'
      ]),

      firstStep:
        'Confirm whether a separate guided Financial Evidence Intake should be started when that workspace becomes available.',

      fallbackEvidence:
        'The current Reading contains a financial signal that requires a separate Evidence Boundary.',

      conclusionUnknown:
        'No professional financial conclusion is established until relevant evidence is collected and reviewed by a qualified professional.',

      reviewConditions: Object.freeze([
        'Review after the relevant financial evidence has been collected and verified.',
        'Review before any material, regulated, difficult-to-reverse, or product-specific financial action.',
        'Return professional findings as Professional Assessment, not Observed Evidence.'
      ])
    })
  }),

  actions: Object.freeze({
    observe: Object.freeze({
      nextStep: evidence =>
        `Choose one observable signal and record its current baseline before changing anything: ${evidence}`,

      steps: evidence => [
        `Define exactly what can be seen, counted, dated, or directly recorded for: ${evidence}`,
        'Record the present state once without explaining its cause.',
        'Observe the same signal again after one relevant event or one short observation cycle.'
      ],

      observationWindow:
        'One relevant event or one short observation cycle; do not wait indefinitely.',

      completionSignals: Object.freeze([
        'A before-and-after record exists for the same signal.',
        'The signal appeared, changed, or remained absent without being reclassified as proof.'
      ]),

      stopConditions: Object.freeze([
        'Stop if observation itself increases material risk or requires a high-impact action.'
      ])
    }),

    clarify: Object.freeze({
      nextStep: unknown =>
        `Rewrite the unresolved Reality as one answerable question: ${unknown}`,

      steps: unknown => [
        `Separate what is known, reported, interpreted, and still unknown about: ${unknown}`,
        'Identify one person, record, event, or observation that could reduce this uncertainty.',
        'Collect only that missing information, then return it to the Reading.'
      ],

      observationWindow:
        'Until one material ambiguity is reduced; then re-read before asking a broader question.',

      completionSignals: Object.freeze([
        'The unresolved question can be stated without a hidden causal assumption.',
        'One previously unclear boundary is now known or explicitly remains unknown.'
      ]),

      stopConditions: Object.freeze([
        'Stop when clarification starts manufacturing evidence, inferring motives, or repeating the same unanswered question.'
      ])
    }),

    verify: Object.freeze({
      nextStep:
        'Write one observable condition that would support the primary Reading and one that would support the Alternative Reading.',

      steps: Object.freeze([
        'State the two competing Readings in one sentence each.',
        'Define one distinguishing observation for each Reading before collecting more material.',
        'Classify the result as supporting the primary Reading, the alternative, both, or neither.'
      ]),

      observationWindow:
        'One distinguishing observation cycle, followed immediately by Reality Review.',

      completionSignals: Object.freeze([
        'The same evidence has been compared against both Readings.',
        'The result is recorded without forcing a winner when neither Reading fits.'
      ]),

      stopConditions: Object.freeze([
        'Stop if the test cannot distinguish the Readings or requires a high-impact decision to generate evidence.'
      ])
    }),

    reconfigure: Object.freeze({
      nextStep: (direction, evidence) =>
        `Define one small, reversible change toward “${direction}” and use this signal to evaluate it: ${evidence}`,

      steps: Object.freeze([
        'Choose one variable to change and keep the rest of the tested condition stable.',
        'Record the baseline, the exact change, and the result that would count as support, contradiction, or no meaningful change.',
        'Run only one bounded test, then stop and review before repeating or expanding it.'
      ]),

      observationWindow:
        'One pre-defined test cycle; set its end point before beginning.',

      completionSignals: Object.freeze([
        'The test remained reversible and within its stated boundary.',
        'A result was recorded against the pre-defined signal.'
      ]),

      stopConditions: Object.freeze([
        'Stop immediately if cost, risk, distress, dependency, or irreversibility increases.',
        'Do not use this path for regulated, medical, legal, financial, safety-critical, or child-related decisions without qualified review.'
      ])
    }),

    reposition: Object.freeze({
      nextStep: constraint =>
        `Choose one current constraint and make one temporary, reversible adjustment to attention, effort, timing, or decision weight: ${constraint}`,

      steps: Object.freeze([
        'Name the pressure point and the present position that may be amplifying it.',
        'Define one temporary adjustment that does not transfer hidden cost or remove another person’s choice.',
        'Observe whether access, pressure, stability, or available choice changes, then restore or review the position.'
      ]),

      observationWindow:
        'One bounded situation or one pre-defined temporary interval.',

      completionSignals: Object.freeze([
        'The adjustment remained reversible and its effect on pressure or choice was observed.',
        'Any transferred cost or new constraint was recorded.'
      ]),

      stopConditions: Object.freeze([
        'Stop if the adjustment becomes permanent by default, transfers material cost, or reduces safety or consent.'
      ])
    }),

    reconnect: Object.freeze({
      nextStep:
        'Identify one relevant and safe connection, state the limited purpose of contact, and check whether contact is mutual and available.',

      steps: Object.freeze([
        'Name the person, resource, routine, responsibility, or information source that is actually supported by the Reading.',
        'Set a limited purpose, boundary, and request before making contact.',
        'Observe reciprocity, clarity of responsibility, and actual support rather than expected support.'
      ]),

      observationWindow:
        'One bounded contact or one agreed interaction, followed by Review.',

      completionSignals: Object.freeze([
        'The connection was available, mutual, and relevant to the stated purpose.',
        'Responsibility, cost, and decision authority became clearer rather than more distorted.'
      ]),

      stopConditions: Object.freeze([
        'Stop if coercion, intimidation, abuse, entrapment, unsafe dependency, or a boundary violation appears.'
      ])
    }),

    recover: Object.freeze({
      nextStep:
        'Remove or reduce one avoidable load and define a bounded recovery window before requiring another decision.',

      steps: Object.freeze([
        'Identify one avoidable demand that can be paused, reduced, delegated, or deferred safely.',
        'Define which basic function, attention, or stability signal will be observed during the recovery window.',
        'End the window with a Review rather than assuming temporary relief proves a cause.'
      ]),

      observationWindow:
        'One explicit recovery interval with a stated start, end, and function signal.',

      completionSignals: Object.freeze([
        'The selected load was reduced without creating a larger hidden risk.',
        'A change or no change in basic functioning was recorded.'
      ]),

      stopConditions: Object.freeze([
        'Escalate instead of continuing this path if symptoms, distress, impairment, or safety risk increases.'
      ])
    }),

    professional_review: Object.freeze({
      nextStep:
        'Prepare one bounded record containing the current question, Evidence Boundary, unresolved Reality, relevant risk, and contemplated high-impact action.',

      steps: Object.freeze([
        'Identify the professional scope required for the actual question.',
        'Bring the evidence classes and unresolved points without converting interpretation into fact.',
        'Record the professional assessment separately and return it to the same Runtime Entity for Review.'
      ]),

      observationWindow:
        'Until the relevant qualified assessment is received; do not substitute automated output while waiting.',

      completionSignals: Object.freeze([
        'An appropriately qualified professional addressed the bounded question.',
        'The assessment and its limits are preserved as a separate Evidence Class.'
      ]),

      stopConditions: Object.freeze([
        'Do not proceed with the high-impact action when required professional review is unavailable or incomplete.'
      ])
    })
  }),

  review: Object.freeze({
    evidence: evidence =>
      `Review when evidence appears, changes, or remains absent for: ${evidence}`,

    transition:
      'Review when the current transition stabilizes, reverses, or changes direction.',

    highImpact:
      'Review before any high-impact, difficult-to-reverse, regulated, medical, legal, financial, safety-critical, or child-related action.',

    risk: risk =>
      `Review if this current risk increases: ${risk}`,

    unknown: unknown =>
      `Review when new information becomes available about: ${unknown}`
  }),

  continuity: Object.freeze({
    returnResult:
      'Return every observed result to the same Runtime Entity for Review.',

    persistAllowed:
      'Persist Navigation only within the explicitly allowed storage boundary.',

    sessionOnly:
      'Keep Navigation session-only unless the user explicitly allows storage.',

    reversible:
      'A selected path must remain reversible, bounded, or reviewable within its stated conditions.',

    newVersion:
      'New Evidence must be stored as a new version and must not modify the original Evidence Boundary.',

    preserveUnknown:
      'Unresolved Reality must remain visible until later evidence establishes or contradicts it.'
  }),

  readiness: Object.freeze({
    professional:
      'Bounded paths are available, but current uncertainty, risk, confidence, or professional material requires human judgment before high-impact action.',

    unknown:
      'Bounded paths are available while unresolved Reality remains explicitly preserved.',

    ready:
      'Bounded and reviewable paths are available for user selection.'
  }),

  professionalReview: Object.freeze({
    recommended:
      'Current uncertainty, risk, low confidence, or supplied professional material requires human judgment before high-impact action.',

    notRequired:
      'Professional escalation is not currently required for low-impact observation, clarification, or verification.'
  })
});

export default NAVIGATION_RUNTIME_EN;
