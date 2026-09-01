"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Earning = {
  id: string;
  job_id: string;
  amount: number;
  job_title: string;
};

type Withdrawal = {
  id: string;
  amount: number;
  status: string;
};

export default function EarningsPage() {
  const router = useRouter();

  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const totalEarned = earnings.reduce(
    (sum, earning) => sum + earning.amount,
    0
  );

  const totalWithdrawn = withdrawals
    .filter((withdrawal) => withdrawal.status === "approved")
    .reduce(
      (sum, withdrawal) =>
        sum + Number(withdrawal.amount || 0),
      0
    );

  const availableBalance = Math.max(
    totalEarned - totalWithdrawn,
    0
  );

  useEffect(() => {
    loadEarnings();
  }, []);

  async function loadEarnings() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const {
      data: submissions,
      error: submissionError,
    } = await supabase
      .from("submissions")
      .select(
        "id, job_id, worker_id, status"
      )
      .eq("worker_id", user.id)
      .eq("status", "approved");

    if (submissionError) {
      console.error(
        "EARNINGS SUBMISSIONS ERROR:",
        submissionError
      );

      setLoading(false);
      return;
    }

    const approvedSubmissions =
      submissions || [];

    if (approvedSubmissions.length > 0) {
      const jobIds =
        approvedSubmissions.map(
          (submission) =>
            submission.job_id
        );

            const {
        data: jobs,
        error: jobsError,
      } = await supabase
        .from("jobs")
        .select("id, title, payment")
        .in("id", jobIds);

      if (jobsError) {
        console.error(
          "EARNINGS JOBS ERROR:",
          jobsError.message,
          jobsError.details,
          jobsError.hint
        );

        setEarnings([]);
      } else {
        const earningList: Earning[] =
          (jobs || []).map((job) => ({
            id: String(job.id),
            job_id: String(job.id),
            amount: Number(job.payment ?? 0),
            job_title:
              job.title || "Transcription Job",
          }));

        setEarnings(earningList);
      }
      setEarnings([]);
    }

    const {
      data: withdrawalData,
      error: withdrawalError,
    } = await supabase
      .from("withdrawals")
      .select(
        "id, amount, status"
      )
      .eq(
        "worker_id",
        user.id
      );

    if (withdrawalError) {
      console.error(
        "WITHDRAWALS ERROR:",
        withdrawalError
      );
    }

    setWithdrawals(
      (withdrawalData ||
        []) as Withdrawal[]
    );

    setLoading(false);
  }

  async function refresh() {
    setRefreshing(true);
    await loadEarnings();
    setRefreshing(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow">
          <p className="text-gray-600">
            Loading earnings...
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
                Earnings
              </p>
            </div>

            <nav className="flex flex-wrap gap-2">

              <button
                onClick={() =>
                  router.push("/worker")
                }
                className="hover:bg-blue-600 px-4 py-2 rounded-lg"
              >
                Dashboard
              </button>

              <button
                onClick={() =>
                  router.push("/worker#available-jobs")
                }
                className="hover:bg-blue-600 px-4 py-2 rounded-lg"
              >
                Jobs
              </button>

              <button
                onClick={() =>
                  router.push("/worker/earnings")
                }
                className="bg-white text-blue-700 px-4 py-2 rounded-lg font-semibold"
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

        {/* TITLE */}

        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">

          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              My Earnings
            </h2>

            <p className="text-gray-500 mt-2">
              Track your approved transcription earnings.
            </p>
          </div>

          <button
            onClick={refresh}
            disabled={refreshing}
            className="bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white px-5 py-3 rounded-lg font-semibold"
          >
            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

        </div>

        {/* SUMMARY CARDS */}

        <div className="grid md:grid-cols-3 gap-6 mb-8">

          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-green-500">

            <p className="text-gray-500">
              Total Earned
            </p>

            <p className="text-4xl font-bold text-green-600 mt-2">
              ${totalEarned.toFixed(2)}
            </p>

          </div>

          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500">

            <p className="text-gray-500">
              Total Withdrawn
            </p>

            <p className="text-4xl font-bold text-blue-600 mt-2">
              ${totalWithdrawn.toFixed(2)}
            </p>

          </div>

          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-purple-500">

            <p className="text-gray-500">
              Available Balance
            </p>

            <p className="text-4xl font-bold text-purple-600 mt-2">
              ${availableBalance.toFixed(2)}
            </p>

          </div>

        </div>

        {/* COMPLETED JOBS */}

        <div className="bg-white rounded-xl shadow p-6 mb-8">

          <div className="flex justify-between items-center mb-6">

            <div>
              <h2 className="text-2xl font-bold">
                Approved Earnings
              </h2>

              <p className="text-gray-500 mt-1">
                {earnings.length} approved job
                {earnings.length === 1
                  ? ""
                  : "s"}
              </p>
            </div>

          </div>

          {earnings.length === 0 ? (

            <div className="bg-gray-50 rounded-xl p-10 text-center">

              <div className="text-4xl mb-3">
                💰
              </div>

              <p className="text-gray-600 font-semibold">
                No approved earnings yet.
              </p>

              <p className="text-gray-400 mt-2">
                Complete transcription jobs and wait
                for admin approval.
              </p>

            </div>

          ) : (

            <div className="space-y-4">

              {earnings.map((earning) => (

                <div
                  key={earning.id}
                  className="border rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >

                  <div>

                    <h3 className="font-bold text-lg text-gray-800">
                      {earning.job_title}
                    </h3>

                    <p className="text-gray-500 text-sm mt-1">
                      Job ID:{" "}
                      {earning.job_id}
                    </p>

                  </div>

                  <div className="flex items-center gap-4">

                    <span className="bg-green-100 text-green-700 px-3 py-2 rounded-full text-sm font-semibold">
                      Approved
                    </span>

                    <p className="text-2xl font-bold text-green-600">
                      +$
                      {earning.amount.toFixed(
                        2
                      )}
                    </p>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

        {/* WITHDRAWAL SUMMARY */}

        <div className="bg-white rounded-xl shadow p-6">

          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">

            <div>

              <h2 className="text-xl font-bold">
                Ready to withdraw?
              </h2>

              <p className="text-gray-500 mt-1">
                Available balance:{" "}
                <span className="font-bold text-purple-600">
                  ${availableBalance.toFixed(2)}
                </span>
              </p>

            </div>

            <button
              onClick={() =>
                router.push(
                  "/worker/withdrawals"
                )
              }
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold"
            >
              Go to Withdrawals →
            </button>

          </div>

        </div>

      </section>

    </main>
  );
}