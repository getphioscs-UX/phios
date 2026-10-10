export function fixtureResponse() {
  const paths = [
    {
      id: 'observe_spending',
      pathType: 'observe',
      label: '观察',
      direction: '观察每天检查余额的次数',
      actionSteps: ['每天记录一次'],
      observationWindow: '7 days',
      completionSignals: ['完成 7 天观察'],
      stopConditions: ['高影响或难以逆转的风险出现'],
      reviewConditions: ['观察窗口完成'],
      evidenceWatch: ['余额检查次数'],
      unknownReality: ['不同支出情境是否有差异']
    },
    {
      id: 'clarify_dependency',
      pathType: 'clarify',
      label: '澄清',
      direction: '把未知项转成问题',
      unknownReality: ['依赖关系仍未建立'],
      evidenceWatch: ['取得可回答资料']
    },
    {
      id: 'verify_alternative',
      pathType: 'verify',
      label: '核实',
      direction: '区分主要与替代读取'
    },
    {
      id: 'financial_review',
      pathType: 'professional_review',
      label: '财务现实审阅',
      direction: '保存专业审阅意向'
    }
  ];
  return {
    runtimeEntityId: 'runtime_money',
    runtimeEntryId: 'entry_money',
    navigationInput: {
      createdAt: '2026-07-27T00:00:00.000Z',
      readingId: 'reading_money',
      readingVersion: 3,
      reconstructionReference: {
        reconstruction_id: 'reconstruction_money',
        reconstruction_version: 2
      }
    },
    navigation: {
      availablePaths: paths,
      selectedPath: paths[0],
      unknownReality: ['哪些支出最容易引发反复检查？']
    }
  };
}

export function observationConfiguration() {
  return {
    objective: '观察余额检查行为',
    selected_signal: ['每天检查余额次数'],
    baseline: ['每天约 8 次'],
    observation_window: { value: 7, unit: 'day' },
    frequency: { type: 'daily', value: 1 },
    record_fields: [
      'count', 'trigger_context', 'intensity',
      'decision_delayed', 'counter_example'
    ],
    completion_condition: ['完成 7 天观察'],
    stop_condition: ['高风险条件出现'],
    review_condition: ['窗口完成后审阅']
  };
}
