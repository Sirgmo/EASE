'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-secondary-100/50 bg-white/80 backdrop-blur-lg">
      <div className="container-ease">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-600">
              <span className="font-display text-lg font-bold text-white">E</span>
            </div>
            <span className="font-display text-xl font-bold text-secondary-900">EASE</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-secondary-600 transition-colors hover:text-secondary-900"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-4 md:flex">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-secondary-600 transition-colors hover:text-secondary-900"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-lg p-2 text-secondary-600 hover:bg-secondary-100 md:hidden"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="border-t border-secondary-100 py-4 md:hidden">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg px-4 py-2 text-secondary-600 transition-colors hover:bg-secondary-50 hover:text-secondary-900"
                >
                  {link.label}
                </a>
              ))}
              <hr className="my-2 border-secondary-100" />
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-4 py-2 text-secondary-600 transition-colors hover:bg-secondary-50 hover:text-secondary-900"
              >
                Sign In
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="mx-4 rounded-lg bg-primary-600 px-4 py-2.5 text-center font-semibold text-white transition-colors hover:bg-primary-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
