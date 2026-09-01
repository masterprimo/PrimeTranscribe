"use client";

import { useState } from "react";

type Props = {
  onSubmit: (transcript: string) => Promise<void>;
};

export default function TranscriptForm({ onSubmit }: Props) {
  const [transcript, setTranscript] = useState("");

  async function handleSubmit() {
    if (!transcript.trim()) {
      alert("Please enter your transcript.");
      return;
    }

    await onSubmit(transcript);
    setTranscript("");
  }

  return (
    <div className="mt-4">
      <textarea
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="Type your transcript here..."
        className="w-full border rounded-lg p-3 h-40"
      />

      <button
        onClick={handleSubmit}
        className="mt-3 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg"
      >
        Submit Transcript
      </button>
    </div>
  );
}