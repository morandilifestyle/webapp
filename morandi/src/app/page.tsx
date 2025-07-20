import Header from '@/components/ui/Header';
import Script from 'next/script';
import Hero from '@/components/landing/Hero';
import Footer from '@/components/landing/Footer';

export default function HomePage() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://morandi-lifestyle.com/",
      },
    ],
  };
  return (
    <>
      <Script
        id="ld-json-breadcrumb"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Header />
      <main className="min-h-screen pt-16">
      {/* Hero Section */}
      <Hero />

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="container px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Collections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: 'Maternity & Baby Care',
                description: 'Safe, organic products for expecting mothers and newborns',
                image: '/images/maternity.jpg',
                link: '/category/maternity'
              },
              {
                title: 'Healthcare Textiles',
                description: 'Premium medical-grade textiles for healthcare facilities',
                image: '/images/healthcare.jpg',
                link: '/category/healthcare'
              },
              {
                title: 'Home & Bedding',
                description: 'Comfortable, sustainable home textiles and bedding',
                image: '/images/home.jpg',
                link: '/category/home'
              },
              {
                title: 'Hospitality Solutions',
                description: 'Luxury textiles for hotels and hospitality businesses',
                image: '/images/hospitality.jpg',
                link: '/category/hospitality'
              }
            ].map((category, index) => (
              <div key={index} className="card p-6 text-center hover:scale-105 transition-transform duration-200">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏥</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{category.title}</h3>
                <p className="text-gray-600 mb-4">{category.description}</p>
                <a href={category.link} className="text-primary-600 hover:text-primary-700 font-medium">
                  Explore →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Morandi?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '🌱',
                title: '100% Organic',
                description: 'All our materials are certified organic and sustainably sourced'
              },
              {
                icon: '♻️',
                title: 'Eco-Friendly',
                description: 'Committed to reducing environmental impact through sustainable practices'
              },
              {
                icon: '✨',
                title: 'Premium Quality',
                description: 'Exceptional craftsmanship and attention to detail in every product'
              }
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
      </main>
    </>
  );
} 