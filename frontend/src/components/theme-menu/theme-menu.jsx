import { createElement, useEffect, useRef, useState } from 'react';
import { CheckIcon } from '@phosphor-icons/react/dist/csr/Check';
import { DesktopIcon } from '@phosphor-icons/react/dist/csr/Desktop';
import { MoonIcon } from '@phosphor-icons/react/dist/csr/Moon';
import { PaletteIcon } from '@phosphor-icons/react/dist/csr/Palette';
import { SunIcon } from '@phosphor-icons/react/dist/csr/Sun';
import { useTheme } from '../theme-provider/theme-context';
import { IconButton } from '../ui/ui';
import styles from './theme-menu.module.css';

const options = [
    { value: 'system', label: 'System', Icon: DesktopIcon },
    { value: 'light', label: 'Light', Icon: SunIcon },
    { value: 'dark', label: 'Dark', Icon: MoonIcon },
];

export default function ThemeMenu({ collapsed = false }) {
    const { preference, setPreference } = useTheme();
    const [open, setOpen] = useState(false);
    const root = useRef(null);
    const trigger = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const handlePointer = (event) => { if (!root.current?.contains(event.target)) setOpen(false); };
        const handleKey = (event) => {
            if (event.key === 'Escape') {
                setOpen(false);
                trigger.current?.focus();
            }
        };
        document.addEventListener('pointerdown', handlePointer);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('pointerdown', handlePointer);
            document.removeEventListener('keydown', handleKey);
        };
    }, [open]);

    const selected = options.find((option) => option.value === preference);

    return <div className={styles.root} ref={root}>
        {collapsed ? <IconButton ref={trigger} label={`Theme: ${selected.label}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}><PaletteIcon size={20} /></IconButton>
            : <button ref={trigger} className={styles.trigger} type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}><PaletteIcon size={20} /><span>Theme</span><small>{selected.label}</small></button>}
        {open && <div className={styles.menu} role="menu" aria-label="Theme preference">
            {options.map((option) => <button key={option.value} type="button" role="menuitemradio" aria-checked={preference === option.value} onClick={() => { setPreference(option.value); setOpen(false); trigger.current?.focus(); }}>{createElement(option.Icon, { size: 18 })}<span>{option.label}</span>{preference === option.value && <CheckIcon className={styles.check} size={17} weight="bold" />}</button>)}
        </div>}
    </div>;
}
