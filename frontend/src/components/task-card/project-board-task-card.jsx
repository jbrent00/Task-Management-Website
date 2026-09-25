import { AssigneeList, CardShell, ChecklistSummary, DetailAction, DiscussionCount, DueDate, ParticipationAction, TagList, TitleRow } from './task-card-parts';
import styles from './project-board-task-card.module.css';

export default function ProjectBoardTaskCard({ view, busy, onCompletion, onOpenDetails, onParticipation, dragHandleProps, isDragEnabled }) {
    const { task, formattedDueDate, dueState } = view;
    const hasParticipation = Boolean(onParticipation);
    return <CardShell task={task} busy={busy} onCompletion={onCompletion} dragHandleProps={dragHandleProps} isDragEnabled={isDragEnabled} actions={<><ParticipationAction label={task.capabilities?.canJoin ? 'Join' : 'Leave'} busy={busy} onClick={onParticipation} /><DetailAction task={task} busy={busy} onOpenDetails={onOpenDetails} /></>}>
        <TitleRow task={task} />
        <div className={styles.assigneeRow}><AssigneeList assignees={task.assignees} /></div>
        {task.tags?.length > 0 && <div className={styles.tagRow}><TagList tags={task.tags} limit={3} /></div>}
        <div className={`${styles.actionRow} ${hasParticipation ? styles.withParticipation : ''}`}><DiscussionCount count={task.commentCount} /><DueDate formattedDueDate={formattedDueDate} dueState={dueState} /><ChecklistSummary items={task.checklistItems} /></div>
    </CardShell>;
}
