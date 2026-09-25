import styles from './task-assignment-fields.module.css';
import MemberPicker from '../member-picker/member-picker';
import TaskTagPicker from '../task-tag-picker/task-tag-picker';
import TaskSelectField from '../task-form-controls/task-select-field';

function TaskAssignmentFields({ projects = [], tags, projectId, tagIds, onProjectChange, onTagIdsChange, onCreateTag, showProject = true, members = [], assigneeIds = [], onAssigneesChange, compactTags = false }) {
    return <div className={styles.assignments}>
        {showProject && <TaskSelectField label="Project" value={projectId ?? ''} onChange={(value) => onProjectChange(value ? Number(value) : null)} options={[{ value: '', label: 'No project' }, ...projects.map((project) => ({ value: project.id, label: project.title }))]} />}
        {onAssigneesChange && <MemberPicker members={members} selectedIds={assigneeIds} onChange={onAssigneesChange} />}
        <TaskTagPicker tags={tags} selectedIds={tagIds} onChange={onTagIdsChange} onCreateTag={onCreateTag} compact={compactTags} />
    </div>;
}

export default TaskAssignmentFields;
