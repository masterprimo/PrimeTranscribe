"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function handleLogin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      alert("Login failed.");
      setLoading(false);
      return;
    }

    // Get account role
    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profileError) {
      console.error(
        "PROFILE ROLE ERROR:",
        profileError
      );

      alert(
        "Login successful, but your account role could not be determined."
      );

      setLoading(false);
      return;
    }

    if (profile.role === "admin") {
      router.push("/admin");
      return;
    }

    if (profile.role === "worker") {
      router.push("/worker");
      return;
    }

    alert(
      "Your account does not have a valid role."
    );

    setLoading(false);
  }

  async function handleForgotPassword() {
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      alert(
        "Enter your email address first."
      );
      return;
    }

    setResetting(true);

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        cleanEmail,
        {
          redirectTo:
            `${window.location.origin}/reset-password`,
        }
      );

    if (error) {
      console.error(
        "PASSWORD RESET ERROR:",
        error
      );

      alert(
        `Password reset error:\n\n${error.message}`
      );

      setResetting(false);
      return;
    }

    alert(
      "Password reset email sent. Check your email and follow the link to create a new password."
    );

    setResetting(false);
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

        {/* LOGO / TITLE */}

        <div className="text-center mb-8">

          <h1 className="text-3xl font-bold text-blue-700">
            Prime Transcribe
          </h1>

          <p className="text-gray-500 mt-2">
            Login to your account
          </p>

        </div>

        {/* LOGIN FORM */}

        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >

          {/* EMAIL */}

          <div>

            <label className="block font-semibold text-gray-700 mb-2">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="Enter your email"
              required
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

          {/* PASSWORD */}

          <div>

            <label className="block font-semibold text-gray-700 mb-2">
              Password
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
                placeholder="Enter your password"
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

          {/* FORGOT PASSWORD */}

          <div className="text-right">

            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={resetting}
              className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
            >
              {resetting
                ? "Sending..."
                : "Forgot password?"}
            </button>

          </div>

          {/* LOGIN BUTTON */}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-bold transition"
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>

        </form>

        {/* SIGNUP */}

        <div className="text-center mt-6">

          <p className="text-gray-500">
            Don't have an account?
          </p>

          <button
            onClick={() =>
              router.push("/signup")
            }
            className="text-blue-600 hover:text-blue-800 font-semibold mt-1"
          >
            Create an account
          </button>

        </div>

      </div>

    </main>
  );
}