import { CalendarBlankIcon } from '@phosphor-icons/react/dist/csr/CalendarBlank';
import { ChatCircleIcon } from '@phosphor-icons/react/dist/csr/ChatCircle';
import { CheckIcon } from '@phosphor-icons/react/dist/csr/Check';
import { CheckSquareIcon } from '@phosphor-icons/react/dist/csr/CheckSquare';
import { EyeIcon } from '@phosphor-icons/react/dist/csr/Eye';
import { PencilSimpleIcon } from '@phosphor-icons/react/dist/csr/PencilSimple';
import styles from './task-card.module.css';

const personName = (person) => [person.fname, person.lname].filter(Boolean).join(' ') || person.primaryEmail || 'Member';

export function CardShell({ task, busy, onCompletion, dragHandleProps, isDragEnabled, actions, children }) {
    const canComplete = task.capabilities?.canEdit !== false;
    return <article id={`task-card-${task.id}`} className={`${styles.card} ${task.status === 'completed' ? styles.completed : ''}`}>
        {canComplete && <label className={styles.completion}><input type="checkbox" checked={task.status === 'completed'} disabled={busy} onChange={onCompletion} aria-label={`${task.status === 'completed' ? 'Reopen' : 'Complete'} ${task.title}`} /><span aria-hidden="true"><CheckIcon size={12} weight="bold" /></span></label>}
        <div className={`${styles.cardBody} ${canComplete ? styles.withCompletion : ''} ${isDragEnabled ? styles.dragSurface : ''}`} {...(isDragEnabled ? dragHandleProps : {})} aria-label={isDragEnabled ? `Drag ${task.title} to reorder` : undefined} title={isDragEnabled ? 'Drag this card to reorder it' : undefined}>{children}</div>
        {actions && <div className={styles.cardActions}>{actions}</div>}
    </article>;
}

export function TitleRow({ task }) {
    return <div className={styles.titleRow}><h3 className={styles.title}>{task.title}</h3><span className={`${styles.priority} ${styles[task.priority]}`}>{task.priority}</span></div>;
}

export function DueDate({ formattedDueDate, dueState }) {
    if (!formattedDueDate) return null;
    return <span className={`${styles.dueDate} ${dueState ? styles[dueState.tone] : ''}`}><CalendarBlankIcon aria-hidden="true" size={15} />{dueState?.label === 'Overdue' ? 'Overdue ' : ''}{formattedDueDate}</span>;
}

export function TagList({ tags = [], limit = 2 }) {
    if (!tags.length) return null;
    const visible = tags.slice(0, limit);
    const remaining = tags.length - visible.length;
    return <div className={styles.tagList}>{visible.map((tag) => <span className={`${styles.tag} ${styles[`tag_${tag.color}`]}`} key={tag.id}>{tag.name}</span>)}{remaining > 0 && <span className={`${styles.tag} ${styles.tagMore}`} aria-label={`${remaining} more tags`}>+{remaining}</span>}</div>;
}

export function ChecklistSummary({ items = [] }) {
    if (!items.length) return null;
    const completed = items.filter((item) => item.completed).length;
    return <span className={styles.checklistSummary} aria-label={`${completed} of ${items.length} subtasks complete`}><CheckSquareIcon aria-hidden="true" size={16} />{completed}/{items.length} subtasks</span>;
}

export function DiscussionCount({ count = 0 }) {
    return <span className={styles.commentCount} aria-label={`${count} ${count === 1 ? 'comment' : 'comments'}`} title="Task discussion"><ChatCircleIcon aria-hidden="true" size={16} />{count}</span>;
}

export function AssigneeList({ assignees = [] }) {
    if (!assignees.length) return <span className={styles.noAssignees}>No assignees</span>;
    const visible = assignees.slice(0, 2);
    return <div className={styles.assigneeList} title={assignees.map(personName).join(', ')}>{visible.map((person, index) => <span className={styles.assigneeEntry} key={person.id}>{index > 0 && <span className={styles.separator} aria-hidden="true">,</span>}<span className={styles.assigneePerson}><span>{personName(person)}</span>{person.imageUrl ? <img src={person.imageUrl} alt="" /> : <span className={styles.avatar}>{personName(person).slice(0, 1).toUpperCase()}</span>}</span></span>)}{assignees.length > 1 && <b className={styles.compactAssigneeOverflow}>+{assignees.length - 1}</b>}{assignees.length > visible.length && <b className={styles.assigneeOverflow}>+{assignees.length - visible.length}</b>}</div>;
}

export function ParticipationAction({ label, busy, onClick }) {
    if (!onClick) return null;
    return <button className={styles.participation} type="button" disabled={busy} onClick={onClick}>{label}</button>;
}

export function DetailAction({ task, busy, onOpenDetails }) {
    if (!onOpenDetails) return null;
    const canEdit = task.capabilities?.canEdit !== false;
    return <button className={styles.detailAction} type="button" disabled={busy} onClick={onOpenDetails} aria-label={`${canEdit ? 'Edit' : 'View'} ${task.title}`} title={canEdit ? 'Edit task' : 'View task'}>{canEdit ? <PencilSimpleIcon size={17} /> : <EyeIcon size={17} />}</button>;
}
