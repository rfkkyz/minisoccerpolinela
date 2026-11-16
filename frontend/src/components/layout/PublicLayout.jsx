import React, { Component } from 'react';
import { AnnouncementBar } from './AnnouncementBar';
import { PublicNavbar } from './PublicNavbar';
import { Footer } from '../Footer';
import { Link } from 'react-router-dom';

/**
 * Small fallback ErrorBoundary specifically for Navbar:
 * If an unexpected error occurs, renders a static navbar so the page never crashes.
 */
class NavbarErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Navbar error caught by NavbarErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <header className="sticky top-0 z-[100] w-full bg-white h-[64px] border-b border-[#DCE8E0] px-6 lg:px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo-polinela.png" alt="POLINELA" className="w-7 h-7 object-contain" />
            <span className="font-extrabold text-xl font-sans tracking-tight">
              <span className="text-[#0E2A20]">POLI</span>
              <span className="text-[#12A150]">SOCCER</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-[#0E2A20]">
            <Link to="/#tentang" className="hover:text-[#12A150]">Tentang</Link>
            <Link to="/#tarif" className="hover:text-[#12A150]">Tarif</Link>
            <Link to="/#jadwal" className="hover:text-[#12A150]">Jadwal</Link>
            <Link to="/#berita" className="hover:text-[#12A150]">Berita</Link>
            <Link to="/cek-tiket" className="hover:text-[#12A150]">Cek Tiket</Link>
          </nav>
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl bg-[#0B0F0D] text-white text-xs font-semibold"
          >
            Masuk
          </Link>
        </header>
      );
    }
    return this.props.children;
  }
}

export function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans antialiased text-[var(--ink)]">
      {/* 1. Announcement Bar (strip tipis di paling atas, ikut scroll, TIDAK sticky) */}
      <AnnouncementBar />

      {/* 2. Public Navbar (bar putih penuh, position: sticky; top: 0) */}
      <NavbarErrorBoundary>
        <PublicNavbar />
      </NavbarErrorBoundary>

      {/* 3. Main Content (halaman publik) */}
      <main id="main-content" className="flex-1 w-full bg-white overflow-x-hidden">
        {children}
      </main>

      {/* 4. Footer */}
      <Footer />
    </div>
  );
}

export default PublicLayout;
