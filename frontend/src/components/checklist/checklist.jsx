import { useEffect, useRef, useState } from 'react';
import styles from './checklist.module.css';
import { createChecklistItem, deleteChecklistItem, reorderChecklistItems, updateChecklistItem } from '../../api/checklistItems';
import { useTaskMutation } from '../../functions/taskMutationContext';
import { CaretDownIcon } from '@phosphor-icons/react/dist/csr/CaretDown';
import { CaretRightIcon } from '@phosphor-icons/react/dist/csr/CaretRight';
import { CaretUpIcon } from '@phosphor-icons/react/dist/csr/CaretUp';
import { DotsSixVerticalIcon } from '@phosphor-icons/react/dist/csr/DotsSixVertical';
import { TrashIcon } from '@phosphor-icons/react/dist/csr/Trash';
import { PlusIcon } from '@phosphor-icons/react/dist/csr/Plus';

const reorder = (items, from, to) => { const next = [...items]; const [item] = next.splice(from, 1); next.splice(to, 0, item); return next; };

function Checklist({ taskId, items = [], getToken, onItemsChange, onNotify, draft = false, resetKey, openRequest = 0, hideEmpty = false, disabled = false, readOnly = false, defaultExpanded = false, onGenerate, generating = false, generateDisabled = false }) {
    const mutation = useTaskMutation();
    const [expanded, setExpanded] = useState(defaultExpanded);
    const [newText, setNewText] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editingText, setEditingText] = useState('');
    const [pending, setPending] = useState(false);
    const [confirmingId, setConfirmingId] = useState(null);
    const dragIndex = useRef(null);
    const inputRef = useRef(null);
    const completed = items.filter((item) => item.completed).length;
    const replace = (next) => onItemsChange(next);
    const blocked = pending || disabled || readOnly || (!draft && mutation?.busy);
    useEffect(() => {
        if (openRequest) setExpanded(true);
    }, [openRequest]);
    useEffect(() => { if (expanded && openRequest) inputRef.current?.focus(); }, [expanded, openRequest]);

    useEffect(() => {
        if (resetKey !== undefined) { setExpanded(defaultExpanded); setNewText(''); setEditingId(null); setEditingText(''); setConfirmingId(null); }
    }, [defaultExpanded, resetKey]);

    const add = async () => {
        const text = newText.trim();
        if (!text || text.length > 200 || items.length >= 100 || blocked) return;
        if (draft) { replace([...items, { id: `draft-${crypto.randomUUID()}`, text, completed: false }]); setNewText(''); inputRef.current?.focus(); return; }
        if (mutation && !mutation.begin()) return;
        setPending(true);
        try { const item = await createChecklistItem(await getToken(), taskId, text); replace([...items, item]); setNewText(''); inputRef.current?.focus(); }
        catch { onNotify({ tone: 'error', message: 'Could not add checklist item. Please try again.' }); }
        finally { setPending(false); mutation?.end(); }
    };
    const saveEdit = async (item) => {
        const text = editingText.trim();
        if (!text || text.length > 200 || text === item.text || blocked) { if (text === item.text) setEditingId(null); return; }
        if (draft) { replace(items.map((current) => current.id === item.id ? { ...current, text } : current)); setEditingId(null); return; }
        if (mutation && !mutation.begin()) return;
        setPending(true);
        try { const updated = await updateChecklistItem(await getToken(), taskId, item.id, { text }); replace(items.map((current) => current.id === item.id ? updated : current)); setEditingId(null); }
        catch { onNotify({ tone: 'error', message: 'Could not save checklist text. Your edit is still open.' }); }
        finally { setPending(false); mutation?.end(); }
    };
    const toggle = async (item) => {
        if (blocked) return;
        if (!draft && mutation && !mutation.begin()) return;
        const next = items.map((current) => current.id === item.id ? { ...current, completed: !current.completed } : current);
        replace(next);
        if (draft) return;
        setPending(true);
        try { const updated = await updateChecklistItem(await getToken(), taskId, item.id, { completed: !item.completed }); replace(items.map((current) => current.id === item.id ? updated : current)); }
        catch { replace(items); onNotify({ tone: 'error', message: 'Could not update checklist item. Its previous state was restored.' }); }
        finally { setPending(false); mutation?.end(); }
    };
    const remove = async (item) => {
        if (blocked) return;
        if (draft) { replace(items.filter((current) => current.id !== item.id)); return; }
        if (mutation && !mutation.begin()) return;
        setPending(true);
        try { await deleteChecklistItem(await getToken(), taskId, item.id); replace(items.filter((current) => current.id !== item.id)); setConfirmingId(null); }
        catch { onNotify({ tone: 'error', message: 'Could not delete checklist item. Please try again.' }); }
        finally { setPending(false); mutation?.end(); }
    };
    const move = async (from, to) => {
        if (blocked || to < 0 || to >= items.length || from === to) return;
        if (!draft && mutation && !mutation.begin()) return;
        const previous = items; const next = reorder(items, from, to); replace(next);
        if (draft) return;
        setPending(true);
        try { const saved = await reorderChecklistItems(await getToken(), taskId, next.map((item) => item.id)); replace(saved); }
        catch { replace(previous); onNotify({ tone: 'error', message: 'Could not reorder checklist. Its previous order was restored.' }); }
        finally { setPending(false); mutation?.end(); }
    };

    return <section hidden={hideEmpty && items.length === 0 && !expanded} className={styles.checklist} onPointerDown={(event) => event.stopPropagation()}>
        <fieldset disabled={pending || disabled || (!draft && mutation?.busy)} className={styles.editor}>
        <div className={styles.header}><button type="button" className={styles.toggle} onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} aria-controls={`checklist-${taskId ?? 'draft'}`}>{expanded ? <CaretDownIcon size={17} /> : <CaretRightIcon size={17} />} {items.length === 0 && !expanded ? 'Add checklist' : 'Checklist'}</button><div className={styles.headerActions}>{items.length > 0 && <span className={styles.progressText} role="status">{completed} of {items.length} complete</span>}{onGenerate && <button type="button" className={styles.generateButton} disabled={generateDisabled} onClick={() => { setExpanded(true); onGenerate(); }}>{generating ? 'Generating…' : 'Generate checklist'}</button>}</div></div>
        <div id={`checklist-${taskId ?? 'draft'}`} className={styles.content} hidden={!expanded}>
            <ul className={styles.items}>{items.map((item, index) => <li className={styles.item} key={item.id} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (dragIndex.current !== null) move(dragIndex.current, index); dragIndex.current = null; }}>
                <input type="checkbox" checked={item.completed} disabled={pending || readOnly} onChange={() => toggle(item)} aria-label={`Mark ${item.text} complete`} />
                {editingId === item.id ? <input className={styles.editInput} autoFocus value={editingText} maxLength="200" disabled={pending} onChange={(event) => setEditingText(event.target.value)} onBlur={() => saveEdit(item)} onKeyDown={(event) => { if (event.key === 'Enter') saveEdit(item); if (event.key === 'Escape') setEditingId(null); }} /> : readOnly ? <span className={`${styles.itemText} ${item.completed ? styles.completed : ''}`}>{item.text}</span> : <button type="button" className={`${styles.itemText} ${item.completed ? styles.completed : ''}`} onClick={() => { setEditingId(item.id); setEditingText(item.text); }}>{item.text}</button>}
                {!readOnly && <div className={styles.itemActions}><button type="button" disabled={pending || index === 0} onClick={() => move(index, index - 1)} aria-label={`Move ${item.text} up`}><CaretUpIcon size={16} /></button><button type="button" disabled={pending || index === items.length - 1} onClick={() => move(index, index + 1)} aria-label={`Move ${item.text} down`}><CaretDownIcon size={16} /></button><button type="button" disabled={pending} onClick={() => draft ? remove(item) : setConfirmingId(item.id)} aria-label={`Delete ${item.text}`}><TrashIcon size={16} /></button></div>}
                {!readOnly && <span className={styles.grip} draggable={!pending} onDragStart={() => { dragIndex.current = index; }} title="Drag to reorder" aria-hidden="true"><DotsSixVerticalIcon size={17} /></span>}
                {confirmingId === item.id && <div className={styles.confirm}><span>Delete this item?</span><button type="button" disabled={pending} onClick={() => remove(item)}>Delete</button><button type="button" disabled={pending} onClick={() => setConfirmingId(null)}>Cancel</button></div>}
            </li>)}</ul>
            {!readOnly && <div className={styles.addRow}><span className={styles.addIcon} aria-hidden="true"><PlusIcon size={16} /></span><input ref={inputRef} aria-label="Add subtask" value={newText} maxLength="200" disabled={pending || items.length >= 100} placeholder="Add subtask…" onChange={(event) => setNewText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); add(); } }} />{Boolean(newText.trim()) && <button type="button" disabled={pending || items.length >= 100} onClick={add}>Add</button>}</div>}
            {items.length >= 100 && <p className={styles.limit}>Checklist limit reached (100 items).</p>}
        </div></fieldset>
    </section>;
}
export default Checklist;
