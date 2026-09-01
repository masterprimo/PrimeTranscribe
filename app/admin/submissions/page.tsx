"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Submission = {
  id: number;
  job_id: number;
  worker_id: string;
  transcript: string;
  submitted_at: string | null;
  status: string;
};

type Job = {
  id: number;
  title: string;
  payment: number | null;
  audio_url: string | null;
};

export default function AdminSubmissionsPage() {
  const router = useRouter();

  const [submissions, setSubmissions] =
    useState<Submission[]>([]);

  const [jobs, setJobs] =
    useState<Record<string, Job>>({});

  const [loading, setLoading] = useState(true);

  const [processingId, setProcessingId] =
    useState<number | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  async function checkAdminAccess() {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/login");
      return;
    }

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error(
        "PROFILE ERROR:",
        profileError
      );

      alert(profileError.message);
      setLoading(false);
      return;
    }

    if (!profile || profile.role !== "admin") {
      router.replace("/worker");
      return;
    }

    await loadSubmissions();
  }

  async function loadSubmissions() {
    setLoading(true);

    const {
      data,
      error,
    } = await supabase
      .from("submissions")
      .select(
        "id, job_id, worker_id, transcript, submitted_at, status"
      )
      .order("submitted_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "SUBMISSIONS LOAD ERROR:",
        error
      );

      alert(
        error.message ||
          "Unable to load submissions."
      );

      setLoading(false);
      return;
    }

    const submissionList =
      (data || []) as Submission[];

    setSubmissions(submissionList);

    if (submissionList.length > 0) {
      const jobIds = submissionList.map(
        (submission) => submission.job_id
      );

      const {
        data: jobData,
        error: jobError,
      } = await supabase
        .from("jobs")
        .select(
          "id, title, payment, audio_url"
        )
        .in("id", jobIds);

      if (jobError) {
        console.error(
          "JOBS LOAD ERROR:",
          jobError
        );
      }

      const jobMap: Record<string, Job> = {};

      (jobData || []).forEach(
        (job: Job) => {
          jobMap[String(job.id)] = job;
        }
      );

      setJobs(jobMap);
    }

    setLoading(false);
  }

  async function updateSubmissionStatus(
    submissionId: number,
    newStatus: "approved" | "rejected"
  ) {
    if (processingId !== null) {
      return;
    }

    const action =
      newStatus === "approved"
        ? "approve"
        : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this submission?`
    );

    if (!confirmed) {
      return;
    }

    setProcessingId(submissionId);

    const {
      error,
    } = await supabase
      .from("submissions")
      .update({
        status: newStatus,
      })
      .eq("id", submissionId);

    if (error) {
      console.error(
        "STATUS UPDATE ERROR:",
        error
      );

      alert(
        error.message ||
          `Unable to ${action} submission.`
      );

      setProcessingId(null);
      return;
    }

    alert(
      newStatus === "approved"
        ? "Submission approved successfully."
        : "Submission rejected successfully."
    );

    await loadSubmissions();

    setProcessingId(null);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow p-8">
          <p className="text-gray-600">
            Loading submissions...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">

      {/* HEADER */}

      <header className="bg-blue-700 text-white shadow-lg">

        <div className="max-w-7xl mx-auto px-6 py-5">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>
              <h1 className="text-2xl font-bold">
                Prime Transcribe
              </h1>

              <p className="text-blue-100">
                Submission Review
              </p>
            </div>

            <div className="flex gap-3">

              <button
                onClick={() =>
                  router.push("/admin")
                }
                className="bg-white text-blue-700 px-5 py-2 rounded-lg font-semibold"
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

      {/* CONTENT */}

      <section className="max-w-7xl mx-auto p-6 md:p-8">

        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">

          <div>

            <h2 className="text-3xl font-bold text-gray-800">
              Submission Review
            </h2>

            <p className="text-gray-500 mt-2">
              Review worker transcription submissions.
            </p>

          </div>

          <button
            onClick={loadSubmissions}
            className="bg-gray-800 hover:bg-gray-900 text-white px-5 py-3 rounded-lg font-semibold"
          >
            Refresh
          </button>

        </div>

        {submissions.length === 0 ? (

          <div className="bg-white rounded-xl shadow p-10 text-center">

            <h3 className="text-xl font-bold text-gray-700">
              No submissions yet
            </h3>

            <p className="text-gray-500 mt-2">
              Worker submissions will appear here.
            </p>

          </div>

        ) : (

          <div className="space-y-6">

            {submissions.map(
              (submission) => {

                const job =
                  jobs[
                    String(
                      submission.job_id
                    )
                  ];

                return (
                  <div
                    key={submission.id}
                    className="bg-white rounded-xl shadow p-6"
                  >

                    {/* TOP */}

                    <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-6">

                      <div>

                        <h3 className="text-xl font-bold text-gray-800">
                          {job?.title ||
                            `Job #${submission.job_id}`}
                        </h3>

                        <p className="text-gray-500 mt-1">
                          Submission #{submission.id}
                        </p>

                        <p className="text-gray-500 text-sm mt-1">
                          Worker:{" "}
                          {submission.worker_id}
                        </p>

                      </div>

                      <div>

                        {submission.status ===
                          "pending" && (
                          <span className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full font-semibold">
                            Awaiting Review
                          </span>
                        )}

                        {submission.status ===
                          "approved" && (
                          <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold">
                            Approved
                          </span>
                        )}

                        {submission.status ===
                          "rejected" && (
                          <span className="bg-red-100 text-red-700 px-4 py-2 rounded-full font-semibold">
                            Rejected
                          </span>
                        )}

                      </div>

                    </div>

                    {/* AUDIO */}

                    {job?.audio_url && (
                      <div className="mb-6">

                        <p className="font-semibold text-gray-700 mb-2">
                          Audio
                        </p>

                        <audio
                          controls
                          src={job.audio_url}
                          className="w-full"
                        />

                      </div>
                    )}

                    {/* TRANSCRIPT */}

                    <div className="mb-6">

                      <p className="font-semibold text-gray-700 mb-2">
                        Worker Transcription
                      </p>

                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 whitespace-pre-wrap text-gray-800 min-h-[120px]">
                        {submission.transcript}
                      </div>

                    </div>

                    {/* PAYMENT */}

                    {job && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">

                        <p className="text-gray-500 text-sm">
                          Job Payment
                        </p>

                        <p className="text-2xl font-bold text-blue-700">
                          $
                          {Number(
                            job.payment ?? 0
                          ).toFixed(2)}
                        </p>

                      </div>
                    )}

                    {/* ACTIONS */}

                    {submission.status ===
                      "pending" && (

                      <div className="flex flex-col sm:flex-row gap-3">

                        <button
                          onClick={() =>
                            updateSubmissionStatus(
                              submission.id,
                              "approved"
                            )
                          }
                          disabled={
                            processingId ===
                            submission.id
                          }
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-bold"
                        >
                          {processingId ===
                          submission.id
                            ? "Processing..."
                            : "Approve"}
                        </button>

                        <button
                          onClick={() =>
                            updateSubmissionStatus(
                              submission.id,
                              "rejected"
                            )
                          }
                          disabled={
                            processingId ===
                            submission.id
                          }
                          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-bold"
                        >
                          {processingId ===
                          submission.id
                            ? "Processing..."
                            : "Reject"}
                        </button>

                      </div>

                    )}

                    {/* DATE */}

                    {submission.submitted_at && (
                      <p className="text-gray-400 text-sm mt-5">
                        Submitted:{" "}
                        {new Date(
                          submission.submitted_at
                        ).toLocaleString()}
                      </p>
                    )}

                  </div>
                );
              }
            )}

          </div>

        )}

      </section>

    </main>
  );
}