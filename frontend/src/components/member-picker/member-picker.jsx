import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './member-picker.module.css';
import { CaretDownIcon } from '@phosphor-icons/react/dist/csr/CaretDown';
import { XIcon } from '@phosphor-icons/react/dist/csr/X';

const nameOf = (member) => [member.user?.fname, member.user?.lname].filter(Boolean).join(' ') || member.user?.primaryEmail || 'Member';

export default function MemberPicker({ members, selectedIds, onChange, disabled = false, label = 'Assignees' }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const root = useRef(null);
    const search = useRef(null);
    const eligible = useMemo(() => members.filter((member) => member.role !== 'viewer'), [members]);
    const visible = eligible.filter((member) => `${nameOf(member)} ${member.user?.primaryEmail ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()));
    useEffect(() => {
        if (!open) return undefined;
        search.current?.focus();
        const outside = (event) => { if (!root.current?.contains(event.target)) setOpen(false); };
        document.addEventListener('pointerdown', outside);
        return () => document.removeEventListener('pointerdown', outside);
    }, [open]);
    const selected = eligible.filter((member) => selectedIds.includes(member.userId));
    const toggle = (userId) => onChange(selectedIds.includes(userId) ? selectedIds.filter((id) => id !== userId) : [...selectedIds, userId]);
    return <div className={styles.root} ref={root}>
        <span className={styles.label}>{label}</span>
        <button type="button" className={styles.trigger} disabled={disabled} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
            <span>{selected.length ? `${selected.length} selected` : 'Unassigned'}</span><CaretDownIcon aria-hidden="true" size={16} />
        </button>
        {selected.length > 0 && <div className={styles.chips}>{selected.map((member) => <span key={member.userId}>{nameOf(member)}<button type="button" disabled={disabled} aria-label={`Remove ${nameOf(member)}`} onClick={() => toggle(member.userId)}><XIcon size={13} /></button></span>)}</div>}
        {open && <section className={styles.popover} role="dialog" aria-label="Choose assignees" onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); setOpen(false); } }}>
            <input ref={search} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search project members" aria-label="Search project members" />
            <div className={styles.options}>{visible.length ? visible.map((member) => <label key={member.userId}>
                <input type="checkbox" checked={selectedIds.includes(member.userId)} onChange={() => toggle(member.userId)} />
                {member.user?.imageUrl ? <img src={member.user.imageUrl} alt="" /> : <span className={styles.avatar}>{nameOf(member).slice(0, 1).toUpperCase()}</span>}
                <span><strong>{nameOf(member)}</strong><small>{member.user?.primaryEmail}</small></span>
            </label>) : <p>No matching members.</p>}</div>
            <button type="button" className={styles.done} onClick={() => setOpen(false)}>Done</button>
        </section>}
    </div>;
}
