import { useState } from 'react';
import ConfirmDialog from '../confirm-dialog/confirm-dialog';
import styles from './project-tag-manager.module.css';

const colors = ['slate', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple'];

function ProjectTagManager({ tags, onUpdateTag, onDeleteTag, onNotify }) {
    const [open, setOpen] = useState(false);
    const [tagName, setTagName] = useState('');
    const [tagColor, setTagColor] = useState('blue');
    const [editingTag, setEditingTag] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');

    const close = () => {
        setOpen(false);
        setEditingTag(null);
        setError('');
    };
    const startTagEdit = (tag) => {
        setTagName(tag.name);
        setTagColor(tag.color);
        setEditingTag(tag);
        setError('');
    };
    const saveTag = async (event) => {
        event.preventDefault();
        try {
            await onUpdateTag(editingTag.id, tagName, tagColor);
            onNotify({ tone: 'success', message: `Saved tag “${tagName.trim()}”.` });
            setEditingTag(null);
            setError('');
        } catch {
            setError('Could not update that tag. Tag names must be unique and the color must be from the palette.');
        }
    };
    const deleteTag = async () => {
        if (!deleteTarget || deleting) return;
        setDeleting(true);
        try {
            await onDeleteTag(deleteTarget.id);
            onNotify({ tone: 'success', message: `Deleted tag “${deleteTarget.name}”.` });
            setDeleteTarget(null);
        } catch {
            setError('Could not delete that tag.');
            setDeleteTarget(null);
        } finally { setDeleting(false); }
    };

    return <div className={styles.manager}>
        <button type="button" onClick={() => { setOpen((current) => !current); setError(''); }}>Manage tags</button>
        {open && <section className={styles.panel} aria-label="Manage tags"><h2>Tags</h2>{tags.map((tag) => <div className={styles.row} key={tag.id}><span className={`${styles.tag} ${styles[`tag_${tag.color}`]}`}>{tag.name}</span><button type="button" onClick={() => startTagEdit(tag)}>Edit</button><button type="button" onClick={() => setDeleteTarget(tag)}>Delete</button></div>)}<button type="button" onClick={close}>Close</button></section>}
        {editingTag && <div className={styles.dialogBackdrop}><form className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="edit-tag-title" onSubmit={saveTag}><h2 id="edit-tag-title">Edit tag</h2><label>Tag name<input value={tagName} maxLength="24" onChange={(event) => setTagName(event.target.value)} required autoFocus /></label><label>Color<select value={tagColor} onChange={(event) => setTagColor(event.target.value)}>{colors.map((color) => <option key={color} value={color}>{color}</option>)}</select></label><div className={styles.dialogActions}><button type="button" onClick={() => setEditingTag(null)}>Cancel</button><button type="submit">Save tag</button></div></form></div>}
        {deleteTarget && <ConfirmDialog title="Delete tag?" confirmLabel="Delete tag" busyLabel="Deleting…" busy={deleting} onCancel={() => setDeleteTarget(null)} onConfirm={deleteTag}>Delete “{deleteTarget.name}”? It will be removed from every task.</ConfirmDialog>}
        {error && <p className={styles.error} role="alert">{error}</p>}
    </div>;
}

export default ProjectTagManager;
