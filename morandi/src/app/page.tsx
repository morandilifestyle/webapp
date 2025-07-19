import Header from '@/components/ui/Header';

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-20">
        <div className="container-custom">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gradient mb-6">
              Sustainable Wellness Textiles
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Premium organic materials for maternity, healthcare, home, and hospitality. 
              Experience comfort, quality, and sustainability in every thread.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/products" className="btn-primary text-lg px-8 py-3">
                Shop Now
              </a>
              <button className="btn-outline text-lg px-8 py-3">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="container-custom">
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
        <div className="container-custom">
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
      </main>
    </>
  );
} 