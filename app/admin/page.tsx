"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Stats = {
  totalJobs: number;
  openJobs: number;
  totalSubmissions: number;
  totalWithdrawals: number;
  pendingWithdrawals: number;
  approvedWithdrawals: number;
};

export default function AdminDashboard() {
  const router = useRouter();

  const [stats, setStats] = useState<Stats>({
    totalJobs: 0,
    openJobs: 0,
    totalSubmissions: 0,
    totalWithdrawals: 0,
    pendingWithdrawals: 0,
    approvedWithdrawals: 0,
  });

  const [loading, setLoading] = useState(true);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    initialize();
  }, []);

  async function initialize() {
    setCheckingAccess(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("ADMIN USER ERROR:", userError);
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
          "ADMIN PROFILE ERROR:",
          profileError
        );

        alert(
          profileError.message ||
            "Unable to check admin access."
        );

        return;
      }

      if (!profile) {
        alert("Admin profile not found.");
        return;
      }

      if (profile.role !== "admin") {
        router.replace("/worker");
        return;
      }

      setCheckingAccess(false);

      await loadStats();
    } catch (error) {
      console.error(
        "ADMIN INITIALIZATION ERROR:",
        error
      );
    } finally {
      setCheckingAccess(false);
      setLoading(false);
    }
  }

  async function loadStats() {
    setLoading(true);

    try {
      // JOBS
      const {
        data: jobs,
        error: jobsError,
      } = await supabase
        .from("jobs")
        .select("id, status");

      if (jobsError) {
        console.error(
          "ADMIN JOBS ERROR:",
          jobsError
        );
      }

      const jobList = jobs || [];

      // SUBMISSIONS
      // IMPORTANT:
      // submissions does NOT currently have a status column.
      const {
        data: submissions,
        error: submissionsError,
      } = await supabase
        .from("submissions")
        .select("id");

      if (submissionsError) {
        console.error(
          "ADMIN SUBMISSIONS ERROR:",
          submissionsError
        );
      }

      const submissionList =
        submissions || [];

      // WITHDRAWALS
      const {
        data: withdrawals,
        error: withdrawalsError,
      } = await supabase
        .from("withdrawals")
        .select("id, status");

      if (withdrawalsError) {
        console.error(
          "ADMIN WITHDRAWALS ERROR:",
          withdrawalsError
        );
      }

      const withdrawalList =
        withdrawals || [];

      setStats({
        totalJobs: jobList.length,

        openJobs: jobList.filter(
          (job) =>
            job.status === "open"
        ).length,

        totalSubmissions:
          submissionList.length,

        totalWithdrawals:
          withdrawalList.length,

        pendingWithdrawals:
          withdrawalList.filter(
            (withdrawal) =>
              withdrawal.status ===
              "pending"
          ).length,

        approvedWithdrawals:
          withdrawalList.filter(
            (withdrawal) =>
              withdrawal.status ===
              "approved"
          ).length,
      });
    } catch (error) {
      console.error(
        "ADMIN STATS ERROR:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (checkingAccess) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <h1 className="text-xl font-bold text-gray-800">
            Checking admin access...
          </h1>

          <p className="text-gray-500 mt-2">
            Please wait.
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
              <h1 className="text-3xl font-bold">
                Prime Transcribe
              </h1>

              <p className="text-blue-100 mt-1">
                Admin Dashboard
              </p>
            </div>

            <div className="flex flex-wrap gap-3">

              <button
                onClick={loadStats}
                disabled={loading}
                className="bg-white text-blue-700 px-5 py-2 rounded-lg font-semibold hover:bg-gray-100 disabled:opacity-60"
              >
                {loading
                  ? "Refreshing..."
                  : "Refresh"}
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

      <section className="max-w-7xl mx-auto p-8">

        <div className="mb-8">

          <h2 className="text-3xl font-bold text-gray-800">
            Welcome, Admin
          </h2>

          <p className="text-gray-500 mt-2">
            Manage jobs, submissions and worker withdrawals.
          </p>

        </div>

        {/* STATISTICS */}

        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-5 mb-8">

          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-gray-500 text-sm">
              Total Jobs
            </p>

            <p className="text-3xl font-bold text-blue-600 mt-2">
              {stats.totalJobs}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-gray-500 text-sm">
              Open Jobs
            </p>

            <p className="text-3xl font-bold text-green-600 mt-2">
              {stats.openJobs}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-gray-500 text-sm">
              Submissions
            </p>

            <p className="text-3xl font-bold text-purple-600 mt-2">
              {stats.totalSubmissions}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-gray-500 text-sm">
              Withdrawals
            </p>

            <p className="text-3xl font-bold text-blue-600 mt-2">
              {stats.totalWithdrawals}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-gray-500 text-sm">
              Pending
            </p>

            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {stats.pendingWithdrawals}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-gray-500 text-sm">
              Approved
            </p>

            <p className="text-3xl font-bold text-green-600 mt-2">
              {stats.approvedWithdrawals}
            </p>
          </div>

        </div>

        {/* MANAGEMENT */}

        <div className="grid md:grid-cols-3 gap-6">

          {/* JOBS */}

          <div className="bg-white rounded-xl shadow p-6">

            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-5">
              <span className="text-2xl">
                Jobs
              </span>
            </div>

            <h2 className="text-xl font-bold text-gray-800">
              Manage Jobs
            </h2>

            <p className="text-gray-500 mt-2 mb-5">
              Create, edit and manage transcription jobs.
            </p>

            <button
              onClick={() =>
                router.push(
                  "/admin/jobs"
                )
              }
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold"
            >
              Manage Jobs
            </button>

          </div>

          {/* SUBMISSIONS */}

          <div className="bg-white rounded-xl shadow p-6">

            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-5">
              <span className="text-2xl">
                Review
              </span>
            </div>

            <h2 className="text-xl font-bold text-gray-800">
              Submission Review
            </h2>

            <p className="text-gray-500 mt-2 mb-5">
              Review worker transcription submissions.
            </p>

            <button
              onClick={() =>
                router.push(
                  "/admin/submissions"
                )
              }
              className="w-full bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-lg font-semibold"
            >
              Manage Submissions
            </button>

          </div>

          {/* WITHDRAWALS */}

          <div className="bg-white rounded-xl shadow p-6">

            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-5">
              <span className="text-2xl">
                Pay
              </span>
            </div>

            <h2 className="text-xl font-bold text-gray-800">
              Withdrawals
            </h2>

            <p className="text-gray-500 mt-2 mb-5">
              Review and manage worker withdrawal requests.
            </p>

            <button
              onClick={() =>
                router.push(
                  "/admin/withdrawals"
                )
              }
              className="w-full bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg font-semibold"
            >
              Manage Withdrawals
            </button>

          </div>

        </div>

      </section>

    </main>
  );
}