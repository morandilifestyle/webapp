import Image from 'next/image';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-primary-50 to-secondary-50 overflow-hidden">
      {/* Decorative image */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/hero-bg.jpg" // placeholder – replace with exported Figma asset
          alt="Hero background"
          fill
          className="object-cover object-center opacity-20"
          priority
        />
      </div>

      <div className="container py-20 md:py-28 lg:py-32 text-center">
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-brand mb-6">
          Sustainable Wellness Textiles
        </h1>
        <p className="max-w-2xl mx-auto text-lg md:text-xl text-secondary-700 mb-10">
          Premium organic materials for maternity, healthcare, home, and hospitality. Experience comfort, quality, and sustainability in every thread.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/products"
            className="btn-primary px-8 py-3 text-lg rounded-full shadow-md hover:shadow-lg transition-all"
          >
            Shop Now
          </Link>
          <Link
            href="/about"
            className="btn-outline px-8 py-3 text-lg rounded-full"
          >
            Learn More
          </Link>
        </div>
      </div>
    </section>
  );
} 