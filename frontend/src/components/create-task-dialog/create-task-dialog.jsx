import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { XIcon } from '@phosphor-icons/react/dist/csr/X';
import styles from './create-task-dialog.module.css';

export default function CreateTaskDialog({ open, title, onClose, returnFocusSelector, children }) {
    const dialogRef = useRef(null);
    const closeRef = useRef(null);
    const previousFocus = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        previousFocus.current = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const firstField = dialogRef.current?.querySelector('input:not(:disabled)');
        (firstField ?? closeRef.current)?.focus();
        return () => {
            document.body.style.overflow = previousOverflow;
            const target = previousFocus.current?.isConnected ? previousFocus.current : document.querySelector(returnFocusSelector);
            target?.focus();
        };
    }, [open, returnFocusSelector]);

    const handleKeyDown = (event) => {
        if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
        if (event.key !== 'Tab') return;
        const focusable = [...dialogRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href]')];
        if (!focusable.length) { event.preventDefault(); return; }
        if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1).focus(); }
        else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0].focus(); }
    };

    return createPortal(<div className={styles.backdrop} hidden={!open} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
        <section ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-label={title} onKeyDown={handleKeyDown}>
            <button ref={closeRef} className={styles.close} type="button" onClick={onClose} aria-label="Close create task"><XIcon size={20} /></button>
            {children}
        </section>
    </div>, document.body);
}
