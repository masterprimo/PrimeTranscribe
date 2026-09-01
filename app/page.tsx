"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900">

      {/* NAVIGATION */}
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">

          <Link
            href="/"
            className="text-2xl font-bold text-blue-700"
          >
            Prime Transcribe
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2.5 text-blue-700 font-semibold"
            >
              Login
            </Link>

            <Link
              href="/signup"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold"
            >
              Sign Up
            </Link>
          </div>

        </div>
      </header>


      {/* HERO */}
      <section className="bg-blue-700 text-white">

        <div className="max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-12 items-center">

          <div>

            <p className="text-blue-200 font-bold mb-4">
              PRIME TRANSCRIBE
            </p>

            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Turn Audio Into
              <span className="text-blue-200">
                {" "}Income
              </span>
            </h1>

            <p className="text-xl text-blue-100 mt-6 leading-8 max-w-xl">
              Find transcription jobs, work from anywhere,
              submit your transcripts and earn money.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">

              <Link
                href="/signup"
                className="bg-white text-blue-700 hover:bg-blue-50 px-7 py-4 rounded-xl font-bold text-lg text-center"
              >
                Become a Worker
              </Link>

              <Link
                href="/login"
                className="border border-white px-7 py-4 rounded-xl font-bold text-lg text-center hover:bg-blue-600"
              >
                Login
              </Link>

            </div>

          </div>


          {/* JOB PREVIEW */}
          <div className="bg-white rounded-3xl p-7 text-gray-900 shadow-2xl">

            <div className="flex justify-between items-start">

              <div>
                <p className="text-sm text-gray-500">
                  Available Job
                </p>

                <h2 className="text-2xl font-bold mt-1">
                  Interview Transcription
                </h2>
              </div>

              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                Open
              </span>

            </div>

            <div className="mt-7 space-y-4">

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-500 text-sm">
                  Audio
                </p>

                <p className="font-semibold">
                  45 minutes
                </p>
              </div>

              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-gray-500 text-sm">
                  Payment
                </p>

                <p className="text-3xl font-bold text-blue-600">
                  $25.00
                </p>
              </div>

              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold">
                Accept Job
              </button>

            </div>

          </div>

        </div>

      </section>


      {/* STATISTICS */}
      <section className="border-b">

        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">

          <div>
            <p className="text-3xl font-bold text-blue-600">
              15,000+
            </p>
            <p className="text-gray-500">
              Workers
            </p>
          </div>

          <div>
            <p className="text-3xl font-bold text-blue-600">
              500+
            </p>
            <p className="text-gray-500">
              Jobs
            </p>
          </div>

          <div>
            <p className="text-3xl font-bold text-blue-600">
              $2.5M+
            </p>
            <p className="text-gray-500">
              Paid
            </p>
          </div>

          <div>
            <p className="text-3xl font-bold text-blue-600">
              98%
            </p>
            <p className="text-gray-500">
              Satisfaction
            </p>
          </div>

        </div>

      </section>


      {/* FEATURES */}
      <section className="py-20 bg-gray-50">

        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center mb-12">

            <p className="text-blue-600 font-bold">
              WHY PRIME TRANSCRIBE
            </p>

            <h2 className="text-4xl font-bold mt-3">
              Everything You Need To Work
            </h2>

          </div>


          <div className="grid md:grid-cols-3 gap-8">

            <div className="bg-white rounded-2xl shadow p-8">
              <div className="text-4xl mb-5">
                🎧
              </div>

              <h3 className="text-xl font-bold">
                Find Jobs
              </h3>

              <p className="text-gray-500 mt-3 leading-7">
                Browse available transcription jobs and
                choose the work you want.
              </p>
            </div>


            <div className="bg-white rounded-2xl shadow p-8">
              <div className="text-4xl mb-5">
                ✍️
              </div>

              <h3 className="text-xl font-bold">
                Transcribe
              </h3>

              <p className="text-gray-500 mt-3 leading-7">
                Listen to audio, type the transcript and
                submit your completed work.
              </p>
            </div>


            <div className="bg-white rounded-2xl shadow p-8">
              <div className="text-4xl mb-5">
                💰
              </div>

              <h3 className="text-xl font-bold">
                Earn Money
              </h3>

              <p className="text-gray-500 mt-3 leading-7">
                Once your work is approved, your earnings
                become available for withdrawal.
              </p>
            </div>

          </div>

        </div>

      </section>


      {/* HOW IT WORKS */}
      <section className="py-20">

        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center mb-14">

            <p className="text-blue-600 font-bold">
              HOW IT WORKS
            </p>

            <h2 className="text-4xl font-bold mt-3">
              Start Earning In Four Steps
            </h2>

          </div>


          <div className="grid md:grid-cols-4 gap-8">

            <div className="text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold">
                1
              </div>

              <h3 className="font-bold text-xl mt-5">
                Sign Up
              </h3>

              <p className="text-gray-500 mt-2">
                Create your worker account.
              </p>
            </div>


            <div className="text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold">
                2
              </div>

              <h3 className="font-bold text-xl mt-5">
                Choose a Job
              </h3>

              <p className="text-gray-500 mt-2">
                Find an available transcription job.
              </p>
            </div>


            <div className="text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold">
                3
              </div>

              <h3 className="font-bold text-xl mt-5">
                Complete It
              </h3>

              <p className="text-gray-500 mt-2">
                Transcribe the audio and submit it.
              </p>
            </div>


            <div className="text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold">
                4
              </div>

              <h3 className="font-bold text-xl mt-5">
                Get Paid
              </h3>

              <p className="text-gray-500 mt-2">
                Approved work adds to your balance.
              </p>
            </div>

          </div>

        </div>

      </section>


      {/* CALL TO ACTION */}
      <section className="bg-blue-700 text-white">

        <div className="max-w-5xl mx-auto px-6 py-20 text-center">

          <h2 className="text-4xl md:text-5xl font-bold">
            Ready To Start Earning?
          </h2>

          <p className="text-blue-100 text-lg mt-5">
            Join Prime Transcribe today.
          </p>

          <Link
            href="/signup"
            className="inline-block mt-8 bg-white text-blue-700 hover:bg-blue-50 px-8 py-4 rounded-xl font-bold text-lg"
          >
            Create Worker Account
          </Link>

        </div>

      </section>


      {/* FOOTER */}
      <footer className="bg-gray-950 text-gray-400">

        <div className="max-w-7xl mx-auto px-6 py-10">

          <div className="flex flex-col md:flex-row justify-between gap-6">

            <div>

              <h3 className="text-xl font-bold text-white">
                Prime Transcribe
              </h3>

              <p className="mt-2">
                Professional online transcription platform.
              </p>

            </div>

            <div className="flex gap-6">

              <Link
                href="/login"
                className="hover:text-white"
              >
                Login
              </Link>

              <Link
                href="/signup"
                className="hover:text-white"
              >
                Sign Up
              </Link>

              <Link
                href="/admin"
                className="hover:text-white"
              >
                Admin
              </Link>

            </div>

          </div>

          <div className="border-t border-gray-800 mt-8 pt-6 text-sm">
            © {new Date().getFullYear()} Prime Transcribe. All rights reserved.
          </div>

        </div>

      </footer>

    </main>
  );
}