import { AssigneeList, CardShell, ChecklistSummary, DetailAction, DiscussionCount, DueDate, ParticipationAction, TagList, TitleRow } from './task-card-parts';
import styles from './my-tasks-project-card.module.css';

export default function MyTasksProjectCard({ view, busy, onCompletion, onOpenDetails, onParticipation }) {
    const { task, formattedDueDate, dueState } = view;
    const hasParticipation = Boolean(onParticipation);
    return <CardShell task={task} busy={busy} onCompletion={onCompletion} actions={<><ParticipationAction label={task.capabilities?.canJoin ? 'Join' : 'Leave'} busy={busy} onClick={onParticipation} /><DetailAction task={task} busy={busy} onOpenDetails={onOpenDetails} /></>}>
        <TitleRow task={task} />
        <div className={styles.projectRow}><span className={styles.projectName}>{task.project?.title ?? 'Project task'}</span></div>
        <div className={styles.memberRow}><AssigneeList assignees={task.assignees} /></div>
        {(formattedDueDate || task.checklistItems?.length > 0 || task.tags?.length > 0) && <div className={styles.detailRow}><DueDate formattedDueDate={formattedDueDate} dueState={dueState} /><ChecklistSummary items={task.checklistItems} /><TagList tags={task.tags} /></div>}
        <div className={`${styles.actionRow} ${hasParticipation ? styles.withParticipation : ''}`}><DiscussionCount count={task.commentCount} /></div>
    </CardShell>;
}
