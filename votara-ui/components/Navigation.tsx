'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Wallet } from '@coinbase/onchainkit/wallet';
import { useAuth } from '@/lib/hooks/useAuth';
import styles from './Navigation.module.css';

export function Navigation() {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { address, isConnected } = useAccount();
  const { authenticated, login, loading, logout } = useAuth();

  // Auto-login when wallet connects
  useEffect(() => {
    console.log(isConnected, address, authenticated, loading);
    if (isConnected && address && !authenticated && !loading) {
      login();
    }
  }, [isConnected, address, authenticated, loading, login]);

  // Reset auth state when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      logout();
    }
  }, [isConnected, logout]);

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.container}>
          <div className={styles.leftSection}>
            <button
              className={styles.menuButton}
              onClick={toggleSidebar}
              aria-label="Toggle menu"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>

            <div>
              <Link href="/" className={styles.logo}>
                <img
                  src="/votara.png"
                  alt="Votara"
                  // width={55}
                  // height={55}
                  className={styles.logoImage}
                />
              </Link>
            </div>
          </div>

          <div className={styles.walletWrapper}>
            <Wallet />
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <div
        className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ""}`}
      >
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>Menu</h2>
          <button
            className={styles.closeButton}
            onClick={closeSidebar}
            aria-label="Close menu"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className={styles.sidebarContent}>
          <Link
            href="/"
            className={`${styles.sidebarLink} ${isActive("/") && pathname === "/" ? styles.sidebarLinkActive : ""}`}
            onClick={closeSidebar}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            </svg>
            All Polls
          </Link>

          <Link
            href="/my-polls"
            className={`${styles.sidebarLink} ${isActive("/my-polls") ? styles.sidebarLinkActive : ""}`}
            onClick={closeSidebar}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            My Polls
          </Link>

          <Link
            href="/create"
            className={`${styles.sidebarLink} ${isActive("/create") ? styles.sidebarLinkActive : ""}`}
            onClick={closeSidebar}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Create Poll
          </Link>
        </div>
      </div>

      {/* Overlay */}
      {isSidebarOpen && (
        <div className={styles.overlay} onClick={closeSidebar} />
      )}
    </>
  );
}

