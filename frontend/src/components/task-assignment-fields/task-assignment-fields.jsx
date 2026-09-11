import { useState } from 'react';
import styles from './task-assignment-fields.module.css';

const colors = ['slate', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple'];

function TaskAssignmentFields({ projects, tags, projectId, tagIds, onProjectChange, onTagIdsChange, onCreateTag }) {
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('blue');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');
    const toggleTag = (id) => onTagIdsChange(tagIds.includes(id) ? tagIds.filter((tagId) => tagId !== id) : [...tagIds, id]);
    const submitTag = async () => {
        if (!newTagName.trim()) return;
        setCreating(true);
        setError('');
        try {
            const tag = await onCreateTag(newTagName, newTagColor);
            onTagIdsChange([...tagIds, tag.id]);
            setNewTagName('');
        } catch {
            setError('Could not create that tag. Tag names must be unique.');
        } finally { setCreating(false); }
    };
    return <div className={styles.assignments}>
        <label className={styles.field}>Project
            <select value={projectId ?? ''} onChange={(event) => onProjectChange(event.target.value ? Number(event.target.value) : null)}>
                <option value="">No project</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
            </select>
        </label>
        <fieldset className={styles.tags}><legend>Tags</legend>
            <div className={styles.tagList}>{tags.map((tag) => <label className={styles.tagLabel} key={tag.id}><input type="checkbox" checked={tagIds.includes(tag.id)} onChange={() => toggleTag(tag.id)} /><span className={`${styles.tag} ${styles[`tag_${tag.color}`]}`}>{tag.name}</span></label>)}</div>
            <div className={styles.newTag}><input aria-label="New tag name" maxLength="24" value={newTagName} onChange={(event) => setNewTagName(event.target.value)} placeholder="New tag" /><select aria-label="New tag color" value={newTagColor} onChange={(event) => setNewTagColor(event.target.value)}>{colors.map((color) => <option key={color} value={color}>{color}</option>)}</select><button type="button" onClick={submitTag} disabled={creating || !newTagName.trim()}>Add tag</button></div>
            {error && <p className={styles.error} role="alert">{error}</p>}
        </fieldset>
    </div>;
}

export default TaskAssignmentFields;
