import { useRef, useState } from 'react';
import { PlusIcon } from '@phosphor-icons/react/dist/csr/Plus';
import { XIcon } from '@phosphor-icons/react/dist/csr/X';
import TagColorPicker from '../tag-color-picker/tag-color-picker';
import styles from './task-tag-picker.module.css';

export default function TaskTagPicker({ tags = [], selectedIds = [], onChange, onCreateTag, disabled = false, compact = false }) {
    const [editorOpen, setEditorOpen] = useState(false);
    const [name, setName] = useState('');
    const [color, setColor] = useState('blue');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');
    const input = useRef(null);
    const addTrigger = useRef(null);
    const toggle = (id) => onChange(selectedIds.includes(id) ? selectedIds.filter((value) => value !== id) : [...selectedIds, id]);
    const openEditor = () => {
        setEditorOpen(true);
        window.requestAnimationFrame(() => input.current?.focus());
    };
    const closeEditor = () => {
        setEditorOpen(false);
        setName('');
        setError('');
        window.requestAnimationFrame(() => addTrigger.current?.focus());
    };
    const create = async () => {
        if (!name.trim() || creating || !onCreateTag) return;
        setCreating(true);
        setError('');
        try {
            const tag = await onCreateTag(name, color);
            onChange([...selectedIds, tag.id]);
            closeEditor();
        } catch {
            setError('Could not create that tag. Tag names must be unique.');
        } finally {
            setCreating(false);
        }
    };

    return <section className={`${styles.root} ${compact ? styles.compact : ''}`} aria-label="Tags">
        <div className={styles.header}><h3>Tags</h3>{onCreateTag && !disabled && <button ref={addTrigger} type="button" className={styles.addTrigger} aria-label="Create tag" aria-expanded={editorOpen} onClick={() => editorOpen ? closeEditor() : openEditor()}>{editorOpen ? <XIcon size={16} /> : <PlusIcon size={17} />}</button>}</div>
        <div className={styles.tagList}>{tags.length > 0 ? tags.map((tag) => <label className={styles.tagLabel} key={tag.id}><input type="checkbox" checked={selectedIds.includes(tag.id)} disabled={disabled} onChange={() => toggle(tag.id)} /><span className={`${styles.tag} ${styles[`tag_${tag.color}`]}`}>{tag.name}</span></label>) : <p className={styles.empty}>No tags yet.</p>}</div>
        {editorOpen && <div className={styles.editor} onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeEditor(); } }}><input ref={input} aria-label="New tag name" maxLength="24" value={name} placeholder="Tag name" onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); create(); } }} /><TagColorPicker label="New tag color" value={color} onChange={setColor} name={name} action={<button type="button" disabled={creating || !name.trim()} onClick={create}>{creating ? 'Adding…' : 'Add'}</button>} /></div>}
        {error && <p className={styles.error} role="alert">{error}</p>}
    </section>;
}
