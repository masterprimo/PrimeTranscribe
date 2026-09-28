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
  job_type: string;
  status: string;
};

export default function AdminSubmissionsPage() {
  const router = useRouter();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [jobs, setJobs] = useState<Record<number, Job>>({});
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  async function checkAdminAccess() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/login");
      return;
    }

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError || !profile) {
      router.replace("/worker");
      return;
    }

    if (profile.role !== "admin") {
      router.replace("/worker");
      return;
    }

    loadSubmissions();
  }

  async function loadSubmissions() {
    setLoading(true);

    const {
      data: submissionData,
      error: submissionError,
    } = await supabase
      .from("submissions")
      .select(
        "id, job_id, worker_id, transcript, submitted_at, status"
      )
      .order("submitted_at", {
        ascending: false,
      });

    if (submissionError) {
      console.error(
        "LOAD SUBMISSIONS ERROR:",
        submissionError
      );

      alert(
        submissionError.message ||
          "Unable to load submissions."
      );

      setLoading(false);
      return;
    }

    const loadedSubmissions =
      (submissionData || []) as Submission[];

    setSubmissions(loadedSubmissions);

    const jobIds = Array.from(
      new Set(
        loadedSubmissions.map(
          (submission) => submission.job_id
        )
      )
    );

    if (jobIds.length === 0) {
      setJobs({});
      setLoading(false);
      return;
    }

    const {
      data: jobData,
      error: jobError,
    } = await supabase
      .from("jobs")
      .select(
        "id, title, payment, audio_url, job_type, status"
      )
      .in("id", jobIds);

    if (jobError) {
      console.error(
        "LOAD JOBS ERROR:",
        jobError
      );

      alert(
        jobError.message ||
          "Unable to load related jobs."
      );

      setLoading(false);
      return;
    }

    const jobMap: Record<number, Job> = {};

    (jobData || []).forEach((job) => {
      jobMap[Number(job.id)] = {
        id: Number(job.id),
        title: job.title,
        payment: job.payment,
        audio_url: job.audio_url,
        job_type: job.job_type || "regular",
        status: job.status,
      };
    });

    setJobs(jobMap);
    setLoading(false);
  }

  async function updateSubmissionStatus(
    submissionId: number,
    newStatus: "approved" | "rejected"
  ) {
    const submission = submissions.find(
      (item) => item.id === submissionId
    );

    if (!submission) {
      alert("Submission not found.");
      return;
    }

    const job = jobs[submission.job_id];

    if (!job) {
      alert("Related job could not be found.");
      return;
    }

    if (submission.status === newStatus) {
      return;
    }

    setProcessingId(submissionId);

    try {
      /*
       * First update the submission itself.
       */
      const {
        error: submissionError,
      } = await supabase
        .from("submissions")
        .update({
          status: newStatus,
        })
        .eq("id", submissionId);

      if (submissionError) {
        console.error(
          "UPDATE SUBMISSION ERROR:",
          submissionError
        );

        alert(
          submissionError.message ||
            "Unable to update submission."
        );

        setProcessingId(null);
        return;
      }

      /*
       * REGULAR JOB:
       *
       * The job becomes completed ONLY after
       * the admin approves the submission.
       *
       * Rejected submissions do not complete the job.
       */
      if (
        newStatus === "approved" &&
        job.job_type !== "interview"
      ) {
        const {
          error: jobUpdateError,
        } = await supabase
          .from("jobs")
          .update({
            status: "completed",
          })
          .eq("id", submission.job_id);

        if (jobUpdateError) {
          console.error(
            "UPDATE JOB STATUS ERROR:",
            jobUpdateError
          );

          alert(
            "Submission was approved, but the job could not be marked as completed."
          );

          setProcessingId(null);
          await loadSubmissions();
          return;
        }
      }

      /*
       * INTERVIEW TEST:
       *
       * Never mark the interview job completed.
       * Other workers must still be able to submit it.
       */

      alert(
        newStatus === "approved"
          ? "Submission approved successfully."
          : "Submission rejected successfully."
      );

      await loadSubmissions();
    } catch (error) {
      console.error(
        "UPDATE SUBMISSION STATUS ERROR:",
        error
      );

      alert(
        "Something went wrong while updating the submission."
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

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
                Admin Submission Management
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() =>
                  router.push("/admin")
                }
                className="bg-white text-blue-700 px-5 py-2 rounded-lg font-semibold hover:bg-gray-100"
              >
                Dashboard
              </button>

              <button
                onClick={() =>
                  router.push("/admin/jobs")
                }
                className="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-lg font-semibold"
              >
                Jobs
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

      <section className="max-w-7xl mx-auto p-6 md:p-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-800">
            Submissions
          </h2>

          <p className="text-gray-600 mt-2">
            Review worker submissions and approve or reject completed work.
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <h3 className="text-xl font-bold text-gray-800">
              Loading submissions...
            </h3>
          </div>
        ) : submissions.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <h3 className="text-xl font-bold text-gray-800">
              No submissions yet
            </h3>

            <p className="text-gray-500 mt-2">
              Worker submissions will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {submissions.map((submission) => {
              const job = jobs[submission.job_id];

              const isInterview =
                job?.job_type === "interview";

              return (
                <div
                  key={submission.id}
                  className="bg-white rounded-xl shadow p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            isInterview
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {isInterview
                            ? "INTERVIEW TEST"
                            : "REGULAR JOB"}
                        </span>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            submission.status ===
                            "approved"
                              ? "bg-green-100 text-green-700"
                              : submission.status ===
                                "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {submission.status.toUpperCase()}
                        </span>
                      </div>

                      <h3 className="text-2xl font-bold text-gray-800 mt-4">
                        {job?.title ||
                          `Job #${submission.job_id}`}
                      </h3>

                      <div className="grid md:grid-cols-2 gap-4 mt-5">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-gray-500 text-sm">
                            Submission ID
                          </p>

                          <p className="font-semibold text-gray-800 mt-1">
                            #{submission.id}
                          </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-gray-500 text-sm">
                            Job ID
                          </p>

                          <p className="font-semibold text-gray-800 mt-1">
                            #{submission.job_id}
                          </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-gray-500 text-sm">
                            Worker ID
                          </p>

                          <p className="font-semibold text-gray-800 mt-1 break-all text-sm">
                            {submission.worker_id}
                          </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-gray-500 text-sm">
                            Payment
                          </p>

                          <p className="font-bold text-green-600 text-xl mt-1">
                            $
                            {Number(
                              job?.payment ?? 0
                            ).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {submission.submitted_at && (
                        <p className="text-gray-500 text-sm mt-4">
                          Submitted:{" "}
                          {new Date(
                            submission.submitted_at
                          ).toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 lg:w-48">
                      {job?.audio_url && (
                        <a
                          href={job.audio_url}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-gray-800 hover:bg-gray-900 text-white px-5 py-3 rounded-lg font-semibold text-center"
                        >
                          Open Audio
                        </a>
                      )}

                      {submission.status ===
                        "pending" && (
                        <>
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
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-5 py-3 rounded-lg font-bold"
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
                            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-5 py-3 rounded-lg font-bold"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="text-lg font-bold text-gray-800 mb-3">
                      Worker Transcription
                    </h4>

                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 whitespace-pre-wrap text-gray-800 leading-relaxed">
                      {submission.transcript}
                    </div>
                  </div>

                  {isInterview && (
                    <div className="mt-5 bg-purple-50 border border-purple-200 rounded-xl p-4">
                      <p className="text-purple-800 text-sm">
                        <strong>Interview Test:</strong>{" "}
                        Approving this submission does not
                        close the interview test. Other
                        workers can still submit their own
                        tests independently.
                      </p>
                    </div>
                  )}

                  {!isInterview &&
                    submission.status ===
                      "pending" && (
                      <div className="mt-5 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <p className="text-yellow-800 text-sm">
                          <strong>Pending approval:</strong>{" "}
                          This job will remain active until
                          this submission is approved.
                        </p>
                      </div>
                    )}

                  {!isInterview &&
                    submission.status ===
                      "approved" && (
                      <div className="mt-5 bg-green-50 border border-green-200 rounded-xl p-4">
                        <p className="text-green-800 text-sm">
                          <strong>Completed:</strong>{" "}
                          This regular job was marked
                          completed after admin approval.
                        </p>
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}