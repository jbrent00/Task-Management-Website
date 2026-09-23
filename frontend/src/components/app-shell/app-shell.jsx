import { NavLink } from 'react-router-dom';
import { UserButton } from '@clerk/react';
import styles from './app-shell.module.css';

export default function AppShell({ children }) {
    return <div className={styles.shell}>
        <header className={styles.header}>
            <NavLink className={styles.brand} to="/tasks"><span>Flowboard</span></NavLink>
            <nav aria-label="Primary navigation">
                <NavLink to="/tasks" className={({ isActive }) => isActive ? styles.active : undefined}>My tasks</NavLink>
                <NavLink to="/projects" className={({ isActive }) => isActive ? styles.active : undefined}>Projects</NavLink>
            </nav>
            <UserButton />
        </header>
        <main>{children}</main>
    </div>;
}
