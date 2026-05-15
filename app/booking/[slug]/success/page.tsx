import Link from "next/link";

export default async function BookingSuccessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <div>
          <h1 className="font-display text-2xl font-bold text-white mb-2">
            Reservasi Berhasil!
          </h1>
          <p className="text-dark-400 text-sm">
            Reservasi Anda telah dikirim dan menunggu konfirmasi dari barbershop.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href={`/booking/${slug}`}
            className="block w-full py-3 rounded-xl gold-gradient text-dark-900 font-bold text-sm text-center"
          >
            Buat Reservasi Lain
          </Link>
          <Link
            href={`/q/${slug}`}
            className="block text-dark-500 text-sm hover:text-dark-300 transition-colors"
          >
            Atau daftar antrian walk-in →
          </Link>
        </div>
      </div>
    </div>
  );
}
