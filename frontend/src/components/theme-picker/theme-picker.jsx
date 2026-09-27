import { createElement, useEffect, useId, useRef, useState } from 'react';
import { CaretDownIcon } from '@phosphor-icons/react/dist/csr/CaretDown';
import { CheckIcon } from '@phosphor-icons/react/dist/csr/Check';
import { DesktopIcon } from '@phosphor-icons/react/dist/csr/Desktop';
import { MoonIcon } from '@phosphor-icons/react/dist/csr/Moon';
import { SunIcon } from '@phosphor-icons/react/dist/csr/Sun';
import { useTheme } from '../theme-provider/theme-context';
import styles from './theme-picker.module.css';

const options = [
  { value: 'system', label: 'System', Icon: DesktopIcon },
  { value: 'light', label: 'Light', Icon: SunIcon },
  { value: 'dark', label: 'Dark', Icon: MoonIcon },
];

export default function ThemePicker() {
  const { preference, setPreference } = useTheme();
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const trigger = useRef(null);
  const menu = useRef(null);
  const menuId = useId();
  const selected = options.find((option) => option.value === preference) ?? options[0];

  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => { if (!root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [open]);

  useEffect(() => { if (open) menu.current?.querySelector('[aria-checked="true"]')?.focus(); }, [open]);

  const handleKeyDown = (event) => {
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
      trigger.current?.focus();
    }
    if (!open || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const items = [...menu.current.querySelectorAll('[role="menuitemradio"]')];
    const index = items.indexOf(document.activeElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    items[next]?.focus();
  };

  return <div className={styles.root} ref={root} onKeyDown={handleKeyDown} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <button ref={trigger} className={styles.trigger} type="button" aria-label={`Theme: ${selected.label}`} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined} onClick={() => setOpen((value) => !value)}>
      <selected.Icon size={17} aria-hidden="true" /><span>Theme</span><strong>{selected.label}</strong><CaretDownIcon className={styles.chevron} size={13} aria-hidden="true" />
    </button>
    {open && <div className={styles.menu} id={menuId} ref={menu} role="menu" aria-label="Theme preference">
      {options.map(({ value, label, Icon }) => <button key={value} type="button" role="menuitemradio" aria-checked={preference === value} onClick={() => { setPreference(value); setOpen(false); trigger.current?.focus(); }}>
        {createElement(Icon, { size: 18, 'aria-hidden': true })}<span>{label}</span>{preference === value && <CheckIcon className={styles.check} size={16} weight="bold" aria-hidden="true" />}
      </button>)}
    </div>}
  </div>;
}
