import styles from './task-view-controls.module.css';
import { hasActiveTaskFilters, noProjectFilter } from '../../functions/taskViews';
import ProjectTagManager from '../project-tag-manager/project-tag-manager';

const filterOptions = {
    priorityFilters: [['high', 'High'], ['medium', 'Medium'], ['low', 'Low']],
    statusFilters: [['todo', 'To do'], ['in_progress', 'In progress'], ['completed', 'Completed']],
    dueFilters: [['overdue', 'Overdue'], ['noDueDate', 'No due date']],
};
const filterLabels = { priorityFilters: 'Priority', statusFilters: 'Status', dueFilters: 'Due' };

function TaskViewControls({ view, searchQuery, onSearchChange, onViewChange, onClearFilters, projects, tags, projectCounts, onCreateProject, onUpdateProject, onDeleteProject, onUpdateTag, onDeleteTag }) {
    const toggleFilter = (filterName, value) => {
        const values = view[filterName];
        onViewChange({ ...view, [filterName]: values.includes(value) ? values.filter((currentValue) => currentValue !== value) : [...values, value] });
    };
    const activeLabels = Object.entries(filterOptions).flatMap(([filterName, options]) => view[filterName].map((value) => `${filterLabels[filterName]}: ${options.find(([optionValue]) => optionValue === value)?.[1]}`));
    const tagLabels = tags.filter((tag) => view.tagIds.includes(tag.id)).map((tag) => `Tag: ${tag.name}`);
    const hasActiveView = hasActiveTaskFilters(view) || Boolean(searchQuery.trim());
    const sortLabel = { priority: 'Priority', dueDate: 'Due date', title: 'Title (A–Z)', createdAt: 'Creation date' }[view.sort];

    return (
        <section className={styles.controls} aria-label="Task view controls">
            <div className={styles.topRow}>
                <label className={styles.searchField} htmlFor="task-search"><span>Search tasks</span><input id="task-search" type="search" value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search titles and descriptions" /></label>
                <label className={styles.sortField} htmlFor="task-sort"><span>Sort by</span><select id="task-sort" value={view.sort} onChange={(event) => onViewChange({ ...view, sort: event.target.value })}><option value="manual">Manual order</option><option value="priority">Priority</option><option value="dueDate">Due date</option><option value="title">Title (A–Z)</option><option value="createdAt">Creation date</option></select></label>
            </div>
            <div className={styles.projectRow}><label className={styles.sortField} htmlFor="project-filter"><span>Project</span><select id="project-filter" value={view.projectId ?? 'all'} onChange={(event) => onViewChange({ ...view, projectId: event.target.value === 'all' ? null : event.target.value === noProjectFilter ? noProjectFilter : Number(event.target.value) })}><option value="all">All tasks</option><option value={noProjectFilter}>No project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label><ProjectTagManager projects={projects} tags={tags} projectCounts={projectCounts} onCreateProject={onCreateProject} onUpdateProject={onUpdateProject} onDeleteProject={onDeleteProject} onUpdateTag={onUpdateTag} onDeleteTag={onDeleteTag} /></div>
            <fieldset className={styles.filterGroup}><legend>Tags (match any)</legend>{tags.map((tag) => <label className={styles.checkLabel} key={tag.id}><input type="checkbox" checked={view.tagIds.includes(tag.id)} onChange={() => onViewChange({ ...view, tagIds: view.tagIds.includes(tag.id) ? view.tagIds.filter((id) => id !== tag.id) : [...view.tagIds, tag.id] })} />{tag.name}</label>)}</fieldset>
            <div className={styles.filters}>
                {Object.entries(filterOptions).map(([filterName, options]) => <fieldset className={styles.filterGroup} key={filterName}><legend>{filterLabels[filterName]}</legend>{options.map(([value, label]) => <label className={styles.checkLabel} key={value}><input type="checkbox" checked={view[filterName].includes(value)} onChange={() => toggleFilter(filterName, value)} />{label}</label>)}</fieldset>)}
            </div>
            {(view.sort !== 'manual' || hasActiveView) && <div className={styles.viewSummary}><div className={styles.chips} aria-label="Active view settings">{view.sort !== 'manual' && <span className={styles.chip}>Sorted by: {sortLabel}</span>}{view.projectId && <span className={styles.chip}>{view.projectId === noProjectFilter ? 'No project' : `Project: ${projects.find((project) => project.id === view.projectId)?.title ?? ''}`}</span>}{[...activeLabels, ...tagLabels].map((label) => <span className={styles.chip} key={label}>{label}</span>)}{searchQuery.trim() && <span className={styles.chip}>Search active</span>}</div>{hasActiveView && <button className={styles.clearButton} type="button" onClick={onClearFilters}>Clear filters</button>}</div>}
            {view.sort !== 'manual' && <p className={styles.reorderNotice}>Drag reordering is unavailable while an automatic sort is active. Choose Manual order to reorder tasks.</p>}
        </section>
    );
}

export default TaskViewControls;
