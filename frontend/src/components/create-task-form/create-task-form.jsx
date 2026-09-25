import { useEffect, useRef, useState } from 'react';
import styles from './create-task-form.module.css';
import { createTask } from '../../api/createTask';
import { useAuth } from '@clerk/react';
import TaskAssignmentFields from '../task-assignment-fields/task-assignment-fields';
import { getLocalDateTimeMinimum } from '../../functions/toLocalDateTime';
import Checklist from '../checklist/checklist';
import ConfirmDialog from '../confirm-dialog/confirm-dialog';
import TaskSelectField from '../task-form-controls/task-select-field';
import TaskDateField from '../task-form-controls/task-date-field';
import { useTaskMutation } from '../../functions/taskMutationContext';
import { AiGenerationError, generateTaskDraft } from '../../api/aiGeneration';

function CreateTaskForm ({tasks, setTasks, tags, onCreateTag, onNotify, expanded, onCreated}) {
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
    const [generating, setGenerating] = useState(null);
    const [aiMessage, setAiMessage] = useState(null);
    const [confirmationKind, setConfirmationKind] = useState(null);
    const titleRef = useRef(null);
    useEffect(() => { if (expanded) titleRef.current?.focus(); }, [expanded]);
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
    setSubmitting(true);
    try {
        const token = await getToken();

        const todoTasks = tasks.filter(task => task.status === 'todo');
        const orderIndex = todoTasks.length > 0
            ? Math.max(...todoTasks.map(task => task.orderIndex)) + 1
            : 0;

        const newTask = await createTask(token, title, description, priority, dueDate || null, orderIndex, projectId, tagIds, checklistItems);
        setTasks((prevTasks) => [...prevTasks, newTask]);
        setTitle('');
        setDescription('');
        setPriority('low');
        setDueDate('');
        setProjectId(null);
        setTagIds([]);
        setChecklistItems([]);
        setChecklistResetKey((current) => current + 1);
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
            <header className={styles.formHeader}><div><span className={styles.eyebrow}>My tasks / New task</span><h2>New task</h2><p>Give the work a clear name, then add the details you need.</p></div></header>
            <div className={`${styles.field} ${styles.titleField}`}>
                <label htmlFor="title">Task name</label>
                <input ref={titleRef} type="text" id="title" name="title" value={title} maxLength={100} required disabled={Boolean(generating)} placeholder="What needs to be done?" onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className={`${styles.field} ${styles.descriptionField}`}>
                <div className={styles.fieldHeader}><label htmlFor="description">Description (optional) <span className={styles.characterCount}>{description.length}/500</span></label><button type="button" className={styles.generateButton} disabled={!validAiTitle || Boolean(generating)} onClick={() => requestGeneration('description')}>{generating === 'description' ? 'Generating…' : 'Generate description'}</button></div>
                <textarea id="description" name="description" value={description} maxLength={500} disabled={Boolean(generating)} placeholder="Add the context that will help you finish the task." onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className={styles.details}>
                <div className={`${styles.field} ${styles.statusField}`}><span className={styles.staticLabel}>Status</span><span className={styles.staticValue}>To do</span></div>
                <TaskSelectField label="Priority" value={priority} onChange={setPriority} options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} />
                <TaskDateField label="Due date" value={dueDate} onChange={setDueDate} min={getLocalDateTimeMinimum()} />
            </div>
            <div className={styles.tagSection}><TaskAssignmentFields tags={tags} projectId={null} tagIds={tagIds} onProjectChange={() => {}} onTagIdsChange={setTagIds} onCreateTag={onCreateTag} showProject={false} /></div>
            <div className={styles.checklistField}><Checklist items={checklistItems} draft defaultExpanded resetKey={checklistResetKey} disabled={Boolean(generating)} onGenerate={() => requestGeneration('checklist')} generating={generating === 'checklist'} generateDisabled={!validAiTitle || Boolean(generating)} onItemsChange={setChecklistItems} onNotify={onNotify} /></div>
            {aiMessage && <p className={`${styles.aiMessage} ${styles[aiMessage.tone]}`} role={aiMessage.tone === 'error' ? 'alert' : 'status'} aria-live="polite">{aiMessage.text}</p>}
            <footer className={styles.formFooter}><button className={styles.submitButton} disabled={mutation.busy || !title.trim() || Boolean(generating)} type="submit">{submitting ? 'Creating…' : 'Create task'}</button></footer>
            {confirmationKind && <ConfirmDialog title={`Replace existing ${confirmationKind}?`} confirmLabel="Replace and generate" tone="warning" onCancel={() => setConfirmationKind(null)} onConfirm={() => runGeneration(confirmationKind)}>Generating new content will replace the {confirmationKind} currently in this form.</ConfirmDialog>}
            </div>
        </form>
    );
}

export default CreateTaskForm;
