export default {
  personalRuntime: {
    metaTitle: 'Personal Runtime Setup — PHI OS',
    skip: 'Skip to Personal Runtime setup',
    eyebrow: 'WPR-W21 · Personal Runtime',
    title: 'Prepare your birth inputs without activating a Method.',
    lead: 'Use this page to check whether your birth information is structurally ready. No Method calculation, interpretation, upload or persistence occurs here.',
    privacyTitle: 'Birth data stays on this page only',
    privacyCopy: 'This setup is ephemeral. PHI OS does not submit these fields to a server, save them to browser storage, or create a canonical consent record at WPR-W21.',
    inputTitle: 'Birth initialization',
    inputCopy: 'Unknown values must stay unknown. PHI OS will not replace an unknown birth time with noon, infer your timezone from this browser, or invent coordinates from a place name.',
    birthDate: 'Birth date', birthTime: 'Birth time', birthPlace: 'Birth place', timezone: 'Timezone', coordinates: 'Coordinates (optional)', latitude: 'Latitude', longitude: 'Longitude',
    precision: 'Precision', exact: 'Exact', approximate: 'Approximate', unknown: 'Unknown', source: 'Source', sourceHuman: 'Human declaration',
    confirm: 'I confirm that the information entered here reflects what I currently know.',
    check: 'Check input readiness', clear: 'Clear inputs', resultTitle: 'Input readiness',
    ready: 'Structurally ready for a future governed Method request. Production execution is still unavailable.',
    incomplete: 'Some fields are missing or conflict with their precision setting. Nothing has been submitted.',
    noStorage: 'No data sent · No browser storage · No calculation',
    methodsTitle: 'Method availability', methodsCopy: 'Availability comes from MPA governance, not from whether code exists in the repository.',
    status: { readyW26: 'Method-specific evidence ready · W26/W27 pending', candidate: 'Activation candidate · production unavailable', blocked: 'Public execution unavailable', registered: 'Registered · not implemented for production' },
    methodBoundary: 'A visible Method card does not create production eligibility, public eligibility or professional authority.',
    consentTitle: 'Execution consent is a later gate', consentCopy: 'A real Method execution requires an RDG-governed consent record and allowed data purpose. This page creates neither.',
    journeyAction: 'Return to Reality Journey', professionalAction: 'View professional services',
    authorityUnavailable: 'Personal Runtime authority could not be loaded. Method availability remains unavailable.'
  }
};
