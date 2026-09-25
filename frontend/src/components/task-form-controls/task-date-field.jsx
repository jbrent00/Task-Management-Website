import { useEffect, useRef, useState } from 'react';
import { CalendarBlankIcon } from '@phosphor-icons/react/dist/csr/CalendarBlank';
import { CaretLeftIcon } from '@phosphor-icons/react/dist/csr/CaretLeft';
import { CaretRightIcon } from '@phosphor-icons/react/dist/csr/CaretRight';
import styles from './task-form-controls.module.css';

const pad = (value) => String(value).padStart(2, '0');
const dateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const makeDate = (key) => { const [year, month, day] = key.split('-').map(Number); return new Date(year, month - 1, day); };
const todayKey = () => dateKey(new Date());
const monthName = (date) => new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(date);
const dateLabel = (value) => {
    if (!value) return 'Choose a date and time';
    const [day, time = '09:00'] = value.split('T');
    return `${new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(makeDate(day))} at ${time}`;
};
const moveDay = (key, offset) => { const date = makeDate(key); date.setDate(date.getDate() + offset); return dateKey(date); };

export default function TaskDateField({ label = 'Due date', value, onChange, min, disabled = false }) {
    const [open, setOpen] = useState(false);
    const [timeOpen, setTimeOpen] = useState(false);
    const [visibleMonth, setVisibleMonth] = useState(() => makeDate((value || todayKey()).slice(0, 10)));
    const [activeDay, setActiveDay] = useState(() => (value || todayKey()).slice(0, 10));
    const root = useRef(null);
    const trigger = useRef(null);
    const timeTrigger = useRef(null);
    const calendar = useRef(null);
    const minuteColumn = useRef(null);
    const selectedDate = value?.slice(0, 10) ?? '';
    const selectedTime = value?.slice(11, 16) || '09:00';
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const displayHour = hours % 12 || 12;
    const period = hours < 12 ? 'AM' : 'PM';
    const minuteOptions = Array.from({ length: 60 }, (_, index) => index);
    const changeTime = (hour, minute, nextPeriod) => {
        const hour24 = hour % 12 + (nextPeriod === 'PM' ? 12 : 0);
        const nextTime = `${pad(hour24)}:${pad(minute)}`;
        if (selectedDate && (!min || `${selectedDate}T${nextTime}` >= min)) onChange(`${selectedDate}T${nextTime}`);
    };
    const minimumDay = min?.slice(0, 10);
    const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const start = new Date(first); start.setDate(1 - first.getDay());
    const days = Array.from({ length: 42 }, (_, index) => { const day = new Date(start); day.setDate(start.getDate() + index); return day; });

    useEffect(() => {
        if (!open) return undefined;
        const closeOutside = (event) => { if (!root.current?.contains(event.target)) setOpen(false); };
        document.addEventListener('pointerdown', closeOutside);
        calendar.current?.querySelector(`[data-date="${activeDay}"]`)?.focus();
        calendar.current?.scrollIntoView?.({ block: 'center' });
        return () => document.removeEventListener('pointerdown', closeOutside);
    }, [open, activeDay]);
    useEffect(() => {
        if (timeOpen && minuteColumn.current) minuteColumn.current.scrollTop = Math.max(0, minutes * 33 - 65);
    }, [timeOpen, minutes]);

    const openCalendar = () => {
        const startingDay = selectedDate || todayKey();
        setActiveDay(startingDay);
        setVisibleMonth(makeDate(startingDay));
        setOpen(true);
    };
    const chooseDay = (key) => {
        const defaultTime = minimumDay === key && !value ? min.slice(11, 16) : selectedTime;
        onChange(`${key}T${defaultTime}`);
        setActiveDay(key);
        setTimeOpen(false);
    };
    const shiftMonth = (offset) => {
        const next = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1);
        setVisibleMonth(next);
        setActiveDay(dateKey(next));
    };
    const handleDayKeyDown = (event, key) => {
        const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus(); return; }
        if (event.key === 'Tab' && !event.shiftKey) { event.preventDefault(); if (timeTrigger.current && !timeTrigger.current.disabled) timeTrigger.current.focus(); else calendar.current?.querySelector('[data-action="done"]')?.focus(); return; }
        if (event.key in offsets) {
            event.preventDefault();
            const next = moveDay(key, offsets[event.key]);
            if (minimumDay && next < minimumDay) return;
            setActiveDay(next);
            setVisibleMonth(makeDate(next));
        }
    };
    const handleTimeKeyDown = (event) => {
        if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
        const buttons = [...event.target.parentElement.querySelectorAll('button')];
        const index = buttons.indexOf(event.target);
        if (index < 0) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : Math.max(0, Math.min(buttons.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)));
        buttons[next]?.focus();
    };

    return <div ref={root} className={styles.field}>
        <span className={styles.label}>{label}</span>
        <div className={styles.anchor}>
            <button ref={trigger} type="button" className={`${styles.trigger} ${!value ? styles.placeholder : ''}`} disabled={disabled} aria-label={label} aria-haspopup="dialog" aria-expanded={open} onClick={() => open ? setOpen(false) : openCalendar()}><span>{dateLabel(value)}</span><CalendarBlankIcon size={18} aria-hidden="true" /></button>
            {open && <div ref={calendar} className={styles.calendar} role="dialog" aria-label="Choose due date" onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); if (timeOpen) { setTimeOpen(false); timeTrigger.current?.focus(); } else { setOpen(false); trigger.current?.focus(); } } }}>
                <div className={styles.calendarHeader}><strong>{monthName(visibleMonth)}</strong><div><button type="button" aria-label="Previous month" onClick={() => shiftMonth(-1)}><CaretLeftIcon size={17} /></button><button type="button" aria-label="Next month" onClick={() => shiftMonth(1)}><CaretRightIcon size={17} /></button></div></div>
                <div className={styles.calendarGrid}>{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <span key={index} className={styles.weekday}>{day}</span>)}{days.map((day) => { const key = dateKey(day); return <button key={key} type="button" data-date={key} className={`${day.getMonth() !== visibleMonth.getMonth() ? styles.outsideMonth : ''} ${key === todayKey() ? styles.today : ''}`} disabled={Boolean(minimumDay && key < minimumDay)} aria-label={new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(day)} aria-pressed={key === selectedDate} onClick={() => chooseDay(key)} onKeyDown={(event) => handleDayKeyDown(event, key)}>{day.getDate()}</button>; })}</div>
                <div className={styles.calendarFooter}><div className={styles.timeField}><span>Time</span><button ref={timeTrigger} type="button" className={styles.timeTrigger} disabled={!selectedDate} aria-label="Time" aria-haspopup="dialog" aria-expanded={timeOpen} onClick={() => setTimeOpen((current) => !current)}>{pad(displayHour)}:{pad(minutes)} <small>{period}</small></button>{timeOpen && <div className={styles.timePanel} role="group" aria-label="Choose time" onKeyDown={handleTimeKeyDown}><div><span>Hour</span>{Array.from({ length: 12 }, (_, index) => index + 1).map((hour) => <button key={hour} type="button" aria-label={`Hour ${hour}`} aria-pressed={hour === displayHour} onClick={() => changeTime(hour, minutes, period)}>{pad(hour)}</button>)}</div><div ref={minuteColumn}><span>Minute</span>{minuteOptions.map((minute) => <button key={minute} type="button" aria-label={`Minute ${pad(minute)}`} aria-pressed={minute === minutes} onClick={() => changeTime(displayHour, minute, period)}>{pad(minute)}</button>)}</div><div><span>Period</span>{['AM', 'PM'].map((nextPeriod) => <button key={nextPeriod} type="button" aria-pressed={nextPeriod === period} onClick={() => changeTime(displayHour, minutes, nextPeriod)}>{nextPeriod}</button>)}</div></div>}</div><div><button type="button" onClick={() => { onChange(''); setTimeOpen(false); setOpen(false); trigger.current?.focus(); }}>Clear</button><button type="button" data-action="done" className={styles.done} onClick={() => { setTimeOpen(false); setOpen(false); trigger.current?.focus(); }}>Done</button></div></div>
            </div>}
        </div>
    </div>;
}
