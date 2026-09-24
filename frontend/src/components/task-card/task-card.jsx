import styles from './task-card.module.css';
import { updateTask } from '../../api/updateTask';
import { useState } from 'react';
import TaskActions from './task-actions';
import { useTaskMutation } from '../../functions/taskMutationContext';
import { useAuth } from '@clerk/react';
import { getTaskDueState } from '../../functions/taskViews';
import Checklist from '../checklist/checklist';
import { joinProjectTask, leaveProjectTask } from '../../api/projectTasks';

function TaskCard ({task, setAllTasks, projectMode = false, inlineChecklist = false, onNotify, onOpenDetails, dragHandleProps, isDragEnabled}) {
    const { getToken } = useAuth();
    const mutation = useTaskMutation();
    const [checklistOpenRequest, setChecklistOpenRequest] = useState(0);
    const [saving, setSaving] = useState(false);
    const currentAssigneeIds = (task.assignees ?? []).map((person) => person.id);

    const handleCompletion = async () => {
        if (!mutation.begin()) return;
        setSaving(true);
        try {
            const updated = await updateTask(await getToken(), task.id, task.title, task.description ?? '', task.status === 'completed' ? 'todo' : 'completed', task.priority, task.dueDate, task.projectId, (task.tags ?? []).map((tag) => tag.id), currentAssigneeIds);
            setAllTasks((current) => current.map((item) => item.id === task.id ? updated : item));
            onNotify({ tone: 'success', message: `${updated.status === 'completed' ? 'Completed' : 'Reopened'} “${updated.title}”.` });
        } catch {
            onNotify({ tone: 'error', message: `Could not change the status of “${task.title}”. Please try again.` });
        } finally { setSaving(false); mutation.end(); }
    };
    const handleParticipation = async () => {
        const joining = task.capabilities?.canJoin;
        if (!joining && !task.capabilities?.canLeave) return;
        if (!mutation.begin()) return;
        setSaving(true);
        try {
            const updated = joining ? await joinProjectTask(await getToken(), task.id) : await leaveProjectTask(await getToken(), task.id);
            setAllTasks((current) => current.map((item) => item.id === task.id ? updated : item));
            onNotify({ tone: 'success', message: `${joining ? 'Joined' : 'Left'} “${task.title}”.` });
        } catch (error) { onNotify({ tone: 'error', message: error.message }); }
        finally { setSaving(false); mutation.end(); }
    };
    const formattedDueDate = task.dueDate && new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(task.dueDate));
    const dueState = getTaskDueState(task);
    const visibleTags = (task.tags ?? []).slice(0, 3);
    const remainingTagCount = (task.tags ?? []).length - visibleTags.length;
    const assigneeNames = (task.assignees ?? []).map((person) => [person.fname, person.lname].filter(Boolean).join(' ') || person.primaryEmail || 'Member');
    const visibleAssigneeNames = assigneeNames.slice(0, 2);
    const setChecklistItems = (checklistItems) => setAllTasks((currentTasks) => currentTasks.map((currentTask) => currentTask.id === task.id ? { ...currentTask, checklistItems } : currentTask));

    return (
        <article id={`task-card-${task.id}`} className={`${styles.card} ${dueState ? styles[dueState.tone] : ''}`}>
            <div className={styles.dragSurface}>
                        <div className={styles.topRow}>
                            <div className={styles.titleGroup}>{isDragEnabled && <span className={`${styles.dragGrip} ${styles.dragEnabled}`} {...dragHandleProps} aria-label={`Drag ${task.title} to reorder`} title="Drag this task to reorder it">⋮⋮</span>}<h3 className={styles.title}>{task.title}</h3></div>
                            <span className={`${styles.priority} ${styles[task.priority]}`}>{task.priority}</span>
                        </div>
                        {task.description && <p className={styles.description}>{task.description}</p>}
                        {task.project && <p className={styles.meta}><span className={styles.dueLabel}>Project</span><span>{task.project.title}</span></p>}
                        <div className={styles.meta}><span className={styles.dueLabel}>Assignees</span><span className={styles.assignees} title={assigneeNames.join(', ')}>{assigneeNames.length ? visibleAssigneeNames.join(', ') : 'Unassigned'}{assigneeNames.length > visibleAssigneeNames.length && <b>+{assigneeNames.length - visibleAssigneeNames.length} more</b>}</span></div>
                        {visibleTags.length > 0 && <div className={styles.meta}><span className={styles.dueLabel}>Tags</span><span className={styles.tagList}>{visibleTags.map((tag) => <span className={`${styles.tag} ${styles[`tag_${tag.color}`]}`} key={tag.id}>{tag.name}</span>)}{remainingTagCount > 0 && <span className={`${styles.tag} ${styles.tagMore}`} aria-label={`${remainingTagCount} more tags`}>+{remainingTagCount}</span>}</span></div>}
                        {formattedDueDate && <p className={styles.meta}><span className={styles.dueLabel}>{dueState?.label ?? 'Due'}</span><span>{formattedDueDate}</span></p>}
            </div>
            <div className={styles.cardControls}>
                {projectMode && <span className={styles.commentCount} aria-label={`${task.commentCount ?? 0} ${(task.commentCount ?? 0) === 1 ? 'comment' : 'comments'}`} title="Task discussion"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 5.75h14v9.5H9.5L5 18.5V5.75Z" /></svg>{task.commentCount ?? 0}</span>}
                {(task.capabilities?.canJoin || task.capabilities?.canLeave) && <button className={styles.participation} type="button" disabled={mutation.busy} onClick={handleParticipation}>{task.capabilities.canJoin ? 'Join task' : 'Leave task'}</button>}
                {task.capabilities?.canEdit !== false && <label className={styles.completion}><input type="checkbox" checked={task.status === 'completed'} disabled={mutation.busy} onChange={handleCompletion} aria-label={`${task.status === 'completed' ? 'Reopen' : 'Complete'} ${task.title}`} /><span>{task.status === 'completed' ? 'Completed' : 'Complete'}</span></label>}
                {(onOpenDetails || task.capabilities?.canJoin || task.capabilities?.canLeave) && <TaskActions taskId={task.id} disabled={mutation.busy} onOpenDetails={onOpenDetails ? () => onOpenDetails(task.id) : undefined} onParticipation={(task.capabilities?.canJoin || task.capabilities?.canLeave) ? handleParticipation : undefined} participationLabel={task.capabilities?.canJoin ? 'Join task' : 'Leave task'} onAddChecklist={inlineChecklist && task.capabilities?.canEdit !== false && (task.checklistItems ?? []).length === 0 ? () => setChecklistOpenRequest((current) => current + 1) : undefined} />}
            </div>
            {inlineChecklist && <Checklist hideEmpty openRequest={checklistOpenRequest} disabled={saving} readOnly={task.capabilities?.canEdit === false} taskId={task.id} items={task.checklistItems ?? []} getToken={getToken} onItemsChange={setChecklistItems} onNotify={onNotify} />}
        </article>
    );
}

export default TaskCard;
