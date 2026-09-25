import styles from './task-view-tabs.module.css';
import { taskViewTabs } from '../../functions/taskViews';
import TaskSelectField from '../task-form-controls/task-select-field';

function TaskViewTabs({ selectedTab, counts, onSelect }) {
    return <><div className={styles.selector}><TaskSelectField label="Date view" value={selectedTab} onChange={onSelect} options={taskViewTabs.map(([value, label]) => ({ value, label: `${label} (${counts[value] ?? 0})` }))} /></div><nav className={styles.tabs} aria-label="Date-focused task views">
        {taskViewTabs.map(([value, label]) => <button key={value} type="button" className={`${styles.tab} ${selectedTab === value ? styles.active : ''}`} aria-current={selectedTab === value ? 'page' : undefined} onClick={() => onSelect(value)}>{label}<span className={styles.count}>{counts[value] ?? 0}</span></button>)}
    </nav></>;
}

export default TaskViewTabs;
