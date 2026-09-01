"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Withdrawal = {
  id: string;
  worker_id: string;
  amount: number;
  paypal_email: string | null;
  status: string;
};

export default function WorkerWithdrawalsPage() {
  const router = useRouter();

  const [workerId, setWorkerId] =
    useState<string | null>(null);

  const [balance, setBalance] =
    useState(0);

  const [amount, setAmount] =
    useState("");

  const [paypalEmail, setPaypalEmail] =
    useState("");

  const [withdrawals, setWithdrawals] =
    useState<Withdrawal[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  useEffect(() => {
    initialize();
  }, []);

  async function initialize() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setWorkerId(user.id);

    await loadBalance(user.id);
    await loadWithdrawals(user.id);

    setLoading(false);
  }

  async function loadBalance(userId: string) {
    const {
      data: submissions,
      error,
    } = await supabase
      .from("submissions")
      .select("job_id, status")
      .eq("worker_id", userId)
      .eq("status", "approved");

    if (error) {
      console.error(
        "BALANCE ERROR:",
        error
      );
      return;
    }

    if (!submissions?.length) {
      setBalance(0);
      return;
    }

    const jobIds = submissions.map(
      (submission) =>
        submission.job_id
    );

    const {
      data: jobs,
      error: jobError,
    } = await supabase
      .from("jobs")
      .select("id, payment")
      .in("id", jobIds);

    if (jobError) {
      console.error(
        "JOB PAYMENT ERROR:",
        jobError
      );
      return;
    }

    const earned =
      jobs?.reduce(
        (total, job) =>
          total +
          Number(
            job.payment || 0
          ),
        0
      ) || 0;

    const {
      data: approvedWithdrawals,
      error: withdrawalError,
    } = await supabase
      .from("withdrawals")
      .select("amount")
      .eq("worker_id", userId)
      .eq("status", "approved");

    if (withdrawalError) {
      console.error(
        "WITHDRAWAL BALANCE ERROR:",
        withdrawalError
      );
    }

    const withdrawn =
      approvedWithdrawals?.reduce(
        (total, withdrawal) =>
          total +
          Number(
            withdrawal.amount || 0
          ),
        0
      ) || 0;

    setBalance(
      Math.max(
        0,
        earned - withdrawn
      )
    );
  }

  async function loadWithdrawals(
    userId: string
  ) {
    const {
      data,
      error,
    } = await supabase
      .from("withdrawals")
      .select(
        "id, worker_id, amount, paypal_email, status"
      )
      .eq(
        "worker_id",
        userId
      )
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

  async function requestWithdrawal(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (!workerId) {
      alert(
        "Worker account not found."
      );
      return;
    }

    const requestedAmount =
      Number(amount);

    if (
      !requestedAmount ||
      requestedAmount <= 0
    ) {
      alert(
        "Enter a valid withdrawal amount."
      );
      return;
    }

    if (
      requestedAmount >
      balance
    ) {
      alert(
        `You can only withdraw up to $${balance.toFixed(
          2
        )}.`
      );
      return;
    }

    const email =
      paypalEmail.trim();

    if (!email) {
      alert(
        "Enter your PayPal email."
      );
      return;
    }

    if (
      !email.includes("@") ||
      !email.includes(".")
    ) {
      alert(
        "Enter a valid PayPal email."
      );
      return;
    }

    setSubmitting(true);

    const {
      data,
      error,
    } = await supabase
      .from("withdrawals")
      .insert({
        worker_id:
          workerId,
        amount:
          requestedAmount,
        paypal_email:
          email,
        status:
          "pending",
      })
      .select(
        "id, worker_id, amount, paypal_email, status"
      )
      .single();

    if (error) {
      console.error(
        "WITHDRAWAL REQUEST ERROR:",
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
        `WITHDRAWAL ERROR\n\n${error.message}`
      );

      setSubmitting(false);
      return;
    }

    if (data) {
      setWithdrawals(
        (current) => [
          data as Withdrawal,
          ...current,
        ]
      );
    }

    setAmount("");
    setPaypalEmail("");

    setSubmitting(false);

    alert(
      "Withdrawal request submitted successfully!"
    );

    await loadBalance(
      workerId
    );
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function statusClass(
    status: string
  ) {
    if (
      status ===
      "approved"
    ) {
      return "bg-green-100 text-green-700";
    }

    if (
      status ===
      "rejected"
    ) {
      return "bg-red-100 text-red-700";
    }

    return "bg-yellow-100 text-yellow-700";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">

        <div className="bg-white rounded-xl shadow p-8">

          <p className="text-gray-600">
            Loading withdrawals...
          </p>

        </div>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">

      {/* HEADER */}

      <header className="bg-blue-700 text-white p-6">

        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>

            <h1 className="text-3xl font-bold">
              Prime Transcribe
            </h1>

            <p className="text-blue-100 mt-1">
              Worker Withdrawals
            </p>

          </div>

          <div className="flex gap-3">

            <button
              onClick={() =>
                router.push(
                  "/worker"
                )
              }
              className="bg-white text-blue-700 px-5 py-2 rounded-lg font-semibold hover:bg-gray-100"
            >
              Dashboard
            </button>

            <button
              onClick={
                logout
              }
              className="bg-red-500 hover:bg-red-600 px-5 py-2 rounded-lg font-semibold"
            >
              Logout
            </button>

          </div>

        </div>

      </header>

      <section className="max-w-6xl mx-auto p-8">

        {/* BALANCE */}

        <div className="bg-white rounded-xl shadow p-8 mb-8">

          <p className="text-gray-500">
            Available Balance
          </p>

          <p className="text-4xl font-bold text-green-600 mt-2">
            $
            {balance.toFixed(
              2
            )}
          </p>

        </div>

        {/* REQUEST WITHDRAWAL */}

        <div className="bg-white rounded-xl shadow p-8 mb-8">

          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Request Withdrawal
          </h2>

          <form
            onSubmit={
              requestWithdrawal
            }
            className="space-y-5"
          >

            <div>

              <label className="block font-semibold text-gray-700 mb-2">
                Withdrawal Amount
              </label>

              <input
                type="number"
                step="0.01"
                min="0.01"
                max={balance}
                value={amount}
                onChange={(e) =>
                  setAmount(
                    e.target.value
                  )
                }
                placeholder="Enter amount"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>

            <div>

              <label className="block font-semibold text-gray-700 mb-2">
                PayPal Email
              </label>

              <input
                type="email"
                value={
                  paypalEmail
                }
                onChange={(e) =>
                  setPaypalEmail(
                    e.target.value
                  )
                }
                placeholder="yourpaypal@email.com"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <p className="text-sm text-gray-500 mt-2">
                Enter the PayPal email where you want to receive your payment.
              </p>

            </div>

            <button
              type="submit"
              disabled={
                submitting ||
                balance <= 0
              }
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-7 py-3 rounded-lg font-bold"
            >
              {submitting
                ? "Submitting..."
                : "Request Withdrawal"}
            </button>

          </form>

        </div>

        {/* HISTORY */}

        <div className="bg-white rounded-xl shadow p-8">

          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Withdrawal History
          </h2>

          {withdrawals.length ===
          0 ? (

            <p className="text-gray-500">
              You have no withdrawal requests.
            </p>

          ) : (

            <div className="space-y-4">

              {withdrawals.map(
                (
                  withdrawal
                ) => (

                  <div
                    key={
                      withdrawal.id
                    }
                    className="border rounded-xl p-5"
                  >

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                      <div>

                        <p className="text-2xl font-bold text-gray-800">
                          $
                          {Number(
                            withdrawal.amount
                          ).toFixed(
                            2
                          )}
                        </p>

                        <p className="text-sm text-gray-500 mt-1">
                          PayPal:{" "}
                          {withdrawal.paypal_email ||
                            "Not provided"}
                        </p>

                        <p className="text-sm text-gray-400 mt-1">
                          Request ID:{" "}
                          {
                            withdrawal.id
                          }
                        </p>

                      </div>

                      <span
                        className={`px-4 py-2 rounded-full font-semibold ${statusClass(
                          withdrawal.status
                        )}`}
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

      </section>

    </main>
  );
}