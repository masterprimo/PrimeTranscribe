"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";
import {
  useSearchParams,
  useRouter,
} from "next/navigation";
import { supabase } from "@/lib/supabase";

type Job = {
  id: string;
  title: string;
  description: string | null;
  audio_url: string;
  duration: number | null;
  payment: number | null;
  status: string;
  worker_id: string | null;
  job_type: string;
  created_at?: string;
};

function TranscriptionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const jobId = searchParams.get("jobId");

  const [job, setJob] = useState<Job | null>(null);
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!jobId) {
      setLoading(false);
      return;
    }

    loadJob();
  }, [jobId]);

  async function loadJob() {
    if (!jobId) return;

    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("Please login again.");
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("jobs")
      .select(
        "id, title, description, audio_url, duration, payment, status, worker_id, job_type, created_at"
      )
      .eq("id", jobId)
      .maybeSingle();

    if (error) {
      console.error("LOAD JOB ERROR:", error);

      alert(
        error.message ||
          "Unable to load transcription job."
      );

      router.replace("/worker");
      return;
    }

    if (!data) {
      alert("Invalid job ID or job not found.");
      router.replace("/worker");
      return;
    }

    const isInterview = data.job_type === "interview";

    /*
     * INTERVIEW TEST
     *
     * Interview jobs are shared.
     * They do not belong to one worker.
     */
    if (isInterview) {
      if (data.status !== "open") {
        alert(
          "This interview test is not currently available."
        );

        router.replace("/worker");
        return;
      }

      const { data: existingSubmission, error: submissionCheckError } =
        await supabase
          .from("submissions")
          .select("id, status")
          .eq("job_id", jobId)
          .eq("worker_id", user.id)
          .maybeSingle();

      if (submissionCheckError) {
        console.error(
          "INTERVIEW SUBMISSION CHECK ERROR:",
          submissionCheckError
        );

        alert(
          submissionCheckError.message ||
            "Unable to check your interview submission."
        );

        router.replace("/worker");
        return;
      }

      if (existingSubmission) {
        alert(
          "You have already submitted this interview test."
        );

        router.replace("/worker");
        return;
      }

      setJob(data as Job);
      setLoading(false);
      return;
    }

    /*
     * REGULAR JOB
     *
     * Regular jobs belong to one worker.
     */
    if (data.worker_id !== user.id) {
      alert(
        "You are not authorized to transcribe this job."
      );

      router.replace("/worker");
      return;
    }

    if (
      data.status !== "accepted" &&
      data.status !== "completed"
    ) {
      alert(
        "This job is not currently available for transcription."
      );

      router.replace("/worker");
      return;
    }

    setJob(data as Job);
    setLoading(false);
  }

  async function submitTranscript() {
    if (!job || !jobId) {
      alert("Invalid job ID.");
      return;
    }

    if (!transcript.trim()) {
      alert(
        "Please enter your transcription before submitting."
      );
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("Please login again.");
      router.replace("/login");
      return;
    }

    setSubmitting(true);

    try {
      const isInterview =
        job.job_type === "interview";

      /*
       * Check whether this worker already submitted
       * this particular job.
       */
      const {
        data: existingSubmissions,
        error: checkError,
      } = await supabase
        .from("submissions")
        .select("id, status")
        .eq("job_id", jobId)
        .eq("worker_id", user.id);

      if (checkError) {
        console.error(
          "CHECK SUBMISSION ERROR:",
          checkError
        );

        alert(
          checkError.message ||
            "Unable to check existing submission."
        );

        setSubmitting(false);
        return;
      }

      if (
        existingSubmissions &&
        existingSubmissions.length > 0
      ) {
        alert(
          isInterview
            ? "You have already submitted this interview test."
            : "You have already submitted this job."
        );

        setSubmitting(false);
        return;
      }

      /*
       * Create the submission.
       */
      const {
        data: newSubmission,
        error: submissionError,
      } = await supabase
        .from("submissions")
        .insert({
          job_id: jobId,
          worker_id: user.id,
          transcript: transcript.trim(),
          status: "pending",
        })
        .select(
          "id, job_id, worker_id, transcript, status, submitted_at"
        )
        .maybeSingle();

      if (submissionError) {
        console.error(
          "SUBMISSION ERROR:",
          submissionError
        );

        alert(
          submissionError.message ||
            "Failed to submit transcription."
        );

        setSubmitting(false);
        return;
      }

      if (!newSubmission) {
        alert(
          "Submission could not be confirmed."
        );

        setSubmitting(false);
        return;
      }

      /*
       * INTERVIEW TEST:
       *
       * Do NOT update the job.
       *
       * The same interview job must remain open so
       * other workers can also take the test.
       */
      if (isInterview) {
        alert(
          "Interview test submitted successfully! It is now waiting for admin review."
        );

        router.replace("/worker");
        return;
      }

      /*
       * REGULAR JOB:
       *
       * Mark the job completed after submission.
       */
      const {
        error: jobUpdateError,
      } = await supabase
        .from("jobs")
        .update({
          status: "completed",
        })
        .eq("id", jobId)
        .eq("worker_id", user.id);

      if (jobUpdateError) {
        console.error(
          "JOB STATUS UPDATE ERROR:",
          jobUpdateError
        );

        alert(
          "Your transcription was submitted, but the job status could not be updated."
        );

        setSubmitting(false);
        return;
      }

      alert(
        "Transcription submitted successfully! It is now waiting for admin review."
      );

      router.replace("/worker");
    } catch (error) {
      console.error(
        "SUBMIT TRANSCRIPTION ERROR:",
        error
      );

      alert(
        "Something went wrong while submitting your transcription."
      );

      setSubmitting(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
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
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-600">
            Job Not Found
          </h1>

          <p className="text-gray-500 mt-3">
            The transcription job could not be found.
          </p>

          <button
            onClick={() =>
              router.replace("/worker")
            }
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Back to Worker Dashboard
          </button>
        </div>
      </main>
    );
  }

  const isInterview = job.job_type === "interview";

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-blue-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">
                Prime Transcribe
              </h1>

              <p className="text-blue-100 text-sm">
                Transcription Workspace
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() =>
                  router.push("/worker")
                }
                className="bg-white text-blue-700 px-5 py-2 rounded-lg font-semibold hover:bg-gray-100"
              >
                Dashboard
              </button>

              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 px-5 py-2 rounded-lg font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="max-w-5xl mx-auto p-6 md:p-8">
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-5">
            <div>
              <p
                className={`font-semibold text-sm ${
                  isInterview
                    ? "text-purple-600"
                    : "text-blue-600"
                }`}
              >
                {isInterview
                  ? "INTERVIEW TEST"
                  : "TRANSCRIPTION JOB"}
              </p>

              <h2 className="text-3xl font-bold text-gray-800 mt-2">
                {job.title}
              </h2>

              {isInterview && (
                <div className="mt-3 inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-bold">
                  Paid Interview Test — $10
                </div>
              )}

              {job.description && (
                <p className="text-gray-600 mt-4">
                  {job.description}
                </p>
              )}
            </div>

            <div className="text-left md:text-right">
              <p className="text-gray-500 text-sm">
                Payment
              </p>

              <p className="text-3xl font-bold text-green-600">
                $
                {Number(
                  job.payment ?? 0
                ).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-500 text-sm">
                Duration
              </p>

              <p className="font-semibold text-gray-800 mt-1">
                {job.duration ?? "Not specified"} minutes
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-500 text-sm">
                Status
              </p>

              <p className="font-semibold text-blue-600 mt-1 capitalize">
                {isInterview ? "Open" : job.status}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Audio
          </h2>

          <audio
            controls
            className="w-full"
            src={job.audio_url}
          >
            Your browser does not support audio playback.
          </audio>

          <p className="text-gray-500 text-sm mt-3">
            Listen carefully to the audio and type the transcription below.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-800">
            Your Transcription
          </h2>

          <p className="text-gray-500 mt-2">
            Type the complete transcription in the box below.
          </p>

          <textarea
            value={transcript}
            onChange={(e) =>
              setTranscript(e.target.value)
            }
            placeholder="Listen to the audio and type the transcription here..."
            rows={16}
            disabled={submitting}
            className="w-full border border-gray-300 rounded-xl p-5 mt-5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y disabled:bg-gray-100"
          />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
            <p className="text-gray-500 text-sm">
              {transcript.trim().length} characters
            </p>

            <button
              onClick={submitTranscript}
              disabled={
                submitting ||
                !transcript.trim()
              }
              className={`text-white px-8 py-3 rounded-lg font-bold ${
                isInterview
                  ? "bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400"
                  : "bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
              }`}
            >
              {submitting
                ? "Submitting..."
                : isInterview
                ? "Submit Interview Test"
                : "Submit Transcription"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function TranscriptionPage() {
  return (
    <Suspense
      fallback={
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
      }
    >
      <TranscriptionContent />
    </Suspense>
  );
}