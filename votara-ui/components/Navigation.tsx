'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import styles from './Navigation.module.css';

export function Navigation() {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { ready, authenticated, login, logout, walletAddress } = useAuth();

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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>

            <Link href="/" className={styles.logo}>
              <Image
                src="/votara.png"
                alt="Votara"
                width={75}
                height={75}
              />
            </Link>
          </div>

          <div className={styles.walletWrapper}>
            {!ready ? (
              <button disabled className={styles.authButton}>Loading...</button>
            ) : !authenticated ? (
              <button onClick={login} className={styles.authButton}>
                Connect Wallet
              </button>
            ) : (
              <div className={styles.walletInfo}>
                <span className={styles.walletAddress}>
                  {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                </span>
                <button onClick={logout} className={styles.logoutButton}>
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <div className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>Menu</h2>
          <button
            className={styles.closeButton}
            onClick={closeSidebar}
            aria-label="Close menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className={styles.sidebarContent}>
          <Link
            href="/"
            className={`${styles.sidebarLink} ${isActive('/') && pathname === '/' ? styles.sidebarLinkActive : ''}`}
            onClick={closeSidebar}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            </svg>
            All Polls
          </Link>

          <Link
            href="/my-polls"
            className={`${styles.sidebarLink} ${isActive('/my-polls') ? styles.sidebarLinkActive : ''}`}
            onClick={closeSidebar}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            My Polls
          </Link>

          <Link
            href="/create"
            className={`${styles.sidebarLink} ${isActive('/create') ? styles.sidebarLinkActive : ''}`}
            onClick={closeSidebar}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Create Poll
          </Link>
        </div>
      </div>

      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className={styles.overlay}
          onClick={closeSidebar}
        />
      )}
    </>
  );
}

