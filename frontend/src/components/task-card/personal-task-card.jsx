import { CardShell, ChecklistSummary, DetailAction, DueDate, TagList, TitleRow } from './task-card-parts';
import styles from './personal-task-card.module.css';

export default function PersonalTaskCard({ view, busy, onCompletion, onOpenDetails, dragHandleProps, isDragEnabled }) {
    const { task, formattedDueDate, dueState } = view;
    return <CardShell task={task} busy={busy} onCompletion={onCompletion} dragHandleProps={dragHandleProps} isDragEnabled={isDragEnabled} actions={<DetailAction task={task} busy={busy} onOpenDetails={onOpenDetails} />}>
        <TitleRow task={task} />
        <div className={styles.metadata}><DueDate formattedDueDate={formattedDueDate} dueState={dueState} /><ChecklistSummary items={task.checklistItems} /><TagList tags={task.tags} /></div>
    </CardShell>;
}
