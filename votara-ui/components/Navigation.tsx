'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  return (
    <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link
          href="/"
          className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-400 bg-clip-text text-transparent"
        >
          Votara
        </Link>

        <div className="flex gap-8 items-center">
          <Link
            href="/"
            className={`font-medium transition-colors relative ${
              isActive('/') && pathname === '/'
                ? 'text-blue-600 after:absolute after:bottom-[-0.5rem] after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-blue-600 after:to-cyan-400'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Home
          </Link>
          <Link
            href="/create"
            className={`font-medium transition-colors relative ${
              isActive('/create')
                ? 'text-blue-600 after:absolute after:bottom-[-0.5rem] after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-blue-600 after:to-cyan-400'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Create Poll
          </Link>
        </div>
      </div>
    </nav>
  );
}

