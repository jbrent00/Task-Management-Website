function toLocalDateTimeInput(utcString) {
    const date = new Date(utcString);
    const yyyy = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
}

export const getLocalDateTimeMinimum = () => `${toLocalDateTimeInput(new Date()).slice(0, 10)}T00:00`;

export default toLocalDateTimeInput;
