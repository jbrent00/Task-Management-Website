import { useEffect, useRef, useState } from 'react';
import { CaretDownIcon } from '@phosphor-icons/react/dist/csr/CaretDown';
import styles from './task-form-controls.module.css';

export default function TaskSelectField({ label, value, options, onChange, disabled = false, hideLabel = false, compact = false }) {
    const [open, setOpen] = useState(false);
    const root = useRef(null);
    const trigger = useRef(null);
    const optionRefs = useRef([]);
    const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
    const selected = options[selectedIndex];

    useEffect(() => {
        if (!open) return undefined;
        const closeOutside = (event) => { if (!root.current?.contains(event.target)) setOpen(false); };
        document.addEventListener('pointerdown', closeOutside);
        optionRefs.current[selectedIndex]?.focus();
        return () => document.removeEventListener('pointerdown', closeOutside);
    }, [open, selectedIndex]);

    const choose = (nextValue) => { onChange(nextValue); setOpen(false); trigger.current?.focus(); };
    const handleKeyDown = (event, index) => {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus(); }
        if (event.key === 'Tab') setOpen(false);
        const nextIndex = { ArrowDown: Math.min(index + 1, options.length - 1), ArrowUp: Math.max(index - 1, 0), Home: 0, End: options.length - 1 }[event.key];
        if (nextIndex !== undefined) { event.preventDefault(); optionRefs.current[nextIndex]?.focus(); }
    };

    return <div ref={root} className={`${styles.field} ${compact ? styles.compact : ''}`}>
        <span className={hideLabel ? styles.visuallyHidden : styles.label}>{label}</span>
        <div className={styles.anchor}>
            <button ref={trigger} type="button" className={styles.trigger} disabled={disabled} aria-label={label} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)} onKeyDown={(event) => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setOpen(true); } }}><span>{selected?.label ?? value}</span><CaretDownIcon size={16} aria-hidden="true" /></button>
            {open && <div className={styles.options} role="listbox" aria-label={label}>{options.map((option, index) => <button key={option.value} ref={(node) => { optionRefs.current[index] = node; }} type="button" role="option" aria-selected={option.value === value} onClick={() => choose(option.value)} onKeyDown={(event) => handleKeyDown(event, index)}>{option.label}</button>)}</div>}
        </div>
    </div>;
}
