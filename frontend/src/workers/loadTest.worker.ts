export interface LoadTestConfig {
  concurrentUsers: number;
  iterations: number;
  url: string;
  apiKey: string;
}

export interface LoadTestResult {
  success: number;
  errors: number;
  totalDuration: number;
}

self.onmessage = async (e: MessageEvent<LoadTestConfig>) => {
  const { concurrentUsers, iterations, url, apiKey } = e.data;

  let successCount = 0;
  let errorCount = 0;
  const startTime = Date.now();

  const runUserSimulations = async () => {
    for (let i = 0; i < iterations; i++) {
      try {
        const response = await fetch(url, {
          headers: {
            'x-api-key': apiKey
          }
        });
        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
      }
    }
  };

  const userPromises = [];
  for (let u = 0; u < concurrentUsers; u++) {
    userPromises.push(runUserSimulations());
  }

  await Promise.all(userPromises);

  const result: LoadTestResult = {
    success: successCount,
    errors: errorCount,
    totalDuration: Date.now() - startTime
  };

  self.postMessage(result);
};
