import { CardShell, ChecklistSummary, DetailAction, DiscussionCount, DueDate, ParticipationAction, TitleRow } from './task-card-parts';
import styles from './my-tasks-project-card.module.css';

export default function MyTasksProjectCard({ view, busy, onCompletion, onOpenDetails, onParticipation }) {
    const { task, formattedDueDate, dueState } = view;
    const hasParticipation = Boolean(onParticipation);
    return <CardShell task={task} busy={busy} onCompletion={onCompletion} actions={<><ParticipationAction label={task.capabilities?.canJoin ? 'Join' : 'Leave'} busy={busy} onClick={onParticipation} /><DetailAction task={task} busy={busy} onOpenDetails={onOpenDetails} /></>}>
        <TitleRow task={task} />
        <div className={styles.projectRow}><span className={styles.projectName}>{task.project?.title ?? 'Project task'}</span></div>
        <div className={`${styles.utilityRow} ${hasParticipation ? styles.withParticipation : ''}`}>
            <div className={styles.discussion}><DiscussionCount count={task.commentCount} /></div>
            {(formattedDueDate || task.checklistItems?.length > 0) && <div className={styles.detailMeta}><DueDate formattedDueDate={formattedDueDate} dueState={dueState} /><ChecklistSummary items={task.checklistItems} /></div>}
        </div>
    </CardShell>;
}
