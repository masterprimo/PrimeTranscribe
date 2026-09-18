"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Job = {
  id: string;
  title: string;
  description: string | null;
  audio_url: string | null;
  duration: number | null;
  payment: number | null;
  status: string;
  worker_id: string | null;
  job_type: string;
  created_at: string;
};

export default function AdminJobsPage() {
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [payment, setPayment] = useState("10");
  const [jobType, setJobType] = useState<"regular" | "interview">(
    "regular"
  );
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  async function checkAdminAccess() {
    try {
      console.log("=== ADMIN JOBS ACCESS CHECK ===");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.log("NO USER - REDIRECTING TO LOGIN");
        router.replace("/login");
        return;
      }

      console.log("USER:", user.email);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .single();

      console.log("PROFILE:", profile);
      console.log("ROLE:", profile?.role);
      console.log("PROFILE ERROR:", profileError);

      if (profileError || !profile) {
        console.log("PROFILE NOT FOUND - ACCESS DENIED");
        router.replace("/worker");
        return;
      }

      if (profile.role !== "admin") {
        console.log(
          "NOT ADMIN - ROLE:",
          profile.role,
          "- REDIRECTING TO WORKER"
        );

        router.replace("/worker");
        return;
      }

      console.log("ADMIN JOBS ACCESS GRANTED");

      setAuthorized(true);

      await loadJobs();
    } catch (error) {
      console.error("ADMIN JOBS ACCESS ERROR:", error);
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }

  async function loadJobs() {
    setLoading(true);

    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("JOBS LOAD ERROR:", error);
      alert(error.message);
      setLoading(false);
      return;
    }

    setJobs((data || []) as Job[]);
    setLoading(false);
  }

  function handleAudioChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      setAudioFile(null);
      return;
    }

    const allowedTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/x-wav",
      "audio/mp4",
      "audio/m4a",
      "audio/ogg",
      "audio/webm",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert(
        "Please choose a valid audio file such as MP3, WAV, M4A, OGG or WEBM."
      );

      event.target.value = "";
      setAudioFile(null);
      return;
    }

    const maxSize = 50 * 1024 * 1024;

    if (file.size > maxSize) {
      alert("Audio file must be smaller than 50 MB.");
      event.target.value = "";
      setAudioFile(null);
      return;
    }

    setAudioFile(file);
  }

  async function getAudioDuration(
    file: File
  ): Promise<number | null> {
    return new Promise((resolve) => {
      const audio = document.createElement("audio");
      const objectUrl = URL.createObjectURL(file);

      audio.preload = "metadata";

      audio.onloadedmetadata = () => {
        const duration = Math.round(audio.duration);

        URL.revokeObjectURL(objectUrl);

        if (Number.isFinite(duration)) {
          resolve(duration);
        } else {
          resolve(null);
        }
      };

      audio.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      };

      audio.src = objectUrl;
    });
  }

  async function createJob(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!title.trim()) {
      alert("Enter a job title.");
      return;
    }

    if (!audioFile) {
      alert("Please choose an audio file.");
      return;
    }

    const paymentAmount = Number(payment);

    if (
      !payment ||
      !Number.isFinite(paymentAmount) ||
      paymentAmount <= 0
    ) {
      alert("Enter a valid payment amount.");
      return;
    }

    setCreating(true);

    let filePath: string | null = null;

    try {
      const duration = await getAudioDuration(audioFile);

      const extension =
        audioFile.name.includes(".")
          ? audioFile.name
              .split(".")
              .pop()
              ?.toLowerCase()
          : "mp3";

      const fileName =
        Date.now() +
        "-" +
        Math.random().toString(36).substring(2) +
        "." +
        (extension || "mp3");

      filePath = "jobs/" + fileName;

      setUploading(true);

      const { error: uploadError } =
        await supabase.storage
          .from("audio")
          .upload(filePath, audioFile, {
            cacheControl: "3600",
            upsert: false,
            contentType:
              audioFile.type || "audio/mpeg",
          });

      setUploading(false);

      if (uploadError) {
        console.error(
          "AUDIO UPLOAD ERROR:",
          uploadError
        );

        alert(uploadError.message);
        return;
      }

      const {
        data: publicUrlData,
      } = supabase.storage
        .from("audio")
        .getPublicUrl(filePath);

      const audioUrl =
        publicUrlData.publicUrl;

      if (!audioUrl) {
        alert("Could not create audio URL.");
        return;
      }

      const {
        data: createdJob,
        error: jobError,
      } = await supabase
        .from("jobs")
        .insert({
          title: title.trim(),
          description:
            description.trim() || null,
          audio_url: audioUrl,
          duration: duration,
          payment: paymentAmount,
          status: "open",
          worker_id: null,
          job_type: jobType,
        })
        .select()
        .single();

      if (jobError) {
        console.error(
          "JOB CREATE ERROR:",
          jobError
        );

        if (filePath) {
          await supabase.storage
            .from("audio")
            .remove([filePath]);
        }

        alert(jobError.message);
        return;
      }

      console.log(
        "JOB CREATED:",
        createdJob
      );

      alert(
        jobType === "interview"
          ? "Interview test created successfully! It will be available to all workers and pays $10."
          : "Job created successfully!"
      );

      setTitle("");
      setDescription("");
      setPayment(jobType === "interview" ? "10" : "");
      setJobType("regular");
      setAudioFile(null);

      const fileInput =
        document.getElementById(
          "audio-file"
        ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }

      await loadJobs();
    } catch (error) {
      console.error(
        "CREATE JOB ERROR:",
        error
      );

      alert(
        "Something went wrong while creating the job."
      );
    } finally {
      setCreating(false);
      setUploading(false);
    }
  }

  async function deleteJob(job: Job) {
    const confirmed = window.confirm(
      `Delete "${job.title}"?`
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("jobs")
      .delete()
      .eq("id", job.id);

    if (error) {
      console.error(
        "DELETE JOB ERROR:",
        error
      );

      alert(error.message);
      return;
    }

    if (job.audio_url) {
      try {
        const marker =
          "/storage/v1/object/public/audio/";

        const index =
          job.audio_url.indexOf(marker);

        if (index !== -1) {
          const filePath =
            decodeURIComponent(
              job.audio_url.substring(
                index + marker.length
              )
            );

          await supabase.storage
            .from("audio")
            .remove([filePath]);
        }
      } catch (storageError) {
        console.error(
          "AUDIO DELETE ERROR:",
          storageError
        );
      }
    }

    await loadJobs();
  }

  function formatDuration(
    seconds: number | null
  ) {
    if (
      seconds === null ||
      !Number.isFinite(seconds)
    ) {
      return "Not specified";
    }

    const minutes =
      Math.floor(seconds / 60);

    const remainingSeconds =
      seconds % 60;

    return (
      minutes +
      ":" +
      remainingSeconds
        .toString()
        .padStart(2, "0")
    );
  }

  function statusClass(status: string) {
    if (status === "open") {
      return "bg-green-100 text-green-700";
    }

    if (status === "accepted") {
      return "bg-blue-100 text-blue-700";
    }

    if (status === "completed") {
      return "bg-yellow-100 text-yellow-700";
    }

    return "bg-gray-100 text-gray-700";
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <h1 className="text-2xl font-bold text-blue-600">
            Prime Transcribe
          </h1>

          <p className="text-gray-600 mt-2">
            Checking admin access...
          </p>
        </div>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <h1 className="text-xl font-bold text-red-600">
            Access Denied
          </h1>

          <p className="text-gray-600 mt-2">
            Administrator access is required.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-blue-700 text-white p-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Prime Transcribe
            </h1>

            <p className="text-blue-100 mt-1">
              Admin Job Management
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/admin")}
              className="bg-white text-blue-700 px-5 py-2 rounded-lg font-semibold hover:bg-gray-100"
            >
              Dashboard
            </button>

            <button
              onClick={logout}
              className="bg-blue-900 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-950"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto p-8">
        <div className="bg-white rounded-2xl shadow p-8 mb-8">
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-gray-800">
              Create Transcription Job
            </h2>

            <p className="text-gray-500 mt-2">
              Create regular paid jobs or interview tests for workers.
            </p>
          </div>

          <form
            onSubmit={createJob}
            className="space-y-6"
          >
            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                Job Title
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
                placeholder="e.g. Interview Audio Transcription"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                placeholder="Describe the transcription task..."
                rows={4}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                Job Type
              </label>

              <select
                value={jobType}
                onChange={(e) =>
                  setJobType(
                    e.target.value as
                      | "regular"
                      | "interview"
                  )
                }
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="regular">
                  Regular Paid Job
                </option>

                <option value="interview">
                  Interview Test - $10
                </option>
              </select>

              <p className="text-sm text-gray-500 mt-2">
                Interview tests remain available to all workers. Each worker can submit independently.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                Audio File
              </label>

              <div className="border-2 border-dashed border-blue-300 rounded-xl p-6 bg-blue-50">
                <input
                  id="audio-file"
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioChange}
                  className="w-full text-gray-700"
                />

                <p className="text-sm text-gray-500 mt-3">
                  Supported audio: MP3, WAV, M4A, OGG, WEBM
                </p>

                <p className="text-sm text-gray-500">
                  Maximum file size: 50 MB
                </p>

                {audioFile && (
                  <div className="mt-4 bg-white rounded-lg p-4 border">
                    <p className="font-semibold text-gray-800">
                      Selected file:
                    </p>

                    <p className="text-blue-600 break-all mt-1">
                      {audioFile.name}
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                      {(
                        audioFile.size /
                        1024 /
                        1024
                      ).toFixed(2)}{" "}
                      MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                Worker Payment (USD)
              </label>

              <input
                type="number"
                min="0.01"
                step="0.01"
                value={payment}
                onChange={(e) =>
                  setPayment(e.target.value)
                }
                placeholder="e.g. 10"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {jobType === "interview" && (
                <p className="text-sm text-green-600 mt-2 font-semibold">
                  Interview test payment: $10
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={
                creating || uploading
              }
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-bold"
            >
              {uploading
                ? "Uploading Audio..."
                : creating
                ? "Creating Job..."
                : "Create Job"}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                All Jobs
              </h2>

              <p className="text-gray-500 mt-1">
                {jobs.length} job
                {jobs.length === 1
                  ? ""
                  : "s"}{" "}
                in the system
              </p>
            </div>

            <button
              onClick={loadJobs}
              className="bg-gray-800 hover:bg-gray-900 text-white px-5 py-2 rounded-lg font-semibold"
            >
              Refresh
            </button>
          </div>

          {jobs.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-10 text-center">
              <p className="text-gray-500">
                No jobs created yet.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="border border-gray-200 rounded-xl p-5"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">
                          {job.title}
                        </h3>

                        <span
                          className={
                            "px-3 py-1 rounded-full text-sm font-semibold " +
                            (job.job_type === "interview"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-gray-100 text-gray-700")
                          }
                        >
                          {job.job_type === "interview"
                            ? "Interview Test"
                            : "Regular Job"}
                        </span>

                        <span
                          className={
                            "px-3 py-1 rounded-full text-sm font-semibold " +
                            statusClass(
                              job.status
                            )
                          }
                        >
                          {job.status}
                        </span>
                      </div>

                      {job.description && (
                        <p className="text-gray-500 mt-2">
                          {job.description}
                        </p>
                      )}

                      <div className="grid sm:grid-cols-3 gap-3 mt-4 text-sm">
                        <div>
                          <span className="text-gray-400">
                            Payment
                          </span>

                          <p className="font-bold text-blue-600">
                            $
                            {Number(
                              job.payment || 0
                            ).toFixed(2)}
                          </p>
                        </div>

                        <div>
                          <span className="text-gray-400">
                            Duration
                          </span>

                          <p className="font-semibold text-gray-700">
                            {formatDuration(
                              job.duration
                            )}
                          </p>
                        </div>

                        <div>
                          <span className="text-gray-400">
                            Worker
                          </span>

                          <p className="font-semibold text-gray-700 break-all">
                            {job.worker_id ||
                              "Unassigned / Available to all"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      {job.audio_url && (
                        <audio
                          controls
                          src={job.audio_url}
                          className="w-full lg:w-72"
                        />
                      )}

                      <button
                        onClick={() =>
                          deleteJob(job)
                        }
                        className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg font-semibold"
                      >
                        Delete Job
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}