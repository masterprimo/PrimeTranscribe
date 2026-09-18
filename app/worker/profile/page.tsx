
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function WorkerProfilePage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");

  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/login");
      return;
    }

    setUserId(user.id);
    setEmail(user.email || "");

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "full_name, email, date_of_birth, country, phone, role"
      )
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("PROFILE LOAD ERROR:", error);
      alert("Unable to load your profile.");
      setLoading(false);
      return;
    }

    if (data) {
      setFullName(data.full_name || "");
      setDateOfBirth(data.date_of_birth || "");
      setCountry(data.country || "");
      setPhone(data.phone || "");
    }

    setLoading(false);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();

    if (!userId) {
      alert("Please log in again.");
      return;
    }

    if (!fullName.trim()) {
      alert("Please enter your full name.");
      return;
    }

    if (!dateOfBirth) {
      alert("Please enter your date of birth.");
      return;
    }

    if (!country.trim()) {
      alert("Please enter your country.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        date_of_birth: dateOfBirth,
        country: country.trim(),
        phone: phone.trim() || null,
      })
      .eq("id", userId);

    if (error) {
      console.error("PROFILE SAVE ERROR:", error);
      alert(error.message || "Unable to save your profile.");
      setSaving(false);
      return;
    }

    alert("Profile updated successfully.");
    setSaving(false);

    router.push("/worker");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <h1 className="text-xl font-bold text-blue-700">
            Prime Transcribe
          </h1>
          <p className="text-gray-500 mt-2">
            Loading your profile...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-blue-700 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-6 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">
              Prime Transcribe
            </h1>
            <p className="text-blue-100 text-sm">
              Worker Profile
            </p>
          </div>

          <button
            onClick={() => router.push("/worker")}
            className="bg-white text-blue-700 px-4 py-2 rounded-lg font-semibold"
          >
            Dashboard
          </button>
        </div>
      </header>

      <section className="max-w-2xl mx-auto px-6 py-10">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-800">
            Complete Your Profile
          </h2>

          <p className="text-gray-500 mt-2 mb-8">
            Keep your information accurate so we can identify your worker account.
          </p>

          <form onSubmit={saveProfile} className="space-y-6">

            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                Full Name
              </label>

              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                required
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                Email
              </label>

              <input
                type="email"
                value={email}
                disabled
                className="w-full border border-gray-200 bg-gray-100 text-gray-600 rounded-lg p-3"
              />

              <p className="text-sm text-gray-500 mt-2">
                Your login email cannot be changed here.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                Date of Birth
              </label>

              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                Country
              </label>

              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Enter your country"
                required
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                Phone Number
                <span className="text-gray-400 font-normal">
                  {" "} (Optional)
                </span>
              </label>

              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-bold"
            >
              {saving ? "Saving Profile..." : "Save Profile"}
            </button>

          </form>
        </div>
      </section>
    </main>
  );
}