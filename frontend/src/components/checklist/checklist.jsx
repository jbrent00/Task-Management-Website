import { useEffect, useRef, useState } from 'react';
import styles from './checklist.module.css';
import { createChecklistItem, deleteChecklistItem, reorderChecklistItems, updateChecklistItem } from '../../api/checklistItems';

const reorder = (items, from, to) => { const next = [...items]; const [item] = next.splice(from, 1); next.splice(to, 0, item); return next; };

function Checklist({ taskId, items = [], getToken, onItemsChange, onNotify, draft = false, resetKey }) {
    const [expanded, setExpanded] = useState(false);
    const [newText, setNewText] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editingText, setEditingText] = useState('');
    const [pending, setPending] = useState(false);
    const [confirmingId, setConfirmingId] = useState(null);
    const dragIndex = useRef(null);
    const inputRef = useRef(null);
    const completed = items.filter((item) => item.completed).length;
    const percent = items.length ? Math.round((completed / items.length) * 100) : 0;
    const replace = (next) => onItemsChange(next);

    useEffect(() => {
        if (resetKey !== undefined) setExpanded(false);
    }, [resetKey]);

    const add = async () => {
        const text = newText.trim();
        if (!text || text.length > 200 || items.length >= 100 || pending) return;
        if (draft) { replace([...items, { id: `draft-${crypto.randomUUID()}`, text, completed: false }]); setNewText(''); inputRef.current?.focus(); return; }
        setPending(true);
        try { const item = await createChecklistItem(await getToken(), taskId, text); replace([...items, item]); setNewText(''); inputRef.current?.focus(); }
        catch { onNotify({ tone: 'error', message: 'Could not add checklist item. Please try again.' }); }
        finally { setPending(false); }
    };
    const saveEdit = async (item) => {
        const text = editingText.trim();
        if (!text || text.length > 200 || text === item.text || pending) { if (text === item.text) setEditingId(null); return; }
        if (draft) { replace(items.map((current) => current.id === item.id ? { ...current, text } : current)); setEditingId(null); return; }
        setPending(true);
        try { const updated = await updateChecklistItem(await getToken(), taskId, item.id, { text }); replace(items.map((current) => current.id === item.id ? updated : current)); setEditingId(null); }
        catch { onNotify({ tone: 'error', message: 'Could not save checklist text. Your edit is still open.' }); }
        finally { setPending(false); }
    };
    const toggle = async (item) => {
        if (pending) return;
        const next = items.map((current) => current.id === item.id ? { ...current, completed: !current.completed } : current);
        replace(next);
        if (draft) return;
        setPending(true);
        try { const updated = await updateChecklistItem(await getToken(), taskId, item.id, { completed: !item.completed }); replace(items.map((current) => current.id === item.id ? updated : current)); }
        catch { replace(items); onNotify({ tone: 'error', message: 'Could not update checklist item. Its previous state was restored.' }); }
        finally { setPending(false); }
    };
    const remove = async (item) => {
        if (draft) { replace(items.filter((current) => current.id !== item.id)); return; }
        setPending(true);
        try { await deleteChecklistItem(await getToken(), taskId, item.id); replace(items.filter((current) => current.id !== item.id)); setConfirmingId(null); }
        catch { onNotify({ tone: 'error', message: 'Could not delete checklist item. Please try again.' }); }
        finally { setPending(false); }
    };
    const move = async (from, to) => {
        if (pending || to < 0 || to >= items.length || from === to) return;
        const previous = items; const next = reorder(items, from, to); replace(next);
        if (draft) return;
        setPending(true);
        try { const saved = await reorderChecklistItems(await getToken(), taskId, next.map((item) => item.id)); replace(saved); }
        catch { replace(previous); onNotify({ tone: 'error', message: 'Could not reorder checklist. Its previous order was restored.' }); }
        finally { setPending(false); }
    };

    return <section className={styles.checklist} onPointerDown={(event) => event.stopPropagation()}>
        <div className={styles.header}><button type="button" className={styles.toggle} onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} aria-controls={`checklist-${taskId ?? 'draft'}`}>{expanded ? '▾' : '▸'} {items.length === 0 && !expanded ? 'Add checklist' : 'Checklist'}</button>{items.length > 0 && <span className={styles.progressText}>{completed} of {items.length} complete</span>}</div>
        {items.length > 0 && <div className={styles.progress} role="progressbar" aria-label="Checklist progress" aria-valuemin="0" aria-valuemax={items.length} aria-valuenow={completed}><span style={{ width: `${percent}%` }} /></div>}
        <div id={`checklist-${taskId ?? 'draft'}`} className={styles.content} hidden={!expanded}>
            <ul className={styles.items}>{items.map((item, index) => <li className={styles.item} key={item.id} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (dragIndex.current !== null) move(dragIndex.current, index); dragIndex.current = null; }}>
                <span className={styles.grip} draggable={!pending} onDragStart={() => { dragIndex.current = index; }} title="Drag to reorder" aria-hidden="true">⋮⋮</span>
                <input type="checkbox" checked={item.completed} disabled={pending} onChange={() => toggle(item)} aria-label={`Mark ${item.text} complete`} />
                {editingId === item.id ? <input className={styles.editInput} autoFocus value={editingText} maxLength="200" disabled={pending} onChange={(event) => setEditingText(event.target.value)} onBlur={() => saveEdit(item)} onKeyDown={(event) => { if (event.key === 'Enter') saveEdit(item); if (event.key === 'Escape') setEditingId(null); }} /> : <button type="button" className={`${styles.itemText} ${item.completed ? styles.completed : ''}`} onClick={() => { setEditingId(item.id); setEditingText(item.text); }}>{item.text}</button>}
                <div className={styles.itemActions}><button type="button" disabled={pending || index === 0} onClick={() => move(index, index - 1)} aria-label={`Move ${item.text} up`}>↑</button><button type="button" disabled={pending || index === items.length - 1} onClick={() => move(index, index + 1)} aria-label={`Move ${item.text} down`}>↓</button><button type="button" disabled={pending} onClick={() => draft ? remove(item) : setConfirmingId(item.id)} aria-label={`Delete ${item.text}`}>×</button></div>
                {confirmingId === item.id && <div className={styles.confirm}><span>Delete this item?</span><button type="button" disabled={pending} onClick={() => remove(item)}>Delete</button><button type="button" disabled={pending} onClick={() => setConfirmingId(null)}>Cancel</button></div>}
            </li>)}</ul>
            <div className={styles.addRow}><input ref={inputRef} value={newText} maxLength="200" disabled={pending || items.length >= 100} placeholder={items.length ? 'Add an item' : 'Add checklist item'} onChange={(event) => setNewText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); add(); } }} /><button type="button" disabled={pending || !newText.trim() || items.length >= 100} onClick={add}>Add</button></div>
            {items.length >= 100 && <p className={styles.limit}>Checklist limit reached (100 items).</p>}
        </div>
    </section>;
}
export default Checklist;
