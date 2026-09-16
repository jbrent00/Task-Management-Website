import styles from './task-view-tabs.module.css';
import { taskViewTabs } from '../../functions/taskViews';

function TaskViewTabs({ selectedTab, counts, onSelect }) {
    return <><label className={styles.selector}>Date view<select value={selectedTab} onChange={(event) => onSelect(event.target.value)}>{taskViewTabs.map(([value, label]) => <option key={value} value={value}>{label} ({counts[value] ?? 0})</option>)}</select></label><nav className={styles.tabs} aria-label="Date-focused task views">
        {taskViewTabs.map(([value, label]) => <button key={value} type="button" className={`${styles.tab} ${selectedTab === value ? styles.active : ''}`} aria-current={selectedTab === value ? 'page' : undefined} onClick={() => onSelect(value)}>{label}<span className={styles.count}>{counts[value] ?? 0}</span></button>)}
    </nav></>;
}

export default TaskViewTabs;
