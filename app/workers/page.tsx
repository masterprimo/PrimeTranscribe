
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Job = {
  id: string;
  title: string;
  audio_url: string;
  payment: number;
  status: string;
  worker_id: string | null;
};

type Submission = {
  id: string;
  job_id: string;
  worker_id: string;
  transcript: string;
  status: string;
};

type Withdrawal = {
  id: string;
  worker_id: string;
  amount: number;
  status: string;
};

export default function WorkerPage() {
  const router = useRouter();

  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [earnings, setEarnings] = useState(0);
  const [completedJobs, setCompletedJobs] = useState(0);

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setUserId(user.id);

    await loadJobs(user.id);
    await loadEarnings(user.id);
    await loadWithdrawals(user.id);
  }

  async function loadJobs(currentUserId: string) {
    const { data: openJobs, error: openError } =
      await supabase
        .from("jobs")
        .select("*")
        .eq("status", "open");

    if (openError) {
      console.error("OPEN JOBS ERROR:", openError);
    }

    setAvailableJobs(openJobs || []);

    const { data: workerJobs, error: workerError } =
      await supabase
        .from("jobs")
        .select("*")
        .eq("worker_id", currentUserId)
        .order("created_at", { ascending: false });

    if (workerError) {
      console.error("MY JOBS ERROR:", workerError);
    }

    setMyJobs(workerJobs || []);
  }

  async function loadEarnings(currentUserId: string) {
    // Get approved submissions
    const { data: submissions, error: submissionError } =
      await supabase
        .from("submissions")
        .select(
          "id, job_id, worker_id, transcript, status"
        )
        .eq("worker_id", currentUserId)
        .eq("status", "approved");

    if (submissionError) {
      console.error(
        "EARNINGS ERROR:",
        submissionError
      );
      return;
    }

    const approvedSubmissions =
      (submissions || []) as Submission[];

    setCompletedJobs(
      approvedSubmissions.length
    );

    // Calculate total approved earnings
    let totalEarnings = 0;

    if (approvedSubmissions.length > 0) {
      const jobIds = approvedSubmissions.map(
        (submission) => submission.job_id
      );

      const { data: jobs, error: jobsError } =
        await supabase
          .from("jobs")
          .select("id, payment")
          .in("id", jobIds);

      if (jobsError) {
        console.error(
          "PAYMENT ERROR:",
          jobsError
        );
        return;
      }

      totalEarnings = (jobs || []).reduce(
        (sum, job) =>
          sum + Number(job.payment || 0),
        0
      );
    }

    // Get approved withdrawals
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
        "APPROVED WITHDRAWALS ERROR:",
        withdrawalError
      );
      return;
    }

    // Calculate total amount already withdrawn
    const totalWithdrawn =
      (approvedWithdrawals || []).reduce(
        (sum, withdrawal) =>
          sum + Number(withdrawal.amount || 0),
        0
      );

    // Available balance
    const availableBalance =
      totalEarnings - totalWithdrawn;

    setEarnings(
      Math.max(availableBalance, 0)
    );
  }

  async function loadWithdrawals(
    currentUserId: string
  ) {
    const { data, error } = await supabase
      .from("withdrawals")
      .select(
        "id, worker_id, amount, status"
      )
      .eq("worker_id", currentUserId);

    if (error) {
      console.error(
        "WITHDRAWALS LOAD ERROR:",
        error
      );
      return;
    }

    setWithdrawals(data || []);
  }

  async function acceptJob(jobId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please login first.");
      return;
    }

    const { error } = await supabase
      .from("jobs")
      .update({
        status: "accepted",
        worker_id: user.id,
      })
      .eq("id", jobId);

    if (error) {
      console.error(
        "ACCEPT JOB ERROR:",
        error
      );
      alert(error.message);
      return;
    }

    alert("Job accepted!");

    await loadJobs(user.id);
  }

  async function requestWithdrawal() {
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

    if (!userId) {
      alert(
        "User not found. Please login again."
      );
      return;
    }

    const { data, error } =
      await supabase
        .from("withdrawals")
        .insert({
          worker_id: userId,
          amount: amount,
          status: "pending",
        })
        .select();

    if (error) {
      console.error(
        "WITHDRAWAL ERROR:",
        error
      );
      console.error(
        "MESSAGE:",
        error.message
      );
      console.error(
        "DETAILS:",
        error.details
      );
      console.error(
        "HINT:",
        error.hint
      );
      console.error(
        "CODE:",
        error.code
      );

      alert(
        `Withdrawal failed:\n${
          error.message ||
          "Unknown Supabase error"
        }`
      );

      return;
    }

    console.log(
      "WITHDRAWAL CREATED:",
      data
    );

    alert(
      "Withdrawal request submitted successfully!"
    );

    setWithdrawAmount("");

    await loadWithdrawals(userId);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-gray-100">

      {/* HEADER */}

      <header className="bg-blue-600 text-white p-6 flex justify-between items-center">

        <h1 className="text-2xl font-bold">
          Prime Transcribe Worker Dashboard
        </h1>

        <button
          onClick={logout}
          className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold"
        >
          Logout
        </button>

      </header>

      <section className="p-8">

        <h2 className="text-3xl font-bold mb-6">
          Welcome, Worker 👋
        </h2>

        {/* DASHBOARD CARDS */}

        <div className="grid md:grid-cols-3 gap-6">

          {/* AVAILABLE JOBS */}

          <div className="bg-white rounded-xl shadow p-6">

            <h3 className="text-gray-500">
              Available Jobs
            </h3>

            <p className="text-4xl font-bold text-blue-600 mt-2">
              {availableJobs.length}
            </p>

          </div>

          {/* COMPLETED JOBS */}

          <div className="bg-white rounded-xl shadow p-6">

            <h3 className="text-gray-500">
              Completed Jobs
            </h3>

            <p className="text-4xl font-bold text-green-600 mt-2">
              {completedJobs}
            </p>

          </div>

          {/* EARNINGS */}

          <div className="bg-white rounded-xl shadow p-6">

            <h3 className="text-gray-500">
              Available Earnings
            </h3>

            <p className="text-4xl font-bold text-purple-600 mt-2">
              ${earnings.toFixed(2)}
            </p>

          </div>

        </div>

        {/* WITHDRAW EARNINGS */}

        <div className="bg-purple-50 border-2 border-purple-300 rounded-xl shadow p-6 mt-8 mb-8">

          <h2 className="text-2xl font-bold text-purple-700 mb-3">
            Withdraw Earnings
          </h2>

          <p className="text-gray-700 mb-4">

            Available balance:

            <strong className="text-purple-700 ml-2">
              ${earnings.toFixed(2)}
            </strong>

          </p>

          <div className="flex flex-col md:flex-row gap-3">

            <input
              type="number"
              min="1"
              step="0.01"
              placeholder="Enter amount"
              value={withdrawAmount}
              onChange={(e) =>
                setWithdrawAmount(
                  e.target.value
                )
              }
              className="border border-gray-300 rounded-lg p-3 bg-white flex-1"
            />

            <button
              onClick={requestWithdrawal}
              disabled={earnings <= 0}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-bold"
            >
              Request Withdrawal
            </button>

          </div>

          {earnings <= 0 && (
            <p className="text-red-600 mt-3">
              You do not have available earnings
              to withdraw.
            </p>
          )}

        </div>

        {/* WITHDRAWAL HISTORY */}

        <div className="bg-white rounded-xl shadow p-6 mb-8">

          <h2 className="text-2xl font-bold mb-4">
            Withdrawal History
          </h2>

          {withdrawals.length === 0 ? (

            <p className="text-gray-500">
              No withdrawal requests yet.
            </p>

          ) : (

            withdrawals.map(
              (withdrawal) => (

                <div
                  key={withdrawal.id}
                  className="border rounded-lg p-4 mb-3 flex justify-between items-center"
                >

                  <div>

                    <p className="font-bold">
                      $
                      {Number(
                        withdrawal.amount
                      ).toFixed(2)}
                    </p>

                    <p className="text-gray-500">
                      Withdrawal request
                    </p>

                  </div>

                  <span
                    className={`font-semibold ${
                      withdrawal.status ===
                      "approved"
                        ? "text-green-600"
                        : withdrawal.status ===
                          "rejected"
                        ? "text-red-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {withdrawal.status}
                  </span>

                </div>

              )
            )

          )}

        </div>

        {/* AVAILABLE JOBS */}

        <div className="bg-white rounded-xl shadow p-6 mb-8">

          <h2 className="text-2xl font-bold mb-4">
            Available Jobs
          </h2>

          {availableJobs.length === 0 ? (

            <p className="text-gray-500">
              No available jobs.
            </p>

          ) : (

            availableJobs.map((job) => (

              <div
                key={job.id}
                className="border rounded-lg p-4 mb-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4"
              >

                <div>

                  <h3 className="font-bold text-lg">
                    {job.title}
                  </h3>

                  <p className="text-gray-500 break-all">
                    {job.audio_url}
                  </p>

                  <p className="text-blue-600 font-semibold">
                    Payment: ${job.payment}
                  </p>

                </div>

                <button
                  onClick={() =>
                    acceptJob(job.id)
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
                >
                  Accept Job
                </button>

              </div>

            ))

          )}

        </div>

        {/* MY JOBS */}

        <div className="bg-white rounded-xl shadow p-6">

          <h2 className="text-2xl font-bold mb-4">
            My Jobs
          </h2>

          {myJobs.length === 0 ? (

            <p className="text-gray-500">
              You haven't accepted any jobs yet.
            </p>

          ) : (

            myJobs.map((job) => (

              <div
                key={job.id}
                className="border rounded-lg p-4 mb-4"
              >

                <h3 className="font-bold text-lg">
                  {job.title}
                </h3>

                <p className="text-gray-500 break-all mt-1">
                  {job.audio_url}
                </p>

                <p className="font-semibold mt-3">
                  Status:{" "}

                  <span
                    className={
                      job.status ===
                      "completed"
                        ? "text-green-600"
                        : "text-yellow-600"
                    }
                  >
                    {job.status}
                  </span>

                </p>

                <p className="text-blue-600 font-semibold mt-1">
                  Payment: ${job.payment}
                </p>

                {job.status ===
                  "completed" && (

                  <div className="mt-3 bg-green-100 text-green-700 p-3 rounded-lg font-semibold">
                    ✓ Completed and approved
                  </div>

                )}

              </div>

            ))

          )}

        </div>

      </section>

    </main>
  );
}
