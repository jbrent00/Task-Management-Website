import { useEffect, useRef, useState } from 'react';
import styles from './task-card.module.css';
import { DotsThreeIcon } from '@phosphor-icons/react/dist/csr/DotsThree';

export default function TaskActions({ taskId, disabled, onOpenDetails, onParticipation, participationLabel }) {
    const [open, setOpen] = useState(false);
    const root = useRef(null);
    const trigger = useRef(null);
    const menu = useRef(null);
    const close = (restore = false) => { setOpen(false); if (restore) trigger.current?.focus(); };
    useEffect(() => {
        if (!open) return undefined;
        menu.current?.querySelector('button')?.focus();
        const outside = (event) => { if (!root.current?.contains(event.target)) setOpen(false); };
        document.addEventListener('pointerdown', outside);
        return () => document.removeEventListener('pointerdown', outside);
    }, [open]);
    const choose = (action) => { close(); action(); };
    const navigate = (event) => {
        const buttons = [...menu.current.querySelectorAll('button')];
        const index = buttons.indexOf(document.activeElement);
        if (event.key === 'Escape') { event.preventDefault(); close(true); }
        if (event.key === 'Tab') close();
        if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
            event.preventDefault();
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
            buttons[next]?.focus();
        }
    };
    return <div className={styles.menuRoot} ref={root}>
        <button ref={trigger} type="button" className={styles.button} disabled={disabled} aria-label="Task actions" aria-haspopup="menu" aria-expanded={open} aria-controls={`task-actions-${taskId}`} onClick={() => setOpen((value) => !value)} onKeyDown={(event) => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setOpen(true); } if (event.key === 'Escape') close(true); }}><span className={styles.menuTriggerFace} aria-hidden="true"><DotsThreeIcon size={20} weight="bold" /></span></button>
        {open && <div ref={menu} id={`task-actions-${taskId}`} className={styles.menu} role="menu" aria-label="Task actions" onKeyDown={navigate}>
            {onOpenDetails && <button role="menuitem" type="button" onClick={() => choose(onOpenDetails)}>Open details</button>}
            {onParticipation && <button role="menuitem" type="button" onClick={() => choose(onParticipation)}>{participationLabel}</button>}
        </div>}
    </div>;
}
