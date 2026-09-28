import { createElement, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { UserButton } from '@clerk/react';
import { CaretLeftIcon } from '@phosphor-icons/react/dist/csr/CaretLeft';
import { CaretRightIcon } from '@phosphor-icons/react/dist/csr/CaretRight';
import { CheckSquareIcon } from '@phosphor-icons/react/dist/csr/CheckSquare';
import { FolderIcon } from '@phosphor-icons/react/dist/csr/Folder';
import { UserPlusIcon } from '@phosphor-icons/react/dist/csr/UserPlus';
import Brand from '../brand/brand';
import CollaborationInbox from '../collaboration-inbox/collaboration-inbox';
import ThemeMenu from '../theme-menu/theme-menu';
import { IconButton } from '../ui/ui';
import styles from './app-shell.module.css';

const SIDEBAR_STORAGE_KEY = 'flowboard:sidebar-collapsed';
const userButtonAppearance = { elements: { avatarBox: { width: '34px', height: '34px' } } };

const navItems = [
    { to: '/tasks', label: 'My tasks', Icon: CheckSquareIcon },
    { to: '/projects', label: 'Projects', Icon: FolderIcon },
];

function ProductNav({ mobile = false, demo = false }) {
    return <nav className={mobile ? styles.bottomNav : styles.primaryNav} aria-label={mobile ? 'Mobile navigation' : 'Primary navigation'}>
        {navItems.map((item) => <NavLink key={item.to} to={demo ? `/demo${item.to}` : item.to} className={({ isActive }) => isActive ? styles.active : undefined}>{createElement(item.Icon, { size: 21, weight: 'regular' })}<span>{item.label}</span></NavLink>)}
    </nav>;
}

export default function AppShell({ children, demo = false }) {
    const [collapsed, setCollapsed] = useState(() => window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true');
    const toggleSidebar = () => setCollapsed((current) => {
        const next = !current;
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
        return next;
    });

    return <div className={`${styles.shell} ${collapsed ? styles.collapsed : ''}`}>
        <aside className={styles.sidebar} aria-label="Application sidebar">
            <div className={styles.sidebarBrand}><Brand compact={collapsed} to="/" reloadDocument={demo} /></div>
            <ProductNav demo={demo} />
            <div className={styles.sidebarFooter}>
                <ThemeMenu collapsed={collapsed} />
                <div className={styles.desktopAccount}>
                    {demo ? <a className={styles.guestLink} href="/sign-up" aria-label="Create account"><UserPlusIcon size={18} aria-hidden="true" /><span>Create account</span></a> : <><CollaborationInbox compact={collapsed} /><div className={styles.userButton}><UserButton appearance={userButtonAppearance} /></div>{!collapsed && <span>Account</span>}</>}
                </div>
            </div>
            <IconButton className={styles.collapseButton} label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={toggleSidebar}>{collapsed ? <CaretRightIcon size={18} /> : <CaretLeftIcon size={18} />}</IconButton>
        </aside>

        <header className={styles.mobileHeader}>
            <Brand to="/" reloadDocument={demo} />
            <div className={styles.mobileActions}><ThemeMenu collapsed />{demo ? <a className={styles.guestLink} href="/sign-up">Sign up</a> : <><CollaborationInbox compact /><div className={styles.userButton}><UserButton appearance={userButtonAppearance} /></div></>}</div>
        </header>

        <main className={styles.main}>{children}</main>
        <ProductNav mobile demo={demo} />
    </div>;
}
