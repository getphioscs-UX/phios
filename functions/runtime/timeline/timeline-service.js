import { createEventAppendService } from
  './event-append-service.js';
import { createTimelineReader } from './timeline-reader.js';
import { projectRuntimeTimeline } from
  './timeline-projection.js';
import { TIMELINE_CONTRACT_ID } from './timeline-contract.js';

export function createTimelineService(options = {}) {
  const appendService = createEventAppendService(options);
  const reader = createTimelineReader(options);

  async function project(input = {}) {
    const timeline = await reader.read({
      ...input,
      include_internal: false
    });
    return projectRuntimeTimeline(timeline, input);
  }

  return Object.freeze({
    contract: TIMELINE_CONTRACT_ID,
    append: appendService.append,
    read: reader.read,
    project
  });
}

export default createTimelineService;
