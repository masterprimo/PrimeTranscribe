"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Job = {
  id: number;
  title: string;
  description: string | null;
  audio_url: string | null;
  duration: number | null;
  payment: number | null;
  status: string;
  worker_id: string | null;
};

function TranscribeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const jobId = searchParams.get("jobId");

  const [job, setJob] = useState<Job | null>(null);
  const [transcript, setTranscript] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadJob();
  }, [jobId]);

  async function loadJob() {
    if (!jobId) {
      alert("No job selected.");
      router.push("/worker/my-jobs");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("jobs")
      .select(
        "id, title, description, audio_url, duration, payment, status, worker_id"
      )
      .eq("id", jobId)
      .single();

    if (error) {
      console.error("LOAD JOB ERROR:", error);
      alert(error.message);
      router.push("/worker/my-jobs");
      return;
    }

    if (!data) {
      alert("Job not found.");
      router.push("/worker/my-jobs");
      return;
    }

    if (data.worker_id !== user.id) {
      alert("This job is not assigned to your account.");
      router.push("/worker/my-jobs");
      return;
    }

    setJob(data as Job);
    setLoading(false);
  }

  async function submitTranscript() {
    if (!job) {
      return;
    }

    if (!transcript.trim()) {
      alert("Please enter your transcription.");
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { error } = await supabase
        .from("submissions")
        .insert({
          job_id: job.id,
          worker_id: user.id,
          transcript: transcript.trim(),
          status: "pending",
        });

      if (error) {
        console.error("SUBMISSION ERROR:", error);
        alert(error.message);
        return;
      }

      alert("Transcription submitted successfully!");

      setTranscript("");

      router.push("/worker/transcriptions");
    } catch (error) {
      console.error("SUBMIT TRANSCRIPTION ERROR:", error);

      alert(
        "Something went wrong while submitting."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <h1 className="text-xl font-bold text-gray-800">
            Loading transcription job...
          </h1>

          <p className="text-gray-500 mt-2">
            Please wait.
          </p>
        </div>
      </main>
    );
  }

  if (!job) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-100">

      <header className="bg-blue-600 text-white p-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>
            <h1 className="text-3xl font-bold">
              Prime Transcribe
            </h1>

            <p className="text-blue-100 mt-1">
              Transcription Workspace
            </p>
          </div>

          <button
            onClick={() =>
              router.push("/worker/my-jobs")
            }
            className="bg-white text-blue-700 px-5 py-2 rounded-lg font-semibold hover:bg-gray-100"
          >
            Back to My Jobs
          </button>

        </div>
      </header>

      <section className="max-w-6xl mx-auto p-8">

        <div className="bg-white rounded-2xl shadow p-8">

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 mb-8">

            <div>
              <h2 className="text-3xl font-bold text-gray-800">
                {job.title}
              </h2>

              {job.description && (
                <p className="text-gray-600 mt-3">
                  {job.description}
                </p>
              )}
            </div>

            <div className="bg-blue-50 rounded-xl p-5 min-w-[180px]">

              <p className="text-sm text-gray-500">
                Payment
              </p>

              <p className="text-3xl font-bold text-blue-600">
                $
                {Number(
                  job.payment || 0
                ).toFixed(2)}
              </p>

            </div>

          </div>

          {/* AUDIO */}

          <div className="mb-8">

            <h3 className="text-xl font-bold text-gray-800 mb-3">
              Audio
            </h3>

            {job.audio_url ? (
              <audio
                controls
                src={job.audio_url}
                className="w-full"
              />
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
                No audio file is available for this job.
              </div>
            )}

          </div>

          {/* TRANSCRIPTION */}

          <div>

            <h3 className="text-xl font-bold text-gray-800 mb-3">
              Your Transcription
            </h3>

            <textarea
              value={transcript}
              onChange={(e) =>
                setTranscript(e.target.value)
              }
              placeholder="Type the transcription here..."
              rows={18}
              className="w-full border border-gray-300 rounded-xl p-5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex flex-col sm:flex-row gap-4 mt-5">

              <button
                onClick={submitTranscript}
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-bold"
              >
                {submitting
                  ? "Submitting..."
                  : "Submit Transcription"}
              </button>

              <button
                onClick={() =>
                  router.push("/worker/my-jobs")
                }
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-3 rounded-lg font-semibold"
              >
                Save / Go Back
              </button>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}

function TranscribeLoading() {
  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow p-8 text-center">
        <h1 className="text-xl font-bold text-gray-800">
          Loading transcription workspace...
        </h1>

        <p className="text-gray-500 mt-2">
          Please wait.
        </p>
      </div>
    </main>
  );
}

export default function TranscribePage() {
  return (
    <Suspense fallback={<TranscribeLoading />}>
      <TranscribeContent />
    </Suspense>
  );
}