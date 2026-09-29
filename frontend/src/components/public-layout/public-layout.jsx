import { useState } from 'react';
import { useAuth } from '@clerk/react';
import { Link } from 'react-router-dom';
import { ArrowUpRightIcon } from '@phosphor-icons/react/dist/csr/ArrowUpRight';
import { ArrowRightIcon } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { ListIcon } from '@phosphor-icons/react/dist/csr/List';
import { XIcon } from '@phosphor-icons/react/dist/csr/X';
import Brand from '../brand/brand';
import ThemePicker from '../theme-picker/theme-picker';
import styles from './public-layout.module.css';

export const repoUrl = 'https://github.com/jbrent00/Task-Management-Website';

export function PublicHeader() {
  const { isSignedIn } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  return <header className={styles.header}>
    <div className={styles.headerInner}>
      <Brand to="/" />
      <button className={styles.menuToggle} type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}>{menuOpen ? <XIcon size={21} /> : <ListIcon size={21} />}</button>
      <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`} aria-label="Public navigation" onClick={(event) => { if (event.target.closest('a')) setMenuOpen(false); }}>
        <a href="/#product">Product</a>
        <Link to="/case-study">Case study</Link>
        <a href={repoUrl} target="_blank" rel="noopener noreferrer">GitHub <ArrowUpRightIcon size={14} aria-hidden="true" /></a>
        <ThemePicker />
        {!isSignedIn && <Link className={styles.accountLink} to="/sign-in">Sign in</Link>}
        {isSignedIn
          ? <Link className={styles.navCta} to="/tasks">Open workspace <ArrowRightIcon size={16} aria-hidden="true" /></Link>
          : <a className={styles.navCta} href="/demo">Explore the demo <ArrowRightIcon size={16} aria-hidden="true" /></a>}
      </nav>
    </div>
  </header>;
}

export function PublicFooter() {
  return <footer className={styles.footer}>
    <div className={styles.footerInner}><Brand to="/" /><p>Designed and built by Justin Brent.</p><div><Link to="/case-study">Case study</Link><a href={repoUrl} target="_blank" rel="noopener noreferrer">GitHub <ArrowUpRightIcon size={14} aria-hidden="true" /></a></div></div>
  </footer>;
}

export function PublicLayout({ children }) {
  return <div className={styles.publicPage}><a className={styles.skipLink} href="#main-content">Skip to content</a><PublicHeader />{children}</div>;
}
