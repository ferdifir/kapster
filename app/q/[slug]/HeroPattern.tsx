export default function HeroPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950" />
      
      {/* Geometric pattern overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Gold accent circles */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-barber-400/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/3 w-48 h-48 bg-barber-400/5 rounded-full blur-3xl" />
      <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-barber-400/10 rounded-full blur-2xl" />

      {/* Subtle diagonal lines */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 20px, rgba(241, 171, 42, 0.5) 20px, rgba(241, 171, 42, 0.5) 21px)',
      }} />
    </div>
  );
}
