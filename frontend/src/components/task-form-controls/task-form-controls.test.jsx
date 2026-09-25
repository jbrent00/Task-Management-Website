import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import TaskSelectField from './task-select-field';
import TaskDateField from './task-date-field';

test('selects a dropdown option with the keyboard and returns focus to its trigger', () => {
    const onChange = vi.fn();
    render(<TaskSelectField label="Priority" value="low" onChange={onChange} options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Priority' }));
    fireEvent.keyDown(screen.getByRole('option', { name: /Low/ }), { key: 'ArrowDown' });
    expect(screen.getByRole('option', { name: 'Medium' })).toHaveFocus();
    fireEvent.click(screen.getByRole('option', { name: 'Medium' }));
    expect(onChange).toHaveBeenCalledWith('medium');
    expect(screen.getByRole('button', { name: 'Priority' })).toHaveFocus();
});

test('picks and clears a due date while respecting the minimum day', () => {
    const onChange = vi.fn();
    render(<TaskDateField value="" onChange={onChange} min="2026-09-25T00:00" />);
    fireEvent.click(screen.getByRole('button', { name: 'Due date' }));
    expect(screen.getByRole('button', { name: 'Thursday, September 24, 2026' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Saturday, September 26, 2026' }));
    expect(onChange).toHaveBeenCalledWith('2026-09-26T09:00');
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onChange).toHaveBeenLastCalledWith('');
    expect(screen.getByRole('button', { name: 'Due date' })).toHaveFocus();
});

test('edits an exact saved time through the styled time menu', () => {
    function Harness() {
        const [value, setValue] = useState('2026-09-26T09:17');
        return <TaskDateField value={value} onChange={setValue} />;
    }
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Due date' }));
    fireEvent.click(screen.getByRole('button', { name: 'Time' }));
    expect(screen.getByRole('button', { name: 'Minute 17' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.keyDown(screen.getByRole('button', { name: 'Minute 17' }), { key: 'ArrowDown' });
    expect(screen.getByRole('button', { name: 'Minute 18' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Minute 35' }));
    fireEvent.click(screen.getByRole('button', { name: 'PM' }));
    expect(screen.getByRole('button', { name: 'Time' })).toHaveTextContent('09:35 PM');
    expect(screen.getByRole('button', { name: 'Due date' })).toHaveTextContent('21:35');
});
