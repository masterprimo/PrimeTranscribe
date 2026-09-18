"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Job = {
  id: number;
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

type Submission = {
  id: number;
  job_id: number;
  worker_id: string;
  transcript: string;
  submitted_at: string | null;
  status: string;
};

type Withdrawal = {
  id: number;
  worker_id: string;
  amount: number;
  paypal_email: string | null;
  status: string;
};

export default function WorkerPage() {
  const router = useRouter();

  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [submittedInterviewJobs, setSubmittedInterviewJobs] = useState<
    number[]
  >([]);

  const [earnings, setEarnings] = useState(0);
  const [completedJobs, setCompletedJobs] = useState(0);

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");

  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingJob, setAcceptingJob] = useState<number | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    initialize();
  }, []);

  async function initialize() {
    setLoading(true);

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      router.replace("/login");
      return;
    }

    setUserId(user.id);

    await Promise.all([
      loadJobs(user.id),
      loadEarnings(user.id),
      loadWithdrawals(user.id),
      loadInterviewSubmissions(user.id),
    ]);

    setLoading(false);
  }

  async function refreshDashboard() {
    if (!userId) return;

    setRefreshing(true);

    await Promise.all([
      loadJobs(userId),
      loadEarnings(userId),
      loadWithdrawals(userId),
      loadInterviewSubmissions(userId),
    ]);

    setRefreshing(false);
  }

  async function loadJobs(currentUserId: string) {
    const {
      data: openJobs,
      error: openError,
    } = await supabase
      .from("jobs")
      .select(
        "id, title, description, audio_url, duration, payment, status, worker_id, job_type, created_at"
      )
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (openError) {
      console.error(
        "AVAILABLE JOBS ERROR:",
        JSON.stringify(openError, null, 2)
      );

      alert(
        `Unable to load available jobs: ${
          openError.message || "Unknown database error"
        }`
      );
    }

    setAvailableJobs((openJobs || []) as Job[]);

    const {
      data: workerJobs,
      error: workerError,
    } = await supabase
      .from("jobs")
      .select(
        "id, title, description, audio_url, duration, payment, status, worker_id, job_type, created_at"
      )
      .eq("worker_id", currentUserId)
      .order("created_at", { ascending: false });

    if (workerError) {
      console.error("MY JOBS ERROR:", workerError);
    }

    setMyJobs((workerJobs || []) as Job[]);
  }

  async function loadInterviewSubmissions(currentUserId: string) {
    const { data, error } = await supabase
      .from("submissions")
      .select("job_id")
      .eq("worker_id", currentUserId);

    if (error) {
      console.error(
        "INTERVIEW SUBMISSIONS ERROR:",
        error
      );
      return;
    }

    setSubmittedInterviewJobs(
      (data || []).map((submission) =>
        Number(submission.job_id)
      )
    );
  }

  async function loadEarnings(currentUserId: string) {
    const {
      data: submissions,
      error: submissionError,
    } = await supabase
      .from("submissions")
      .select(
        "id, job_id, worker_id, transcript, submitted_at, status"
      )
      .eq("worker_id", currentUserId);

    if (submissionError) {
      console.error(
        "SUBMISSIONS EARNINGS ERROR:",
        submissionError
      );

      setEarnings(0);
      setCompletedJobs(0);
      return;
    }

    const workerSubmissions =
      (submissions || []) as Submission[];

    if (workerSubmissions.length === 0) {
      setEarnings(0);
      setCompletedJobs(0);
      return;
    }

    const approvedSubmissions =
      workerSubmissions.filter(
        (submission) =>
          submission.status === "approved"
      );

    const approvedJobIds =
      approvedSubmissions.map(
        (submission) => submission.job_id
      );

    let totalApproved = 0;

    if (approvedJobIds.length > 0) {
      const {
        data: approvedJobs,
        error: approvedJobsError,
      } = await supabase
        .from("jobs")
        .select("id, payment")
        .in("id", approvedJobIds);

      if (approvedJobsError) {
        console.error(
          "APPROVED JOBS EARNINGS ERROR:",
          approvedJobsError
        );
      } else {
        totalApproved =
          (approvedJobs || []).reduce(
            (total, job) =>
              total + Number(job.payment ?? 0),
            0
          );
      }
    }

    setCompletedJobs(
      approvedSubmissions.length
    );

    const {
      data: approvedWithdrawals,
      error: withdrawalError,
    } = await supabase
      .from("withdrawals")
      .select("amount, status")
      .eq("worker_id", currentUserId)
      .eq("status", "approved");

    if (withdrawalError) {
      console.error(
        "EARNINGS WITHDRAWALS ERROR:",
        withdrawalError
      );

      setEarnings(totalApproved);
      return;
    }

    const totalWithdrawn =
      (approvedWithdrawals || []).reduce(
        (total, withdrawal) =>
          total + Number(withdrawal.amount || 0),
        0
      );

    setEarnings(
      Math.max(
        totalApproved - totalWithdrawn,
        0
      )
    );
  }

  async function loadWithdrawals(currentUserId: string) {
    const {
      data,
      error,
    } = await supabase
      .from("withdrawals")
      .select(
        "id, worker_id, amount, paypal_email, status"
      )
      .eq("worker_id", currentUserId)
      .order("id", {
        ascending: false,
      });

    if (error) {
      console.error(
        "WITHDRAWALS ERROR:",
        error
      );
      return;
    }

    setWithdrawals(
      (data || []) as Withdrawal[]
    );
  }

  async function acceptJob(jobId: number) {
    if (!userId) {
      alert("Please log in again.");
      return;
    }

    setAcceptingJob(jobId);

    const {
      data,
      error,
    } = await supabase
      .from("jobs")
      .update({
        status: "accepted",
        worker_id: userId,
      })
      .eq("id", jobId)
      .eq("status", "open")
      .eq("job_type", "regular")
      .select(
        "id, title, description, audio_url, duration, payment, status, worker_id, job_type, created_at"
      )
      .maybeSingle();

    if (error) {
      console.error(
        "ACCEPT JOB ERROR:",
        error
      );

      alert(
        error.message ||
          "Unable to accept job."
      );

      setAcceptingJob(null);
      return;
    }

    if (!data) {
      alert(
        "This job is no longer available. Please refresh."
      );

      await loadJobs(userId);
      setAcceptingJob(null);
      return;
    }

    alert(
      "Job accepted successfully!"
    );

    await loadJobs(userId);

    setAcceptingJob(null);
  }

  function openInterviewTest(jobId: number) {
    if (
      submittedInterviewJobs.includes(
        jobId
      )
    ) {
      alert(
        "You have already submitted this interview test."
      );
      return;
    }

    router.push(
      `/worker/transcriptions?jobId=${encodeURIComponent(
        String(jobId)
      )}`
    );
  }

  async function requestWithdrawal() {
    if (!userId) {
      alert("Please log in again.");
      return;
    }

    const amount = Number(
      withdrawAmount
    );

    if (!amount || amount <= 0) {
      alert(
        "Enter a valid withdrawal amount."
      );
      return;
    }

    if (amount > earnings) {
      alert(
        `You only have $${earnings.toFixed(
          2
        )} available.`
      );
      return;
    }

    if (!paypalEmail.trim()) {
      alert("Enter your PayPal email.");
      return;
    }

    if (!paypalEmail.includes("@")) {
      alert(
        "Enter a valid PayPal email."
      );
      return;
    }

    setWithdrawing(true);

    const { error } = await supabase
      .from("withdrawals")
      .insert({
        worker_id: userId,
        amount,
        paypal_email:
          paypalEmail.trim(),
        status: "pending",
      });

    if (error) {
      console.error(
        "WITHDRAWAL ERROR:",
        error
      );

      alert(
        error.message ||
          "Withdrawal request failed."
      );

      setWithdrawing(false);
      return;
    }

    alert(
      "Withdrawal request submitted successfully!"
    );

    setWithdrawAmount("");
    setPaypalEmail("");

    await loadWithdrawals(userId);
    await loadEarnings(userId);

    setWithdrawing(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  function openTranscription(jobId: number) {
    router.push(
      `/worker/transcriptions?jobId=${encodeURIComponent(
        String(jobId)
      )}`
    );
  }

  function getPayment(job: Job) {
    return Number(job.payment ?? 0);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <h1 className="text-xl font-bold text-gray-800">
            Prime Transcribe
          </h1>

          <p className="text-gray-500 mt-2">
            Loading Worker Dashboard...
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

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

            <div>
              <h1 className="text-2xl font-bold">
                Prime Transcribe
              </h1>

              <p className="text-blue-100 text-sm">
                Worker Portal
              </p>
            </div>

            <nav className="flex flex-wrap items-center gap-2">

              <button
                onClick={() =>
                  router.push("/worker")
                }
                className="bg-white text-blue-700 px-4 py-2 rounded-lg font-semibold"
              >
                Dashboard
              </button>

              <button
                onClick={() =>
                  document
                    .getElementById(
                      "available-jobs"
                    )
                    ?.scrollIntoView({
                      behavior: "smooth",
                    })
                }
                className="hover:bg-blue-600 px-4 py-2 rounded-lg"
              >
                Jobs
              </button>

              <button
                onClick={() =>
                  document
                    .getElementById(
                      "my-jobs"
                    )
                    ?.scrollIntoView({
                      behavior: "smooth",
                    })
                }
                className="hover:bg-blue-600 px-4 py-2 rounded-lg"
              >
                My Jobs
              </button>

              <button
                onClick={() =>
                  router.push(
                    "/worker/profile"
                  )
                }
                className="hover:bg-blue-600 px-4 py-2 rounded-lg"
              >
                Profile
              </button>

              <button
                onClick={() =>
                  router.push(
                    "/worker/earnings"
                  )
                }
                className="hover:bg-blue-600 px-4 py-2 rounded-lg"
              >
                Earnings
              </button>

              <button
                onClick={() =>
                  router.push(
                    "/worker/withdrawals"
                  )
                }
                className="hover:bg-blue-600 px-4 py-2 rounded-lg"
              >
                Withdrawals
              </button>

              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-semibold"
              >
                Logout
              </button>

            </nav>

          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto p-8">

        {/* WELCOME */}

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            Welcome, Worker
          </h2>

          <p className="text-gray-500 mt-2">
            Find transcription jobs, complete them, and earn money.
          </p>
        </div>

        {/* STATS */}

        <div className="grid md:grid-cols-3 gap-6 mb-8">

          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-gray-500">
              Available Jobs
            </p>

            <p className="text-4xl font-bold text-blue-600 mt-2">
              {availableJobs.length}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-gray-500">
              Approved Submissions
            </p>

            <p className="text-4xl font-bold text-green-600 mt-2">
              {completedJobs}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-gray-500">
              Available Earnings
            </p>

            <p className="text-4xl font-bold text-purple-600 mt-2">
              ${earnings.toFixed(2)}
            </p>
          </div>

        </div>

        {/* QUICK ACTIONS */}

        <div className="bg-white rounded-xl shadow p-6 mb-8">

          <h2 className="text-xl font-bold text-gray-800 mb-5">
            Quick Actions
          </h2>

          <div className="flex flex-wrap gap-3">

            <button
              onClick={() =>
                document
                  .getElementById(
                    "available-jobs"
                  )
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold"
            >
              Find Jobs
            </button>

            <button
              onClick={() =>
                router.push(
                  "/worker/profile"
                )
              }
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-lg font-semibold"
            >
              My Profile
            </button>

            <button
              onClick={() =>
                router.push(
                  "/worker/earnings"
                )
              }
              className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-lg font-semibold"
            >
              View Earnings
            </button>

            <button
              onClick={() =>
                router.push(
                  "/worker/withdrawals"
                )
              }
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg font-semibold"
            >
              Withdraw
            </button>

            <button
              onClick={refreshDashboard}
              disabled={refreshing}
              className="bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white px-5 py-3 rounded-lg font-semibold"
            >
              {refreshing
                ? "Refreshing..."
                : "Refresh Data"}
            </button>

          </div>
        </div>

        {/* WITHDRAW */}

        <div className="bg-white rounded-xl shadow p-6 mb-8">

          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">

            <div>
              <h2 className="text-2xl font-bold">
                Withdraw Earnings
              </h2>

              <p className="text-gray-500 mt-2">
                Request a payout using your PayPal email.
              </p>
            </div>

            <button
              onClick={() =>
                router.push(
                  "/worker/withdrawals"
                )
              }
              className="text-purple-600 font-semibold hover:underline"
            >
              View full history →
            </button>

          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 mb-6">

            <p className="text-gray-500">
              Available Balance
            </p>

            <p className="text-3xl font-bold text-purple-700">
              ${earnings.toFixed(2)}
            </p>

          </div>

          <div className="grid md:grid-cols-2 gap-5">

            <div>
              <label className="block font-semibold mb-2">
                Withdrawal Amount
              </label>

              <input
                type="number"
                min="1"
                step="0.01"
                value={withdrawAmount}
                onChange={(e) =>
                  setWithdrawAmount(
                    e.target.value
                  )
                }
                placeholder="Enter amount"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">
                PayPal Email
              </label>

              <input
                type="email"
                value={paypalEmail}
                onChange={(e) =>
                  setPaypalEmail(
                    e.target.value
                  )
                }
                placeholder="example@email.com"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

          </div>

          <button
            onClick={
              requestWithdrawal
            }
            disabled={
              withdrawing ||
              earnings <= 0
            }
            className="mt-5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-bold"
          >
            {withdrawing
              ? "Submitting..."
              : "Request Withdrawal"}
          </button>

        </div>

        {/* RECENT WITHDRAWALS */}

        <div className="bg-white rounded-xl shadow p-6 mb-8">

          <div className="flex justify-between items-center mb-6">

            <h2 className="text-2xl font-bold">
              Recent Withdrawals
            </h2>

            <button
              onClick={() =>
                router.push(
                  "/worker/withdrawals"
                )
              }
              className="text-blue-600 font-semibold hover:underline"
            >
              View All →
            </button>

          </div>

          {withdrawals.length ===
          0 ? (

            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <p className="text-gray-500">
                No withdrawal requests yet.
              </p>
            </div>

          ) : (

            <div className="space-y-4">

              {withdrawals
                .slice(0, 3)
                .map(
                  (withdrawal) => (

                    <div
                      key={
                        withdrawal.id
                      }
                      className="border rounded-xl p-5"
                    >

                      <div className="flex justify-between items-center gap-4">

                        <div>
                          <p className="text-2xl font-bold text-blue-600">
                            $
                            {Number(
                              withdrawal.amount
                            ).toFixed(2)}
                          </p>

                          <p className="text-gray-500 text-sm mt-1">
                            PayPal:{" "}
                            {withdrawal.paypal_email ||
                              "Not provided"}
                          </p>
                        </div>

                        <span
                          className={`px-4 py-2 rounded-full font-semibold ${
                            withdrawal.status ===
                            "approved"
                              ? "bg-green-100 text-green-700"
                              : withdrawal.status ===
                                "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {
                            withdrawal.status
                          }
                        </span>

                      </div>

                    </div>

                  )
                )}

            </div>

          )}

        </div>

        {/* AVAILABLE JOBS */}

        <div
          id="available-jobs"
          className="bg-white rounded-xl shadow p-6 mb-8"
        >

          <div className="flex justify-between items-center mb-6">

            <div>
              <h2 className="text-2xl font-bold">
                Available Jobs
              </h2>

              <p className="text-gray-500 mt-1">
                Regular jobs and interview tests available to you.
              </p>
            </div>

            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
              {availableJobs.length} jobs
            </span>

          </div>

          {availableJobs.length ===
          0 ? (

            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-500">
                No available jobs right now.
              </p>
            </div>

          ) : (

            <div className="space-y-4">

              {availableJobs.map(
                (job) => {

                  const isInterview =
                    job.job_type ===
                    "interview";

                  const alreadySubmitted =
                    submittedInterviewJobs.includes(
                      job.id
                    );

                  return (
                    <div
                      key={job.id}
                      className={`border rounded-xl p-5 ${
                        isInterview
                          ? "border-purple-300 bg-purple-50"
                          : ""
                      }`}
                    >

                      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-5">

                        <div className="flex-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <h3 className="text-xl font-bold">
                              {job.title}
                            </h3>

                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                isInterview
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {isInterview
                                ? "INTERVIEW TEST"
                                : "REGULAR JOB"}
                            </span>

                          </div>

                          {job.description && (
                            <p className="text-gray-500 mt-2">
                              {
                                job.description
                              }
                            </p>
                          )}

                          <p className="text-gray-500 mt-2">
                            Duration:{" "}
                            {job.duration ??
                              "Not specified"}{" "}
                            seconds
                          </p>

                          <p className="text-blue-600 font-bold mt-2">
                            Payment: $
                            {getPayment(
                              job
                            ).toFixed(2)}
                          </p>

                          {isInterview && (
                            <p className="text-purple-700 font-semibold mt-2">
                              Complete this test to qualify for Prime Transcribe work.
                            </p>
                          )}

                        </div>

                        {isInterview ? (

                          <button
                            onClick={() =>
                              openInterviewTest(
                                job.id
                              )
                            }
                            disabled={
                              alreadySubmitted
                            }
                            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-bold"
                          >
                            {alreadySubmitted
                              ? "Test Submitted"
                              : "Take Interview Test"}
                          </button>

                        ) : (

                          <button
                            onClick={() =>
                              acceptJob(
                                job.id
                              )
                            }
                            disabled={
                              acceptingJob ===
                              job.id
                            }
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-bold"
                          >
                            {acceptingJob ===
                            job.id
                              ? "Accepting..."
                              : "Accept Job"}
                          </button>

                        )}

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          )}

        </div>

        {/* MY JOBS */}

        <div
          id="my-jobs"
          className="bg-white rounded-xl shadow p-6"
        >

          <div className="flex justify-between items-center mb-6">

            <h2 className="text-2xl font-bold">
              My Jobs
            </h2>

            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
              {myJobs.length} jobs
            </span>

          </div>

          {myJobs.length ===
          0 ? (

            <div className="bg-gray-50 rounded-lg p-8 text-center">

              <p className="text-gray-500">
                You have not accepted any jobs yet.
              </p>

              <button
                onClick={() =>
                  document
                    .getElementById(
                      "available-jobs"
                    )
                    ?.scrollIntoView({
                      behavior:
                        "smooth",
                    })
                }
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold"
              >
                Find Available Jobs
              </button>

            </div>

          ) : (

            <div className="space-y-4">

              {myJobs.map(
                (job) => (

                  <div
                    key={job.id}
                    className="border rounded-xl p-5"
                  >

                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-5">

                      <div>

                        <h3 className="text-xl font-bold">
                          {job.title}
                        </h3>

                        {job.description && (
                          <p className="text-gray-500 mt-2">
                            {
                              job.description
                            }
                          </p>
                        )}

                        <p className="text-gray-500 mt-2">
                          Duration:{" "}
                          {job.duration ??
                            "Not specified"}{" "}
                          seconds
                        </p>

                        <p className="text-blue-600 font-bold mt-2">
                          Payment: $
                          {getPayment(
                            job
                          ).toFixed(2)}
                        </p>

                      </div>

                      <div className="flex flex-col items-start md:items-end gap-3">

                        {job.status ===
                          "accepted" && (
                          <>
                            <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-semibold">
                              Accepted
                            </span>

                            <button
                              onClick={() =>
                                openTranscription(
                                  job.id
                                )
                              }
                              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold"
                            >
                              Open & Transcribe
                            </button>
                          </>
                        )}

                        {job.status ===
                          "completed" && (
                          <>
                            <span className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full font-semibold">
                              Completed
                            </span>

                            <span className="bg-yellow-50 text-yellow-700 px-4 py-2 rounded-lg text-sm">
                              Submission under review
                            </span>
                          </>
                        )}

                        {job.status ===
                          "open" && (
                          <span className="bg-gray-100 text-gray-600 px-4 py-2 rounded-full font-semibold">
                            Open
                          </span>
                        )}

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>

      </section>

    </main>
  );
}