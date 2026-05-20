"use client";

interface Service {
  id: string;
  name: string;
  price: number;
  duration_min?: number | null;
}

interface Props {
  services: Service[];
}

function ServiceIcon() {
  return (
    <div className="w-12 h-12 bg-barber-400/10 rounded-lg flex items-center justify-center text-barber-400 mb-3 text-xl">
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879m1.121-1.121L16 16m0 0l-2.879-2.879m0 0L19 19m-7-7l2.879 2.879M12 12L9.121 9.121m0 0L16 16m0 0l2.879-2.879M12 12l-2.879-2.879m0 0L16 16" />
      </svg>
    </div>
  );
}

function ServiceCard({ service, featured = false }: { service: Service; featured?: boolean }) {
  return (
    <div
      className={`bg-dark-900/50 border border-dark-800/50 rounded-xl ${
        featured ? 'p-6' : 'p-4'
      }`}
    >
      <ServiceIcon />
      <h4 className={`font-medium text-white ${featured ? 'text-lg' : 'text-sm'}`}>
        {service.name}
      </h4>
      {service.duration_min && (
        <p className="text-xs text-dark-500 mt-1">~{service.duration_min} menit</p>
      )}
      <div className={`text-barber-400 font-semibold ${featured ? 'text-base mt-4' : 'text-sm mt-3'}`}>
        Rp{service.price.toLocaleString("id-ID")}
      </div>
    </div>
  );
}

export default function ServicesCarousel({ services }: Props) {
  if (services.length === 1) {
    return (
      <section>
        <h3 className="text-lg font-semibold text-white mb-4">Layanan</h3>
        <ServiceCard service={services[0]} featured />
      </section>
    );
  }

  return (
    <section>
      <h3 className="text-lg font-semibold text-white mb-4 flex justify-between items-center">
        <span>Layanan Populer</span>
        <span className="text-xs text-dark-500">
          Geser <svg className="w-3 h-3 inline ml-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </span>
      </h3>
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x">
        {services.map((service) => (
          <div key={service.id} className="min-w-[200px] md:min-w-[240px] snap-start">
            <ServiceCard service={service} />
          </div>
        ))}
      </div>
    </section>
  );
}
