import { useState } from 'react';
import styles from './project-tag-manager.module.css';

const colors = ['slate', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple'];

function ProjectTagManager({ projects, tags, projectCounts, onCreateProject, onUpdateProject, onDeleteProject, onUpdateTag, onDeleteTag, onNotify }) {
    const [mode, setMode] = useState(null);
    const [createTitle, setCreateTitle] = useState('');
    const [createDescription, setCreateDescription] = useState('');
    const [projectTitle, setProjectTitle] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [tagName, setTagName] = useState('');
    const [tagColor, setTagColor] = useState('blue');
    const [editingProject, setEditingProject] = useState(null);
    const [editingTag, setEditingTag] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [error, setError] = useState('');

    const clearCreateProject = () => { setCreateTitle(''); setCreateDescription(''); };
    const close = () => { setMode(null); setError(''); setEditingProject(null); setEditingTag(null); clearCreateProject(); };
    const create = async (event) => {
        event.preventDefault();
        try {
            const project = await onCreateProject(createTitle, createDescription);
            onNotify({ tone: 'success', message: `Created project “${project.title}”.` });
            close();
        } catch {
            setError('Could not save the project. Its name may already be in use.');
        }
    };
    const saveProject = async (event) => {
        event.preventDefault();
        try {
            await onUpdateProject(editingProject.id, projectTitle, projectDescription);
            onNotify({ tone: 'success', message: `Saved project “${projectTitle.trim()}”.` });
            setEditingProject(null);
            setProjectTitle('');
            setProjectDescription('');
            setError('');
        } catch {
            setError('Could not update that project. Its name may already be in use.');
        }
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
    const confirmDelete = async () => {
        const target = deleteTarget;
        try {
            if (target.type === 'project') await onDeleteProject(target.item.id);
            else await onDeleteTag(target.item.id);
            onNotify({ tone: 'success', message: `Deleted ${target.type} “${target.type === 'project' ? target.item.title : target.item.name}”.` });
            setDeleteTarget(null);
        } catch {
            setError(`Could not delete that ${target.type}.`);
            setDeleteTarget(null);
        }
    };
    const startProjectEdit = (project) => {
        setProjectTitle(project.title);
        setProjectDescription(project.description ?? '');
        setEditingProject(project);
        setError('');
    };
    const startTagEdit = (tag) => { setTagName(tag.name); setTagColor(tag.color); setEditingTag(tag); setError(''); };

    return <div className={styles.manager}>
        <button type="button" onClick={() => { setMode(mode === 'projects' ? null : 'projects'); setError(''); clearCreateProject(); }}>Manage projects</button>
        <button type="button" onClick={() => { setMode(mode === 'tags' ? null : 'tags'); setError(''); clearCreateProject(); }}>Manage tags</button>
        {mode === 'projects' && <section className={styles.panel} aria-label="Manage projects"><form onSubmit={create}><h2>Projects</h2><input value={createTitle} maxLength="100" onChange={(event) => setCreateTitle(event.target.value)} placeholder="Project name" aria-label="Project name" required /><textarea value={createDescription} maxLength="500" onChange={(event) => setCreateDescription(event.target.value)} placeholder="Description (optional)" aria-label="Project description" /><button type="submit">Create project</button><button type="button" onClick={close}>Close</button></form>{projects.map((project) => <div className={styles.row} key={project.id}><span><strong>{project.title}</strong><small>{projectCounts[project.id]?.total ?? 0} tasks · {projectCounts[project.id]?.completed ?? 0} complete</small></span><button type="button" onClick={() => startProjectEdit(project)}>Edit</button><button type="button" onClick={() => setDeleteTarget({ type: 'project', item: project })}>Delete</button></div>)}</section>}
        {mode === 'tags' && <section className={styles.panel} aria-label="Manage tags"><h2>Tags</h2>{tags.map((tag) => <div className={styles.row} key={tag.id}><span className={`${styles.tag} ${styles[`tag_${tag.color}`]}`}>{tag.name}</span><button type="button" onClick={() => startTagEdit(tag)}>Edit</button><button type="button" onClick={() => setDeleteTarget({ type: 'tag', item: tag })}>Delete</button></div>)}<button type="button" onClick={close}>Close</button></section>}
        {editingProject && <div className={styles.dialogBackdrop}><form className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="edit-project-title" onSubmit={saveProject}><h2 id="edit-project-title">Edit project</h2><label>Project name<input value={projectTitle} maxLength="100" onChange={(event) => setProjectTitle(event.target.value)} required autoFocus /></label><label>Description<textarea value={projectDescription} maxLength="500" onChange={(event) => setProjectDescription(event.target.value)} /></label><div className={styles.dialogActions}><button type="button" onClick={() => setEditingProject(null)}>Cancel</button><button type="submit">Save project</button></div></form></div>}
        {editingTag && <div className={styles.dialogBackdrop}><form className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="edit-tag-title" onSubmit={saveTag}><h2 id="edit-tag-title">Edit tag</h2><label>Tag name<input value={tagName} maxLength="24" onChange={(event) => setTagName(event.target.value)} required autoFocus /></label><label>Color<select value={tagColor} onChange={(event) => setTagColor(event.target.value)}>{colors.map((color) => <option key={color} value={color}>{color}</option>)}</select></label><div className={styles.dialogActions}><button type="button" onClick={() => setEditingTag(null)}>Cancel</button><button type="submit">Save tag</button></div></form></div>}
        {deleteTarget && <div className={styles.dialogBackdrop}><section className={styles.dialog} role="alertdialog" aria-modal="true" aria-labelledby="delete-title"><h2 id="delete-title">Delete {deleteTarget.type}?</h2><p>{deleteTarget.type === 'project' ? `Delete ${deleteTarget.item.title}? Its tasks will have no project.` : `Delete ${deleteTarget.item.name}? It will be removed from every task.`}</p><div className={styles.dialogActions}><button type="button" onClick={() => setDeleteTarget(null)}>Cancel</button><button type="button" className={styles.dangerButton} onClick={confirmDelete}>Delete {deleteTarget.type}</button></div></section></div>}
        {error && <p className={styles.error} role="alert">{error}</p>}
    </div>;
}

export default ProjectTagManager;
