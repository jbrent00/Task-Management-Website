import { useEffect, useRef, useState } from 'react';
import styles from './create-task-form.module.css';
import { createTask } from '../../api/createTask';
import { useAuth } from '@clerk/react';
import TaskAssignmentFields from '../task-assignment-fields/task-assignment-fields';
import { getLocalDateTimeMinimum } from '../../functions/toLocalDateTime';
import Checklist from '../checklist/checklist';
import ConfirmDialog from '../confirm-dialog/confirm-dialog';
import { useTaskMutation } from '../../functions/taskMutationContext';
import { AiGenerationError, generateTaskDraft } from '../../api/aiGeneration';

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
    const [generating, setGenerating] = useState(null);
    const [aiMessage, setAiMessage] = useState(null);
    const [confirmationKind, setConfirmationKind] = useState(null);
    const titleRef = useRef(null);
    useEffect(() => { if (expanded) titleRef.current?.focus(); }, [expanded]);
    const hasAdditionalDetails = priority !== 'low' || Boolean(dueDate) || projectId !== null || tagIds.length > 0;
    const detailSummary = [priority !== 'low' && `${priority[0].toUpperCase()}${priority.slice(1)} priority`, dueDate && 'Due date', projectId !== null && projects.find((project) => project.id === projectId)?.title, tagIds.length > 0 && `${tagIds.length} tag${tagIds.length === 1 ? '' : 's'}`].filter(Boolean).join(' · ');
    const validAiTitle = Boolean(title.trim()) && title.length <= 100;

    const describeAiError = (error) => {
        if (error instanceof AiGenerationError && error.status === 429) {
            const seconds = error.retryAfterSeconds ?? 60;
            return `AI generation limit reached. Try again in about ${seconds} second${seconds === 1 ? '' : 's'}.`;
        }
        if (error instanceof AiGenerationError && error.status === 504) return 'The AI took too long to respond. Your content was kept; please try again.';
        if (error instanceof AiGenerationError && error.status === 503) return 'AI generation is not configured right now. Your content was kept.';
        return 'The AI could not generate a suggestion. Your content was kept; please try again.';
    };

    const runGeneration = async (kind) => {
        if (generating || !validAiTitle) return;
        setConfirmationKind(null);
        setGenerating(kind);
        setAiMessage({ tone: 'status', text: kind === 'description' ? 'Generating a task description…' : 'Generating five checklist items…' });
        try {
            const token = await getToken();
            const result = await generateTaskDraft(token, kind === 'description' ? { kind, title } : { kind, title, description });
            if (result.kind === 'description') setDescription(result.description);
            if (result.kind === 'checklist') setChecklistItems(result.items.map((text) => ({ id: `draft-${crypto.randomUUID()}`, text, completed: false })));
            setAiMessage({ tone: 'success', text: kind === 'description' ? 'Description generated. You can edit it before creating the task.' : 'Checklist generated. You can edit the items before creating the task.' });
        } catch (error) {
            setAiMessage({ tone: 'error', text: describeAiError(error) });
        } finally {
            setGenerating(null);
        }
    };

    const requestGeneration = (kind) => {
        const hasExistingContent = kind === 'description' ? Boolean(description.trim()) : checklistItems.length > 0;
        if (hasExistingContent) { setConfirmationKind(kind); return; }
        runGeneration(kind);
    };

    const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || !title.trim() || title.length > 100 || description.length > 500) return;
    if (!mutation.begin()) return;
    const submittedDueDate = new FormData(e.currentTarget).get('dueDate');
    setSubmitting(true);
    try {
        const token = await getToken();

        const todoTasks = tasks.filter(task => task.status === 'todo');
        const orderIndex = todoTasks.length > 0
            ? Math.max(...todoTasks.map(task => task.orderIndex)) + 1
            : 0;

        const newTask = await createTask(token, title, description, priority, submittedDueDate || null, orderIndex, projectId, tagIds, checklistItems);
        setTasks((prevTasks) => [...prevTasks, newTask]);
        setTitle('');
        setDescription('');
        setPriority('low');
        setDueDate('');
        setProjectId(null);
        setTagIds([]);
        setChecklistItems([]);
        setChecklistResetKey((current) => current + 1);
        setDetailsExpanded(false);
        setAiMessage(null);
        setConfirmationKind(null);
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
                <input ref={titleRef} type="text" id="title" name="title" value={title} maxLength={100} required disabled={Boolean(generating)} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className={styles.field}>
                <div className={styles.fieldHeader}><label htmlFor="description">Description (optional) <span className={styles.characterCount}>{description.length}/500</span></label><button type="button" className={styles.generateButton} disabled={!validAiTitle || Boolean(generating)} onClick={() => requestGeneration('description')}>{generating === 'description' ? 'Generating…' : 'Generate description'}</button></div>
                <textarea id="description" name="description" value={description} maxLength={500} disabled={Boolean(generating)} onChange={(e) => setDescription(e.target.value)} />
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
            <div className={styles.assignments}><TaskAssignmentFields tags={tags} projectId={null} tagIds={tagIds} onProjectChange={() => {}} onTagIdsChange={setTagIds} onCreateTag={onCreateTag} showProject={false} /></div>
                </div>
            </section>
            <Checklist items={checklistItems} draft resetKey={checklistResetKey} disabled={Boolean(generating)} onGenerate={() => requestGeneration('checklist')} generating={generating === 'checklist'} generateDisabled={!validAiTitle || Boolean(generating)} onItemsChange={setChecklistItems} onNotify={onNotify} />
            {aiMessage && <p className={`${styles.aiMessage} ${styles[aiMessage.tone]}`} role={aiMessage.tone === 'error' ? 'alert' : 'status'} aria-live="polite">{aiMessage.text}</p>}
            <button className={styles.submitButton} disabled={mutation.busy || !title.trim() || Boolean(generating)} type="submit">{submitting ? 'Creating…' : 'Create task'}</button>
            {confirmationKind && <ConfirmDialog title={`Replace existing ${confirmationKind}?`} confirmLabel="Replace and generate" tone="warning" onCancel={() => setConfirmationKind(null)} onConfirm={() => runGeneration(confirmationKind)}>Generating new content will replace the {confirmationKind} currently in this form.</ConfirmDialog>}
            </div>
        </form>
    );
}

export default CreateTaskForm;
