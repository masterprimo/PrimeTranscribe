"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Job } from "@/types";

export default function MyJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [transcripts, setTranscripts] = useState<Record<string, string>>({});
  const [userName, setUserName] = useState("Worker");

  useEffect(() => {
    loadMyJobs();
  }, []);

  async function loadMyJobs() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setUserName(user.email?.split("@")[0] || "Worker");

    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("worker_id", user.id)
      .eq("status", "accepted")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setJobs(data || []);
  }

async function submitTranscript(jobId: number) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in.");
      return;
    }

    const transcript = transcripts[jobId] || "";

    if (!transcript.trim()) {
      alert("Please type your transcript before submitting.");
      return;
    }

    const { error } = await supabase
      .from("submissions")
      .insert({
        job_id: jobId,
        worker_id: user.id,
        transcript,
        status: "pending",
      });

    if (error) {
      console.error("SUBMISSION ERROR:", error);
      alert(error.message || "Submission failed");
      return;
    }

    alert("Transcript submitted successfully!");

    setTranscripts((prev) => ({
      ...prev,
      [jobId]: "",
    }));
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <main className="min-h-screen bg-gray-100">

      {/* NAVIGATION */}

      <nav className="bg-blue-700 text-white px-6 py-4 shadow">

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>
            <h1 className="text-xl font-bold">
              Prime Transcribe
            </h1>

            <p className="text-blue-200 text-sm">
              Welcome, {userName}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">

            <Link
              href="/worker"
              className="px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Dashboard
            </Link>

            <Link
              href="/worker/my-jobs"
              className="bg-white text-blue-700 px-4 py-2 rounded-lg font-semibold"
            >
              My Jobs
            </Link>

            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-semibold"
            >
              Logout
            </button>

          </div>

        </div>

      </nav>

      {/* PAGE CONTENT */}

      <section className="max-w-5xl mx-auto p-8">

        <div className="mb-8">

          <h2 className="text-3xl font-bold text-gray-800">
            My Accepted Jobs
          </h2>

          <p className="text-gray-500 mt-2">
            Complete your accepted transcription jobs below.
          </p>

        </div>

        {jobs.length === 0 ? (

          <div className="bg-white rounded-xl shadow p-8 text-center">

            <div className="text-5xl mb-4">
              📋
            </div>

            <h3 className="text-xl font-bold">
              No accepted jobs
            </h3>

            <p className="text-gray-500 mt-2">
              You haven't accepted any jobs yet.
            </p>

            <Link
              href="/worker"
              className="inline-block mt-5 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
            >
              Find Available Jobs
            </Link>

          </div>

        ) : (

          jobs.map((job) => (

            <div
              key={job.id}
              className="bg-white rounded-xl shadow-lg p-6 mb-6"
            >

              {/* JOB HEADER */}

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

                <div>

                  <h3 className="text-2xl font-bold text-gray-800">
                    {job.title}
                  </h3>

                  <p className="text-gray-500 mt-1">
                    Transcription Job
                  </p>

                </div>

                <div className="text-right">

                  <p className="text-blue-600 font-bold text-xl">
                    ${job.payment}
                  </p>

                  <span className="inline-block mt-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold">
                    {job.status}
                  </span>

                </div>

              </div>

              {/* AUDIO */}

              <div className="mt-6">

                <h4 className="font-semibold mb-2">
                  Audio Recording
                </h4>

                <audio
                  controls
                  className="w-full"
                >
                  <source
                    src={job.audio_url}
                    type="audio/mp4"
                  />

                  Your browser does not support the audio element.
                </audio>

              </div>

              {/* TRANSCRIPT */}

              <div className="mt-6">

                <label className="block font-semibold mb-2">
                  Your Transcript
                </label>

                <textarea
                  className="w-full border border-gray-300 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={12}
                  placeholder="Listen to the audio and type your transcript here..."
                  value={transcripts[job.id] || ""}
                  onChange={(e) =>
                    setTranscripts({
                      ...transcripts,
                      [job.id]: e.target.value,
                    })
                  }
                />

              </div>

              {/* SUBMIT */}

              <div className="flex justify-end mt-4">

                <button
                  onClick={() => submitTranscript(job.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold"
                >
                  Submit Transcript
                </button>

              </div>

            </div>

          ))

        )}

      </section>

    </main>
  );
}