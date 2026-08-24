const text = value => String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ');
const allowedDocumentTypes = new Set(['LAB_REPORT','IMAGING_REPORT','DISCHARGE_SUMMARY','CLINIC_NOTE','PRESCRIPTION_LIST','HEALTH_SCREENING','OTHER']);
const allowedObservationTypes = new Set(['MEASUREMENT','REFERENCE_RANGE','DOCUMENT_STATEMENT','CLINICIAN_ATTRIBUTION','DATE','MEDICATION_ENTRY']);

export function buildMedicalDocumentIngestionIR(input = {}) {
  const documentRef = text(input.documentRef);
  const documentType = text(input.documentType).toUpperCase();
  if (!documentRef) throw new Error('HRX_DOCUMENT_REF_REQUIRED');
  if (!allowedDocumentTypes.has(documentType)) throw new Error('HRX_DOCUMENT_TYPE_INVALID');
  if (!input.source || !text(input.source.sourceClass)) throw new Error('HRX_DOCUMENT_SOURCE_REQUIRED');
  if (!input.provenance || !text(input.provenance.documentDigest)) throw new Error('HRX_DOCUMENT_DIGEST_REQUIRED');
  const observations = (Array.isArray(input.observations) ? input.observations : []).map((item, index) => {
    const observationType = text(item.observationType).toUpperCase();
    if (!allowedObservationTypes.has(observationType)) throw new Error('HRX_DOCUMENT_OBSERVATION_TYPE_INVALID');
    return {
      observationId: text(item.observationId || `${documentRef}-OBS-${String(index + 1).padStart(3,'0')}`),
      observationType,
      label: text(item.label || item.name || observationType),
      value: item.value ?? item.text ?? null,
      unit: text(item.unit) || null,
      observedAt: text(item.observedAt) || null,
      referenceRange: text(item.referenceRange) || null,
      sourceClass: 'DOCUMENT_EXTRACTED',
      provenance: { documentRef, documentDigest: text(input.provenance.documentDigest) },
      establishesDiagnosis: false,
      establishesCausality: false
    };
  });
  return {
    schemaVersion: 'PHI-OS-HRX-MEDICAL-DOCUMENT-IR-v1.0.0',
    documentRef, documentType,
    source: { ...input.source }, observations,
    provenance: { ...input.provenance },
    unknowns: Array.isArray(input.unknowns) ? input.unknowns.map(text).filter(Boolean) : [],
    governance: {
      extractionOnly: true,
      diagnosisEstablished: false,
      treatmentRecommended: false,
      referenceRangeTreatedAsDocumentContext: true,
      rawDocumentPersistedByThisRuntime: false
    }
  };
}
