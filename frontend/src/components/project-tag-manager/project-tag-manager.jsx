import { useId, useRef, useState } from 'react';
import { CaretDownIcon } from '@phosphor-icons/react/dist/csr/CaretDown';
import { CaretRightIcon } from '@phosphor-icons/react/dist/csr/CaretRight';
import { PencilSimpleIcon } from '@phosphor-icons/react/dist/csr/PencilSimple';
import { PlusIcon } from '@phosphor-icons/react/dist/csr/Plus';
import { TrashIcon } from '@phosphor-icons/react/dist/csr/Trash';
import { XIcon } from '@phosphor-icons/react/dist/csr/X';
import ConfirmDialog from '../confirm-dialog/confirm-dialog';
import TagColorPicker from '../tag-color-picker/tag-color-picker';
import styles from './project-tag-manager.module.css';

function ProjectTagManager({ tags, onCreateTag, onUpdateTag, onDeleteTag, onNotify }) {
    const panelId = useId();
    const [expanded, setExpanded] = useState(false);
    const [adding, setAdding] = useState(false);
    const [name, setName] = useState('');
    const [color, setColor] = useState('blue');
    const [editing, setEditing] = useState(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('blue');
    const [saving, setSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');
    const addTrigger = useRef(null);
    const addInput = useRef(null);
    const editTrigger = useRef(null);

    const closeAdd = () => {
        setAdding(false);
        setName('');
        window.requestAnimationFrame(() => addTrigger.current?.focus());
    };
    const add = async (event) => {
        event.preventDefault();
        if (!name.trim() || saving) return;
        setSaving(true);
        setError('');
        try {
            await onCreateTag(name, color);
            onNotify({ tone: 'success', message: `Created tag “${name.trim()}”.` });
            closeAdd();
        } catch {
            setError('Could not create that tag. Tag names must be unique.');
        } finally { setSaving(false); }
    };
    const startEdit = (tag, trigger) => {
        editTrigger.current = trigger;
        setEditing(tag.id);
        setEditName(tag.name);
        setEditColor(tag.color);
        setError('');
    };
    const closeEdit = () => {
        const tagId = editing;
        setEditing(null);
        window.requestAnimationFrame(() => (editTrigger.current?.isConnected ? editTrigger.current : document.querySelector(`[data-personal-tag-edit-id="${tagId}"]`))?.focus());
    };
    const saveEdit = async (event) => {
        event.preventDefault();
        if (!editName.trim() || saving) return;
        setSaving(true);
        setError('');
        try {
            await onUpdateTag(editing, editName, editColor);
            onNotify({ tone: 'success', message: `Saved tag “${editName.trim()}”.` });
            closeEdit();
        } catch {
            setError('Could not update that tag. Tag names must be unique.');
        } finally { setSaving(false); }
    };
    const remove = async () => {
        if (!deleteTarget || deleting) return;
        setDeleting(true);
        setError('');
        try {
            await onDeleteTag(deleteTarget.id);
            onNotify({ tone: 'success', message: `Deleted tag “${deleteTarget.name}”.` });
        } catch {
            setError('Could not delete that tag.');
        } finally {
            setDeleteTarget(null);
            setDeleting(false);
            window.requestAnimationFrame(() => addTrigger.current?.focus());
        }
    };

    return <section className={styles.manager} aria-label="Personal tags">
        <button className={styles.toggle} type="button" aria-expanded={expanded} aria-controls={panelId} onClick={() => { setExpanded((value) => !value); setAdding(false); setEditing(null); setError(''); }}><span><b>Personal tags</b><small>{tags.length} {tags.length === 1 ? 'tag' : 'tags'} available to your personal tasks</small></span>{expanded ? <CaretDownIcon aria-hidden="true" size={18} /> : <CaretRightIcon aria-hidden="true" size={18} />}</button>
        <div id={panelId} className={styles.panel} hidden={!expanded}>
            <div className={styles.intro}><div><h2>Tags</h2><p>Available to all your personal tasks.</p></div><button ref={addTrigger} type="button" className={styles.addTrigger} aria-label="Create personal tag" aria-expanded={adding} onClick={() => { if (adding) closeAdd(); else { setAdding(true); window.requestAnimationFrame(() => addInput.current?.focus()); } }}>{adding ? <XIcon size={16} /> : <PlusIcon size={17} />}</button></div>
            <div className={styles.tagList}>{tags.length ? tags.map((tag) => <div className={styles.tagRow} key={tag.id}>{editing === tag.id ? <form className={styles.editForm} onSubmit={saveEdit} onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); closeEdit(); } }}><input aria-label="Tag name" maxLength="24" required autoFocus value={editName} onChange={(event) => setEditName(event.target.value)} /><TagColorPicker label="Tag color" value={editColor} onChange={setEditColor} name={editName} /><button disabled={saving || !editName.trim()}>{saving ? 'Saving…' : 'Save'}</button><button type="button" onClick={closeEdit}>Cancel</button></form> : <><span className={`${styles.tag} ${styles[`tag_${tag.color}`]}`}>{tag.name}</span><div className={styles.actions}><button type="button" data-personal-tag-edit-id={tag.id} onClick={(event) => startEdit(tag, event.currentTarget)} aria-label={`Edit ${tag.name}`} title={`Edit ${tag.name}`}><PencilSimpleIcon size={15} aria-hidden="true" /></button><button type="button" onClick={() => setDeleteTarget(tag)} aria-label={`Delete ${tag.name}`} title={`Delete ${tag.name}`}><TrashIcon size={15} aria-hidden="true" /></button></div></>}</div>) : <p className={styles.empty}>No personal tags yet. Add one to organize your tasks.</p>}</div>
            {adding && <form className={styles.addForm} onSubmit={add} onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); closeAdd(); } }}><label>New tag<input ref={addInput} maxLength="24" required placeholder="Tag name" value={name} onChange={(event) => setName(event.target.value)} /></label><TagColorPicker value={color} onChange={setColor} name={name} action={<button disabled={saving || !name.trim()}>{saving ? 'Adding…' : 'Add tag'}</button>} /></form>}
            {error && <p className={styles.error} role="alert">{error}</p>}
        </div>
        {deleteTarget && <ConfirmDialog title="Delete tag?" confirmLabel="Delete tag" busyLabel="Deleting…" busy={deleting} onCancel={() => setDeleteTarget(null)} onConfirm={remove}>Delete “{deleteTarget.name}”? It will be removed from every personal task.</ConfirmDialog>}
    </section>;
}

export default ProjectTagManager;
