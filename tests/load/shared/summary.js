const safeName = (value) => value.replace(/[^a-zA-Z0-9._-]/g, "_");

export const buildSummary = (scriptName) => {
  return (data) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const summary = {
      script: scriptName,
      vusMax: data.metrics.vus_max?.values?.value ?? 0,
      iterations: data.metrics.iterations?.values?.count ?? 0,
      failuresRate: data.metrics.http_req_failed?.values?.rate ?? 0,
      avgHttpMs: data.metrics.http_req_duration?.values?.avg ?? 0,
      p95HttpMs: data.metrics.http_req_duration?.values?.["p(95)"] ?? 0,
      avgIterationMs: data.metrics.iteration_duration?.values?.avg ?? 0,
      checksRate: data.metrics.checks?.values?.rate ?? 0,
    };

    const text = [
      `Script: ${summary.script}`,
      `Iterations: ${summary.iterations}`,
      `Max VUs: ${summary.vusMax}`,
      `HTTP failed rate: ${summary.failuresRate}`,
      `Avg HTTP duration: ${summary.avgHttpMs} ms`,
      `P95 HTTP duration: ${summary.p95HttpMs} ms`,
      `Avg iteration duration: ${summary.avgIterationMs} ms`,
      `Checks pass rate: ${summary.checksRate}`,
    ].join("\n");

    return {
      [`tests/load/reports/${safeName(scriptName)}.${timestamp}.json`]:
        JSON.stringify(data, null, 2),
      stdout: `${text}\n`,
    };
  };
};
