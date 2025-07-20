import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-10">
      <div className="container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <h3 className="text-white text-lg font-semibold mb-4">Morandi</h3>
          <p className="text-sm leading-relaxed">
            Premium organic textiles crafted for wellness and sustainability.
          </p>
        </div>

        <div>
          <h4 className="text-white font-medium mb-3">Shop</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/products" className="hover:text-white">All Products</Link></li>
            <li><Link href="/categories" className="hover:text-white">Categories</Link></li>
            <li><Link href="/wishlist" className="hover:text-white">Wishlist</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-medium mb-3">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/about" className="hover:text-white">About Us</Link></li>
            <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-medium mb-3">Newsletter</h4>
          <p className="text-sm mb-4">Subscribe for updates and promotions.</p>
          <form className="flex">
            <input
              type="email"
              className="w-full rounded-l-md px-3 py-2 text-gray-900 focus:outline-none"
              placeholder="Email address"
              aria-label="Email address"
            />
            <button
              type="submit"
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 rounded-r-md transition-colors"
            >
              Join
            </button>
          </form>
        </div>
      </div>

      <div className="mt-12 border-t border-gray-700 pt-6 text-center text-sm">
        © {year} Morandi. All rights reserved.
      </div>
    </footer>
  );
} 