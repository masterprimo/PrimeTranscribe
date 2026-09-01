export type Job = {
  id: number;
  title: string;
  audio_url: string;
  payment: number;
  status: string;
  worker_id: string | null;
};

export type Submission = {
  id: number;
  job_id: number;
  worker_id: string;
  transcript: string;
  created_at: string;
};