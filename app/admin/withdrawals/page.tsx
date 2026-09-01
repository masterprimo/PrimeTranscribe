"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Withdrawal = {
  id: string;
  worker_id: string;
  amount: number;
  status: string;
};

export default function AdminWithdrawalsPage() {
  const router = useRouter();

  const [checkingAccess, setCheckingAccess] =
    useState(true);

  const [withdrawals, setWithdrawals] =
    useState<Withdrawal[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  async function checkAdminAccess() {
    setCheckingAccess(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // No logged-in user
    if (!user) {
      router.replace("/login");
      return;
    }

    // Get user's profile
    const { data: profile, error } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (error) {
      console.error(
        "ADMIN WITHDRAWALS ROLE CHECK ERROR:",
        error
      );

      await supabase.auth.signOut();
      router.replace("/login");
      return;
    }

    // No profile
    if (!profile) {
      await supabase.auth.signOut();
      router.replace("/login");
      return;
    }

    // Worker or other account
    if (profile.role !== "admin") {
      router.replace("/worker");
      return;
    }

    // Admin
    setCheckingAccess(false);

    await loadWithdrawals();
  }

  async function loadWithdrawals() {
    setLoading(true);

    const { data, error } =
      await supabase
        .from("withdrawals")
        .select(
          "id, worker_id, amount, status"
        )
        .order("id", {
          ascending: false,
        });

    if (error) {
      console.error(
        "WITHDRAWALS ERROR:",
        error
      );

      alert(error.message);
      setLoading(false);
      return;
    }

    console.log(
      "WITHDRAWALS:",
      data
    );

    setWithdrawals(
      (data || []) as Withdrawal[]
    );

    setLoading(false);
  }

  async function updateWithdrawal(
    withdrawalId: string,
    newStatus:
      | "approved"
      | "rejected"
  ) {
    setProcessingId(
      withdrawalId
    );

    console.log(
      "UPDATING:",
      withdrawalId,
      newStatus
    );

    const {
      data,
      error,
    } = await supabase
      .from("withdrawals")
      .update({
        status: newStatus,
      })
      .eq(
        "id",
        withdrawalId
      )
      .select(
        "id, worker_id, amount, status"
      )
      .single();

    console.log(
      "UPDATED WITHDRAWAL:",
      data
    );

    console.log(
      "UPDATE ERROR:",
      error
    );

    if (error) {
      console.error(
        "UPDATE WITHDRAWAL ERROR:",
        error
      );

      alert(
        error.message ||
          "Could not update withdrawal."
      );

      setProcessingId(null);
      return;
    }

    if (!data) {
      alert(
        "The withdrawal was not updated. Check your Supabase RLS policy."
      );

      setProcessingId(null);
      return;
    }

    setWithdrawals(
      (current) =>
        current.map(
          (withdrawal) =>
            withdrawal.id ===
            withdrawalId
              ? {
                  ...withdrawal,
                  status:
                    newStatus,
                }
              : withdrawal
        )
    );

    setProcessingId(null);

    alert(
      newStatus === "approved"
        ? "Withdrawal approved successfully!"
        : "Withdrawal rejected successfully!"
    );

    await loadWithdrawals();
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
            Checking access...
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

      <header className="bg-blue-600 text-white p-6">

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>

            <h1 className="text-3xl font-bold">
              Prime Transcribe
            </h1>

            <p className="text-blue-100 mt-1">
              Admin Withdrawal Management
            </p>

          </div>

          <div className="flex gap-3">

            <button
              onClick={() =>
                router.push("/admin")
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

      </header>

      {/* CONTENT */}

      <section className="max-w-7xl mx-auto p-8">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

          <div>

            <h2 className="text-3xl font-bold text-gray-800">
              Withdrawal Requests
            </h2>

            <p className="text-gray-500 mt-2">
              Review and manage worker withdrawal requests.
            </p>

          </div>

          <button
            onClick={loadWithdrawals}
            className="bg-gray-800 hover:bg-gray-900 text-white px-5 py-3 rounded-lg font-semibold"
          >
            Refresh
          </button>

        </div>

        {/* STATISTICS */}

        <div className="grid md:grid-cols-3 gap-6 mb-8">

          <div className="bg-white rounded-xl shadow p-6">

            <h3 className="text-gray-500">
              Total Requests
            </h3>

            <p className="text-4xl font-bold text-blue-600 mt-2">
              {withdrawals.length}
            </p>

          </div>

          <div className="bg-white rounded-xl shadow p-6">

            <h3 className="text-gray-500">
              Pending
            </h3>

            <p className="text-4xl font-bold text-yellow-600 mt-2">
              {
                withdrawals.filter(
                  (withdrawal) =>
                    withdrawal.status ===
                    "pending"
                ).length
              }
            </p>

          </div>

          <div className="bg-white rounded-xl shadow p-6">

            <h3 className="text-gray-500">
              Approved
            </h3>

            <p className="text-4xl font-bold text-green-600 mt-2">
              {
                withdrawals.filter(
                  (withdrawal) =>
                    withdrawal.status ===
                    "approved"
                ).length
              }
            </p>

          </div>

        </div>

        {/* WITHDRAWALS */}

        <div className="bg-white rounded-xl shadow overflow-hidden">

          <div className="p-6 border-b">

            <h2 className="text-2xl font-bold">
              All Withdrawal Requests
            </h2>

          </div>

          {loading ? (

            <div className="p-8 text-center">

              <p className="text-gray-500">
                Loading withdrawals...
              </p>

            </div>

          ) : withdrawals.length === 0 ? (

            <div className="p-8 text-center">

              <p className="text-gray-500">
                No withdrawal requests found.
              </p>

            </div>

          ) : (

            <div className="divide-y">

              {withdrawals.map(
                (withdrawal) => (

                  <div
                    key={
                      withdrawal.id
                    }
                    className="p-6"
                  >

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

                      {/* INFORMATION */}

                      <div>

                        <p className="text-sm text-gray-500">
                          Withdrawal ID
                        </p>

                        <p className="font-semibold break-all">
                          {withdrawal.id}
                        </p>

                        <p className="text-sm text-gray-500 mt-3">
                          Worker ID
                        </p>

                        <p className="font-semibold break-all">
                          {withdrawal.worker_id}
                        </p>

                        <p className="text-sm text-gray-500 mt-3">
                          Amount
                        </p>

                        <p className="text-2xl font-bold text-blue-600">
                          $
                          {Number(
                            withdrawal.amount
                          ).toFixed(2)}
                        </p>

                      </div>

                      {/* STATUS + ACTIONS */}

                      <div className="flex flex-col items-start lg:items-end gap-4">

                        <span
                          className={`px-4 py-2 rounded-full font-semibold ${
                            withdrawal.status ===
                            "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : withdrawal.status ===
                                "approved"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {withdrawal.status}
                        </span>

                        {withdrawal.status ===
                          "pending" && (

                          <div className="flex gap-3">

                            <button
                              disabled={
                                processingId ===
                                withdrawal.id
                              }
                              onClick={() =>
                                updateWithdrawal(
                                  withdrawal.id,
                                  "approved"
                                )
                              }
                              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-5 py-2 rounded-lg font-semibold"
                            >
                              {processingId ===
                              withdrawal.id
                                ? "Processing..."
                                : "Approve"}
                            </button>

                            <button
                              disabled={
                                processingId ===
                                withdrawal.id
                              }
                              onClick={() =>
                                updateWithdrawal(
                                  withdrawal.id,
                                  "rejected"
                                )
                              }
                              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-5 py-2 rounded-lg font-semibold"
                            >
                              {processingId ===
                              withdrawal.id
                                ? "Processing..."
                                : "Reject"}
                            </button>

                          </div>

                        )}

                        {withdrawal.status ===
                          "approved" && (

                          <p className="text-green-600 font-semibold">
                            ✓ Payment approved
                          </p>

                        )}

                        {withdrawal.status ===
                          "rejected" && (

                          <p className="text-red-600 font-semibold">
                            ✕ Withdrawal rejected
                          </p>

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