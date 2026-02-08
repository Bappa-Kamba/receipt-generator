import type { Queue, Job } from 'bull';

export async function ensureJob(
  queue: Queue,
  jobName: string,
  jobId: string,
  data: any,
  opts: any,
): Promise<Job> {
  const existing = await queue.getJob(jobId);

  if (!existing) {
    return queue.add(jobName, data, { ...opts, jobId });
  }

  const state = await existing.getState();

  // Already in-flight or waiting -> nothing to do
  if (state === 'waiting' || state === 'delayed' || state === 'active') {
    return existing;
  }

  // Failed -> we retry
  if (state === 'failed') {
    await existing.retry();
    return existing;
  }

  // Completed -> we return
  if (state === 'completed') {
    return existing;
  }

  return existing;
}
