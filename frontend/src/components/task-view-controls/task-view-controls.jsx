import styles from './task-view-controls.module.css';
import { getActiveSort, hasActiveTaskFilters } from '../../functions/taskViews';
import { noProjectFilter } from '../../functions/taskViews';
import ProjectTagManager from '../project-tag-manager/project-tag-manager';
import TaskSelectField from '../task-form-controls/task-select-field';
import { useState } from 'react';
import { CaretDownIcon } from '@phosphor-icons/react/dist/csr/CaretDown';
import { CaretRightIcon } from '@phosphor-icons/react/dist/csr/CaretRight';
import { FunnelSimpleIcon } from '@phosphor-icons/react/dist/csr/FunnelSimple';

const filterOptions = {
    priorityFilters: [['high', 'High'], ['medium', 'Medium'], ['low', 'Low']],
    statusFilters: [['todo', 'To do'], ['in_progress', 'In progress'], ['completed', 'Completed']],
    dueFilters: [['overdue', 'Overdue'], ['noDueDate', 'No due date']],
};
const filterLabels = { priorityFilters: 'Priority', statusFilters: 'Status', dueFilters: 'Due' };

function TaskViewControls({ view, searchQuery, onSearchChange, onViewChange, onClearFilters, projects, tags, onUpdateTag, onDeleteTag, onNotify }) {
    const [filtersExpanded, setFiltersExpanded] = useState(false);
    const activeSort = getActiveSort(view);
    const toggleFilter = (filterName, value) => {
        const values = view[filterName];
        onViewChange({ ...view, [filterName]: values.includes(value) ? values.filter((currentValue) => currentValue !== value) : [...values, value] });
    };
    const activeLabels = [
        ...Object.entries(filterOptions).flatMap(([filterName, options]) => view[filterName].map((value) => `${filterLabels[filterName]}: ${options.find(([optionValue]) => optionValue === value)?.[1]}`)),
        ...(view.projectId === noProjectFilter ? ['Project: No project'] : view.projectId !== null ? [`Project: ${projects.find((project) => project.id === view.projectId)?.title}`] : []),
        ...view.tagIds.map((id) => `Tag: ${tags.find((tag) => tag.id === id)?.name}`),
    ].filter(Boolean);
    const hasActiveView = hasActiveTaskFilters(view) || Boolean(searchQuery.trim());
    const sortLabel = { priority: 'Priority', dueDate: 'Due date', title: 'Title (A to Z)', createdAt: 'Creation date', completedAt: 'Completion date' }[activeSort];

    return (
        <section className={styles.controls} aria-label="Task view controls">
            <div className={styles.topRow}>
                <label className={styles.searchField} htmlFor="task-search"><span>Search tasks</span><input id="task-search" type="search" value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search titles and descriptions" /></label>
                <TaskSelectField label="Sort by" compact value={activeSort} onChange={(value) => onViewChange({ ...view, sorts: { ...view.sorts, [view.selectedTab]: value } })} options={[{ value: 'manual', label: 'Manual order' }, { value: 'priority', label: 'Priority' }, { value: 'dueDate', label: 'Due date' }, { value: 'title', label: 'Title (A to Z)' }, { value: 'createdAt', label: 'Creation date' }, { value: 'completedAt', label: 'Completion date' }]} />
            </div>
            <button className={styles.filterToggle} type="button" onClick={() => setFiltersExpanded((value) => !value)} aria-expanded={filtersExpanded} aria-controls="task-filter-content"><FunnelSimpleIcon size={18} />{filtersExpanded ? 'Hide filters' : 'Filters'}{filtersExpanded ? <CaretDownIcon size={16} /> : <CaretRightIcon size={16} />}</button>
            <div id="task-filter-content" className={styles.filterContent} hidden={!filtersExpanded}>
            <div className={styles.projectRow}><TaskSelectField label="Project" compact value={view.projectId ?? 'all'} onChange={(value) => onViewChange({ ...view, projectId: value === 'all' ? null : value === noProjectFilter ? noProjectFilter : Number(value) })} options={[{ value: 'all', label: 'All tasks' }, { value: noProjectFilter, label: 'No project' }, ...projects.map((project) => ({ value: project.id, label: project.title }))]} /><ProjectTagManager tags={tags} onUpdateTag={onUpdateTag} onDeleteTag={onDeleteTag} onNotify={onNotify} /></div>
            <fieldset className={styles.filterGroup}><legend>Tags (match any)</legend>{tags.map((tag) => <label className={styles.checkLabel} key={tag.id}><input type="checkbox" checked={view.tagIds.includes(tag.id)} onChange={() => onViewChange({ ...view, tagIds: view.tagIds.includes(tag.id) ? view.tagIds.filter((id) => id !== tag.id) : [...view.tagIds, tag.id] })} />{tag.name}</label>)}</fieldset>
            <div className={styles.filters}>
                {Object.entries(filterOptions).map(([filterName, options]) => <fieldset className={styles.filterGroup} key={filterName}><legend>{filterLabels[filterName]}</legend>{options.map(([value, label]) => <label className={styles.checkLabel} key={value}><input type="checkbox" checked={view[filterName].includes(value)} onChange={() => toggleFilter(filterName, value)} />{label}</label>)}</fieldset>)}
            </div>
            </div>
            {(activeSort !== 'manual' || hasActiveView) && <div className={styles.viewSummary}><div className={styles.chips} aria-label="Active view settings">{activeSort !== 'manual' && <span className={styles.chip}>Sorted by: {sortLabel}</span>}{activeLabels.map((label) => <span className={styles.chip} key={label}>{label}</span>)}{searchQuery.trim() && <span className={styles.chip}>Search active</span>}</div>{hasActiveView && <button className={styles.clearButton} type="button" onClick={onClearFilters}>Clear filters</button>}</div>}
            {activeSort !== 'manual' && <p className={styles.reorderNotice}>Drag reordering is unavailable while an automatic sort is active. Choose Manual order to reorder tasks.</p>}
        </section>
    );
}

export default TaskViewControls;
