import { createElement } from 'react';
import styles from './ui.module.css';

export function Button({ className = '', tone = 'primary', ...props }) {
    return <button className={`${styles.button} ${styles[tone]} ${className}`} {...props} />;
}

export function IconButton({ label, className = '', children, ...props }) {
    return <button className={`${styles.iconButton} ${className}`} aria-label={label} {...props}>{children}</button>;
}

export function Field({ label, hint, error, id, children }) {
    return <div className={styles.field}>
        <label htmlFor={id}>{label}</label>
        {children}
        {hint && !error && <small>{hint}</small>}
        {error && <small className={styles.fieldError} role="alert">{error}</small>}
    </div>;
}

export function Panel({ as: Component = 'section', className = '', ...props }) {
    return createElement(Component, { className: `${styles.panel} ${className}`, ...props });
}

export function Skeleton({ className = '', ...props }) {
    return <span className={`${styles.skeleton} ${className}`} aria-hidden="true" {...props} />;
}

export function EmptyState({ title, description, action }) {
    return <div className={styles.emptyState}>
        <h2>{title}</h2>
        <p>{description}</p>
        {action}
    </div>;
}

export function Feedback({ tone = 'info', children, action }) {
    return <div className={`${styles.feedback} ${styles[tone]}`} role={tone === 'error' ? 'alert' : 'status'}>
        <span>{children}</span>
        {action}
    </div>;
}
