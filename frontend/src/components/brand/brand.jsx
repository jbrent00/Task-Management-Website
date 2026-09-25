import { Link } from 'react-router-dom';
import styles from './brand.module.css';

export function FlowboardMark({ size = 28, title }) {
    return <svg className={styles.mark} width={size} height={size} viewBox="0 0 28 28" role={title ? 'img' : undefined} aria-hidden={title ? undefined : 'true'}>
        {title && <title>{title}</title>}
        <path d="M7.2 4.5h15.1a1.8 1.8 0 0 1 1.55 2.72l-1.45 2.43a2.8 2.8 0 0 1-2.4 1.36H4.9L7.2 4.5Z" />
        <path d="M4.9 11.1H20a1.8 1.8 0 0 1 1.55 2.72l-1.45 2.43a2.8 2.8 0 0 1-2.4 1.36H2.6l2.3-6.51Z" opacity=".82" />
        <path d="M2.6 17.7h15.1a1.8 1.8 0 0 1 1.55 2.72l-1.45 2.43a2.8 2.8 0 0 1-2.4 1.36H.3l2.3-6.51Z" opacity=".64" />
    </svg>;
}

export default function Brand({ compact = false, to = '/tasks' }) {
    return <Link className={styles.brand} to={to} aria-label="Flowboard home">
        <FlowboardMark />
        {!compact && <span>Flowboard</span>}
    </Link>;
}
