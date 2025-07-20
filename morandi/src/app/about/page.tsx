import React from 'react';

export const metadata = {
  title: 'About Us | Morandi',
  description: 'Learn more about Morandi and our commitment to sustainable textiles.',
};

export default function AboutPage() {
  return (
    <main className="container py-20 md:py-32 max-w-3xl mx-auto">
      <h1 className="text-3xl md:text-5xl font-semibold mb-6 text-brand">About Morandi</h1>
      <p className="text-lg leading-8 text-gray-700">
        Morandi is dedicated to crafting premium, eco-friendly textiles for every stage of life—from motherhood and
        babyhood to hospitality and healthcare.  We partner with certified mills, use organic or recycled fibres, and
        follow fair-trade manufacturing practices to ensure every product is as good for the planet as it is for the
        people who use it.
      </p>
      <p className="mt-6 text-lg leading-8 text-gray-700">
        Our product range spans maternity wear, baby essentials, hospital bedding, luxury home linens and more.  Whether
        you’re welcoming a new arrival or outfitting a boutique hotel, Morandi offers sustainable solutions without
        compromising on comfort or style.
      </p>
    </main>
  );
} 