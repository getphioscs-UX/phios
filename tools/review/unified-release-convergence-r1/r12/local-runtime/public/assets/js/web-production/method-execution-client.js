/** WPR production client boundary. Never imports Method calculation/runtime code. */
export async function requestMethodExecution(executionRequest, options = {}) {
  const fetcher = typeof options.fetcher === 'function' ? options.fetcher : fetch;
  const response = await fetcher('/api/method-execute', {
    method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify(executionRequest), credentials: 'same-origin'
  });
  const payload = await response.json().catch(() => ({ok:false,error:'METHOD_EXECUTION_RESPONSE_INVALID'}));
  return {ok:response.ok && payload?.ok===true,status:response.status,...payload};
}
