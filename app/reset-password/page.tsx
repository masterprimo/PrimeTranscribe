"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [message, setMessage] = useState("");

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setMessage(
          "This password reset link is invalid or has expired."
        );
        setLoading(false);
        return;
      }

      setLoading(false);
    }

    checkSession();
  }, []);

  async function handleResetPassword(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (password.length < 6) {
      setMessage(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setMessage(
        "Passwords do not match."
      );
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } =
      await supabase.auth.updateUser({
        password,
      });

    if (error) {
      console.error(
        "PASSWORD UPDATE ERROR:",
        error
      );

      setMessage(
        error.message
      );

      setSaving(false);
      return;
    }

    setMessage(
      "Password updated successfully!"
    );

    setSaving(false);

    setTimeout(() => {
      router.push("/login");
    }, 1500);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <p className="text-gray-600">
            Checking password reset link...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

        <div className="text-center mb-8">

          <h1 className="text-3xl font-bold text-blue-700">
            Prime Transcribe
          </h1>

          <p className="text-gray-500 mt-2">
            Create a new password
          </p>

        </div>

        {message && (
          <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 p-4">
            {message}
          </div>
        )}

        <form
          onSubmit={handleResetPassword}
          className="space-y-5"
        >

          {/* NEW PASSWORD */}

          <div>

            <label className="block font-semibold text-gray-700 mb-2">
              New Password
            </label>

            <div className="relative">

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Enter new password"
                minLength={6}
                required
                className="w-full border border-gray-300 rounded-lg p-3 pr-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 font-semibold"
              >
                {showPassword
                  ? "Hide"
                  : "Show"}
              </button>

            </div>

          </div>

          {/* CONFIRM PASSWORD */}

          <div>

            <label className="block font-semibold text-gray-700 mb-2">
              Confirm Password
            </label>

            <div className="relative">

              <input
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                placeholder="Confirm new password"
                minLength={6}
                required
                className="w-full border border-gray-300 rounded-lg p-3 pr-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 font-semibold"
              >
                {showConfirmPassword
                  ? "Hide"
                  : "Show"}
              </button>

            </div>

          </div>

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-bold"
          >
            {saving
              ? "Updating..."
              : "Update Password"}
          </button>

        </form>

        <button
          onClick={() =>
            router.push("/login")
          }
          className="w-full mt-4 text-gray-500 hover:text-blue-600 font-semibold"
        >
          Back to Login
        </button>

      </div>

    </main>
  );
}