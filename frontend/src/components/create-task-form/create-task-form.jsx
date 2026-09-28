import { useEffect, useRef, useState } from 'react';
import styles from './create-task-form.module.css';
import { useAuth } from '@clerk/react';
import TaskAssignmentFields from '../task-assignment-fields/task-assignment-fields';
import { getLocalDateTimeMinimum } from '../../functions/toLocalDateTime';
import Checklist from '../checklist/checklist';
import ConfirmDialog from '../confirm-dialog/confirm-dialog';
import TaskSelectField from '../task-form-controls/task-select-field';
import TaskDateField from '../task-form-controls/task-date-field';
import { useTaskMutation } from '../../functions/taskMutationContext';
import { AiGenerationError, generateTaskDraft } from '../../api/aiGeneration';
import { createAuthenticatedOperations } from '../../functions/workspace-operations';
import { useWorkspaceOperations } from '../../functions/workspace-context';

function AuthenticatedCreateTaskForm(props) {
    const { getToken } = useAuth();
    return <CreateTaskFormContent {...props} operations={createAuthenticatedOperations(getToken)} />;
}

function CreateTaskFormContent ({tasks, setTasks, tags, onCreateTag, onNotify, expanded, initialStatus = 'todo', onCreated, operations, fixedProjectId = null}) {
    const mutation = useTaskMutation();
    const isDemo = operations.mode === 'demo';
    const guestAiHint = 'Create an account to use AI generation.';

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState(initialStatus);
    const [priority, setPriority] = useState('low');
    const [dueDate, setDueDate] = useState('');
    const [projectId, setProjectId] = useState(null);
    const [tagIds, setTagIds] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [checklistItems, setChecklistItems] = useState([]);
    const [checklistResetKey, setChecklistResetKey] = useState(0);
    const [generating, setGenerating] = useState(null);
    const [aiMessage, setAiMessage] = useState(null);
    const [submitError, setSubmitError] = useState('');
    const [confirmationKind, setConfirmationKind] = useState(null);
    const titleRef = useRef(null);
    useEffect(() => { if (expanded) titleRef.current?.focus(); }, [expanded]);
    useEffect(() => { if (expanded) setStatus(initialStatus); }, [initialStatus, expanded]);
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
            const result = await generateTaskDraft(await operations.getToken(), kind === 'description' ? { kind, title } : { kind, title, description });
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
    setSubmitError('');
    try {
        const statusTasks = tasks.filter(task => task.status === status && task.projectId === fixedProjectId);
        const orderIndex = statusTasks.length > 0
            ? Math.max(...statusTasks.map(task => task.orderIndex)) + 1
            : 0;

        const newTask = await operations.createTask({ title, description, priority, dueDate: dueDate || null, orderIndex, projectId: fixedProjectId ?? projectId, tagIds, checklistItems, status });
        setTasks((prevTasks) => [...prevTasks, newTask]);
        setTitle('');
        setDescription('');
        setPriority('low');
        setStatus('todo');
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
        setSubmitError('Could not create the task. Your entries were kept so you can try again.');
    } finally {
        setSubmitting(false);
        mutation.end();
    }
};

    return (
        <form onSubmit={handleSubmit} className={styles.createTask}>
            <div id="create-task-content" className={styles.formContent} hidden={!expanded}>
            <header className={styles.formHeader}><div><span className={styles.eyebrow}>{fixedProjectId ? 'Project / New task' : 'My tasks / New task'}</span><h2>New task</h2><p>Give the work a clear name, then add the details you need.</p></div></header>
            <div className={`${styles.field} ${styles.titleField}`}>
                <label htmlFor="title">Task name</label>
                <input ref={titleRef} type="text" id="title" name="title" value={title} maxLength={100} required disabled={Boolean(generating)} placeholder="What needs to be done?" onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className={`${styles.field} ${styles.descriptionField}`}>
                <div className={styles.fieldHeader}><label htmlFor="description">Description (optional) <span className={styles.characterCount}>{description.length}/500</span></label><span title={isDemo ? guestAiHint : undefined} className={isDemo ? styles.unavailableControl : undefined}><button type="button" className={styles.generateButton} disabled={isDemo || !validAiTitle || Boolean(generating)} aria-describedby={isDemo ? 'guest-ai-help' : undefined} onClick={() => requestGeneration('description')}>{generating === 'description' ? 'Generating…' : 'Generate description'}</button></span></div>
                <textarea id="description" name="description" value={description} maxLength={500} disabled={Boolean(generating)} placeholder="Add the context that will help you finish the task." onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className={styles.details}>
                <TaskSelectField label="Status" value={status} onChange={setStatus} options={[{ value: 'todo', label: 'To do' }, { value: 'in_progress', label: 'In progress' }, { value: 'completed', label: 'Completed' }]} />
                <TaskSelectField label="Priority" value={priority} onChange={setPriority} options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} />
                <TaskDateField label="Due date" value={dueDate} onChange={setDueDate} min={getLocalDateTimeMinimum()} />
            </div>
            <div className={styles.tagSection}><TaskAssignmentFields tags={tags} projectId={null} tagIds={tagIds} onProjectChange={() => {}} onTagIdsChange={setTagIds} onCreateTag={onCreateTag} showProject={false} /></div>
            <div className={styles.checklistField}><Checklist items={checklistItems} draft defaultExpanded resetKey={checklistResetKey} disabled={Boolean(generating)} onGenerate={() => requestGeneration('checklist')} generating={generating === 'checklist'} generateDisabled={isDemo || !validAiTitle || Boolean(generating)} generateHint={isDemo ? guestAiHint : undefined} generateHintId={isDemo ? 'guest-ai-help' : undefined} onItemsChange={setChecklistItems} onNotify={onNotify} /></div>
            {isDemo && <p id="guest-ai-help" className={styles.guestAiHelp}>AI generation requires an account. <a href="/sign-up">Create an account</a> to use it.</p>}
            {aiMessage && <p className={`${styles.aiMessage} ${styles[aiMessage.tone]}`} role={aiMessage.tone === 'error' ? 'alert' : 'status'} aria-live="polite">{aiMessage.text}</p>}
            {submitError && <p className={`${styles.aiMessage} ${styles.error}`} role="alert">{submitError}</p>}
            <footer className={styles.formFooter}><button className={styles.submitButton} disabled={mutation.busy || !title.trim() || Boolean(generating)} type="submit">{submitting ? 'Creating…' : 'Create task'}</button></footer>
            {confirmationKind && <ConfirmDialog title={`Replace existing ${confirmationKind}?`} confirmLabel="Replace and generate" tone="warning" onCancel={() => setConfirmationKind(null)} onConfirm={() => runGeneration(confirmationKind)}>Generating new content will replace the {confirmationKind} currently in this form.</ConfirmDialog>}
            </div>
        </form>
    );
}

export default function CreateTaskForm(props) {
    const operations = useWorkspaceOperations();
    return operations ? <CreateTaskFormContent {...props} operations={operations} /> : <AuthenticatedCreateTaskForm {...props} />;
}
