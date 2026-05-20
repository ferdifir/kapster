import Image from "next/image";

interface Props {
  images: string[];
  barbershopName: string;
}

export default function GalleryGrid({ images, barbershopName }: Props) {
  if (images.length === 0) return null;

  return (
    <section>
      <h3 className="text-lg font-semibold text-white mb-4">Galeri Hasil Cukur</h3>
      <div className="grid grid-cols-3 gap-2">
        {images.map((src, index) => (
          <Image
            key={index}
            src={src}
            alt={`${barbershopName} gallery ${index + 1}`}
            width={300}
            height={128}
            className="rounded-xl h-24 md:h-32 w-full object-cover border border-dark-800/50"
          />
        ))}
      </div>
    </section>
  );
}
