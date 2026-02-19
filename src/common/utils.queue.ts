import type { Queue, Job } from 'bull';

export async function ensureJob(
  queue: Queue,
  jobName: string,
  jobId: string,
  data: any,
  options: any,
): Promise<Job> {
  const existing = await queue.getJob(jobId);

  if (!existing) {
    return queue.add(jobName, data, { ...options, jobId });
  }

  const state = await existing.getState();

  if (state === 'failed') {
    await existing.retry();
    return existing;
  }

  return existing;
}
