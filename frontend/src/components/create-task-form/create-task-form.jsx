import { useEffect, useRef, useState } from 'react';
import styles from './create-task-form.module.css';
import { createTask } from '../../api/createTask';
import { useAuth } from '@clerk/react';
import TaskAssignmentFields from '../task-assignment-fields/task-assignment-fields';
import { getLocalDateTimeMinimum } from '../../functions/toLocalDateTime';
import Checklist from '../checklist/checklist';
import { useTaskMutation } from '../../functions/taskMutationContext';

function CreateTaskForm ({tasks, setTasks, projects, tags, onCreateTag, onNotify, expanded, onCreated}) {
    const { getToken } = useAuth();
    const mutation = useTaskMutation();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('low');
    const [dueDate, setDueDate] = useState('');
    const [projectId, setProjectId] = useState(null);
    const [tagIds, setTagIds] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [checklistItems, setChecklistItems] = useState([]);
    const [checklistResetKey, setChecklistResetKey] = useState(0);
    const [detailsExpanded, setDetailsExpanded] = useState(false);
    const titleRef = useRef(null);
    useEffect(() => { if (expanded) titleRef.current?.focus(); }, [expanded]);
    const hasAdditionalDetails = priority !== 'low' || Boolean(dueDate) || projectId !== null || tagIds.length > 0;
    const detailSummary = [priority !== 'low' && `${priority[0].toUpperCase()}${priority.slice(1)} priority`, dueDate && 'Due date', projectId !== null && projects.find((project) => project.id === projectId)?.title, tagIds.length > 0 && `${tagIds.length} tag${tagIds.length === 1 ? '' : 's'}`].filter(Boolean).join(' · ');


    const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || !title.trim() || title.length > 100 || description.length > 500) return;
    if (!mutation.begin()) return;
    const submittedDueDate = new FormData(e.currentTarget).get('dueDate');
    // Handle task creation logic here
    // 1. Send a request to the backend to create a new task. Update tasks state in the parent component
    // (TasksPage) to include the newly created task so it shows up in the UI without needing to refresh the page
    setSubmitting(true);
    try {
        const token = await getToken();

        // Find the orderIndex to assign to the new task (insert at the bottom of the todo list)
        const todoTasks = tasks.filter(task => task.status === 'todo');
        const orderIndex = todoTasks.length > 0
            ? Math.max(...todoTasks.map(task => task.orderIndex)) + 1
            : 0;

        const newTask = await createTask(token, title, description, priority, submittedDueDate || null, orderIndex, projectId, tagIds, checklistItems);
        setTasks((prevTasks) => [...prevTasks, newTask]); // Add the new task to the bottom of the todo list
        setTitle('');
        setDescription('');
        setPriority('low');
        setDueDate('');
        setProjectId(null);
        setTagIds([]);
        setChecklistItems([]);
        setChecklistResetKey((current) => current + 1);
        setDetailsExpanded(false);
        onCreated();
        onNotify({ tone: 'success', message: `Created “${newTask.title}”.` });
    } catch (error) {
        console.error('Error creating task', error);
        onNotify({ tone: 'error', message: 'Could not create the task. Your entries were kept so you can try again.' });
    } finally {
        setSubmitting(false);
        mutation.end();
    }
};

    return (
        <form onSubmit={handleSubmit} className={styles.createTask}>
            <div id="create-task-content" className={styles.formContent} hidden={!expanded}>
            <div className={styles.field}>
                <label htmlFor="title">Title</label>
                <input ref={titleRef} type="text" id="title" name="title" value={title} maxLength={100} required onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className={styles.field}>
                <label htmlFor="description">Description (optional) <span className={styles.characterCount}>{description.length}/500</span></label>
                <textarea id="description" name="description" value={description} maxLength={500} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <section className={styles.additionalDetails}>
                <button className={styles.sectionToggle} type="button" onClick={() => setDetailsExpanded((value) => !value)} aria-expanded={detailsExpanded} aria-controls="additional-task-details">{detailsExpanded ? '▾' : '▸'} Additional details {hasAdditionalDetails && !detailsExpanded && <span>{detailSummary}</span>}</button>
                <div id="additional-task-details" className={styles.additionalDetailsContent} hidden={!detailsExpanded}>
            <div className={styles.details}>
                <div className={styles.field}>
                    <label htmlFor="priority">Priority</label>
                    <select id="priority" name="priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>
                <div className={styles.field}>
                    <label htmlFor="dueDate">Due date <span>(optional)</span></label>
                    <input type="datetime-local" id="dueDate" name="dueDate" value={dueDate}
                        min={getLocalDateTimeMinimum()} onInput={(e) => setDueDate(e.currentTarget.value)} />
                </div>
            </div>
            <div className={styles.assignments}><TaskAssignmentFields projects={projects} tags={tags} projectId={projectId} tagIds={tagIds} onProjectChange={setProjectId} onTagIdsChange={setTagIds} onCreateTag={onCreateTag} /></div>
                </div>
            </section>
            <Checklist items={checklistItems} draft resetKey={checklistResetKey} onItemsChange={setChecklistItems} onNotify={onNotify} />
            <button className={styles.submitButton} disabled={mutation.busy || !title.trim()} type="submit">{submitting ? 'Creating…' : 'Create task'}</button>
            </div>
        </form>
    );
}

export default CreateTaskForm;
