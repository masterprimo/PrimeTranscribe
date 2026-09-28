"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) {
      console.error("SIGNUP ERROR:", error);

      alert(
        `Signup failed:\n\nMessage: ${error.message}\n\nCode: ${
          error.code ?? "none"
        }\n\nStatus: ${error.status ?? "none"}`
      );

      setLoading(false);
      return;
    }

    console.log("SIGNUP SUCCESS:", data);

    if (!data.user) {
      alert("Unable to create your account. Please try again.");
      setLoading(false);
      return;
    }

    alert(
      "Account created successfully!\n\nPlease check your email and click the confirmation link before logging in."
    );

    router.push("/login");
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-blue-600">
          PrimeTranscribe
        </h1>

        <p className="text-center text-gray-500 mt-2">
          Create your worker account
        </p>

        <form onSubmit={handleRegister} className="space-y-4 mt-8">
          <input
            type="text"
            placeholder="Full Name"
            className="w-full border rounded-lg p-3"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Email Address"
            className="w-full border rounded-lg p-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border rounded-lg p-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-3 font-semibold disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center mt-6 text-sm">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-blue-600 font-semibold hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}