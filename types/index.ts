export type Job = {
  id: number;
  title: string;
  description: string | null;
  audio_url: string;
  duration: number | null;
  payment: number | null;
  status: string;
  worker_id: string | null;
  created_at: string;
};