import { Job } from "@/types";

type JobCardProps = {
  job: Job;
  onAccept?: (id: number) => void;
};

export default function JobCard({
  job,
  onAccept,
}: JobCardProps) {
  return (
    <div className="bg-white rounded-xl shadow p-6 mb-4">
      <h2 className="text-xl font-bold">
        {job.title}
      </h2>

      <p className="text-gray-500 break-all mt-2">
        {job.audio_url}
      </p>

      <p className="text-blue-600 font-semibold mt-3">
        Payment: ${job.payment}
      </p>

      <p className="text-gray-500 mt-2">
        Status: {job.status}
      </p>

      {onAccept && (
        <button
          onClick={() => onAccept(job.id)}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
        >
          Accept Job
        </button>
      )}
    </div>
  );
}