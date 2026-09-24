import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './confirm-dialog.module.css';

function ConfirmDialog({
    title,
    children,
    confirmLabel = 'Confirm',
    busyLabel = 'Working…',
    tone = 'danger',
    busy = false,
    onConfirm,
    onCancel,
}) {
    const titleId = useId();
    const descriptionId = useId();
    const dialogRef = useRef(null);
    const cancelRef = useRef(null);

    useEffect(() => {
        const previouslyFocused = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        cancelRef.current?.focus();

        return () => {
            document.body.style.overflow = previousOverflow;
            if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) previouslyFocused.focus();
        };
    }, []);

    const cancel = () => {
        if (!busy) onCancel();
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            cancel();
            return;
        }
        if (event.key !== 'Tab') return;

        const focusable = [...dialogRef.current.querySelectorAll('button:not(:disabled)')];
        if (!focusable.length) {
            event.preventDefault();
            return;
        }
        if (event.shiftKey && document.activeElement === focusable[0]) {
            event.preventDefault();
            focusable.at(-1)?.focus();
        } else if (!event.shiftKey && document.activeElement === focusable.at(-1)) {
            event.preventDefault();
            focusable[0]?.focus();
        }
    };

    return createPortal(
        <div className={styles.backdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) cancel(); }}>
            <section
                ref={dialogRef}
                className={styles.dialog}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                onKeyDown={handleKeyDown}
            >
                <div className={`${styles.marker} ${styles[tone]}`} aria-hidden="true" />
                <div className={styles.content}>
                    <h2 id={titleId}>{title}</h2>
                    <div id={descriptionId} className={styles.description}>{children}</div>
                </div>
                <div className={styles.actions}>
                    <button ref={cancelRef} type="button" className={styles.cancel} disabled={busy} onClick={cancel}>Cancel</button>
                    <button type="button" className={`${styles.confirm} ${styles[tone]}`} disabled={busy} onClick={onConfirm}>{busy ? busyLabel : confirmLabel}</button>
                </div>
            </section>
        </div>,
        document.body,
    );
}

export default ConfirmDialog;
