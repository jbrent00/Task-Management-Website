import { useId } from 'react';
import styles from './tag-color-picker.module.css';

const tagColors = ['slate', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple'];

export default function TagColorPicker({ value, onChange, name = '', label = 'Color', action }) {
    const groupName = useId();
    return <fieldset className={styles.picker}>
        <legend>{label}</legend>
        <div className={styles.choices}>
            {tagColors.map((color) => <label key={color} className={`${styles.choice} ${styles[`color_${color}`]}`}>
                <input type="radio" name={groupName} value={color} checked={value === color} onChange={() => onChange(color)} />
                <span className={styles.swatch} aria-hidden="true" /><span>{color}</span>
            </label>)}
        </div>
        <div className={styles.previewLine}><div className={styles.previewInfo}><span>Preview</span><span className={`${styles.preview} ${styles[`color_${value}`]}`}>{name.trim() || 'Tag name'}</span></div>{action}</div>
    </fieldset>;
}
