export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm p-8 md:p-12">
        <h1 className="text-4xl font-bold text-blue-700 mb-3">
          Contact & Support
        </h1>

        <p className="text-gray-600 mb-10">
          Need help with Prime Transcribe? We&apos;re here to assist.
        </p>

        <section className="space-y-8 text-gray-700 leading-7">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              General Support
            </h2>
            <p>
              For questions about your account, transcription jobs,
              submissions, earnings, or withdrawals, please contact the
              Prime Transcribe support team.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              Account Support
            </h2>
            <p>
              If you are having trouble registering, logging in, accepting a
              job, submitting a transcription, or accessing your earnings,
              please provide your account email and a description of the
              problem when contacting support.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              Payments & Withdrawals
            </h2>
            <p>
              For questions about earnings, withdrawal requests, or payment
              processing, include the relevant transaction or withdrawal
              details when contacting support.
            </p>
          </div>

          <div className="bg-blue-50 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              Contact Us
            </h2>

            <p className="mb-2">
              Email: primetranscribesupport@gmail.com
            </p>

            <p>
              We aim to respond to support requests as soon as reasonably
              possible.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}