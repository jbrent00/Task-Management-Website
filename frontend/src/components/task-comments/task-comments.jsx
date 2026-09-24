import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useAuth } from '@clerk/react';
import { createTaskComment, deleteTaskComment, getTaskComments, updateTaskComment } from '../../api/projectTasks';
import styles from './task-comments.module.css';

const nameOf = (person) => [person?.fname, person?.lname].filter(Boolean).join(' ') || person?.primaryEmail || 'Member';

function MentionedText({ body, mentions }) {
    const parts = []; let cursor = 0;
    for (const mention of mentions) {
        parts.push(body.slice(cursor, mention.start));
        parts.push(<strong className={styles.mention} key={`${mention.start}-${mention.userId}`}>{body.slice(mention.start, mention.end)}</strong>);
        cursor = mention.end;
    }
    parts.push(body.slice(cursor));
    return <>{parts}</>;
}

function adjustMentions(previous, next, mentions) {
    let start = 0; while (start < previous.length && start < next.length && previous[start] === next[start]) start += 1;
    let oldEnd = previous.length; let newEnd = next.length;
    while (oldEnd > start && newEnd > start && previous[oldEnd - 1] === next[newEnd - 1]) { oldEnd -= 1; newEnd -= 1; }
    const delta = newEnd - oldEnd;
    return mentions.flatMap((mention) => {
        if (mention.end <= start) return [mention];
        if (mention.start >= oldEnd) return [{ ...mention, start: mention.start + delta, end: mention.end + delta }];
        return [];
    });
}

function CommentComposer({ members, initialBody = '', initialMentions = [], submitLabel, onSubmit, onCancel, disabled }) {
    const [body, setBody] = useState(initialBody); const [mentions, setMentions] = useState(initialMentions.map(({ userId, start, end }) => ({ userId, start, end })));
    const [suggestion, setSuggestion] = useState(null); const [activeChoiceIndex, setActiveChoiceIndex] = useState(0); const [busy, setBusy] = useState(false); const textarea = useRef(null);
    const mentionListId = useId();
    const choices = useMemo(() => suggestion ? members.filter((member) => `${nameOf(member.user)} ${member.user?.primaryEmail ?? ''}`.toLowerCase().includes(suggestion.query.toLowerCase())).slice(0, 6) : [], [members, suggestion]);
    const change = (event) => {
        const next = event.target.value; setMentions((current) => adjustMentions(body, next, current)); setBody(next);
        const caret = event.target.selectionStart; const match = next.slice(0, caret).match(/@([^@\n]*)$/);
        setSuggestion(match ? { start: caret - match[0].length, end: caret, query: match[1].trimStart() } : null); setActiveChoiceIndex(0);
    };
    const insertMention = (member) => {
        const label = `@${nameOf(member.user)}`; const next = `${body.slice(0, suggestion.start)}${label}${body.slice(suggestion.end)}`;
        const delta = label.length - (suggestion.end - suggestion.start);
        const shifted = mentions.flatMap((mention) => mention.end <= suggestion.start ? [mention] : mention.start >= suggestion.end ? [{ ...mention, start: mention.start + delta, end: mention.end + delta }] : []);
        setBody(next); setMentions([...shifted, { userId: member.userId, start: suggestion.start, end: suggestion.start + label.length }].sort((a, b) => a.start - b.start)); setSuggestion(null);
        window.requestAnimationFrame(() => { textarea.current?.focus(); textarea.current?.setSelectionRange(suggestion.start + label.length, suggestion.start + label.length); });
    };
    const chooseMentionWithKeyboard = (event) => {
        if (!suggestion) return;
        if (event.key === 'Escape') { event.preventDefault(); setSuggestion(null); return; }
        if (!choices.length) return;
        if (event.key === 'ArrowDown') { event.preventDefault(); setActiveChoiceIndex((current) => (current + 1) % choices.length); }
        if (event.key === 'ArrowUp') { event.preventDefault(); setActiveChoiceIndex((current) => (current - 1 + choices.length) % choices.length); }
        if (event.key === 'Enter') { event.preventDefault(); insertMention(choices[activeChoiceIndex] ?? choices[0]); }
    };
    const submit = async (event) => { event.preventDefault(); if (!body.trim()) return; setBusy(true); try { await onSubmit({ body, mentions }); setBody(''); setMentions([]); setSuggestion(null); } finally { setBusy(false); } };
    return <form className={styles.composer} onSubmit={submit}>
        <textarea ref={textarea} maxLength="2000" value={body} disabled={disabled || busy} onChange={change} onKeyDown={chooseMentionWithKeyboard} placeholder="Write a comment. Type @ to mention someone." aria-label="Comment" aria-autocomplete="list" aria-controls={suggestion ? mentionListId : undefined} aria-activedescendant={suggestion && choices.length ? `${mentionListId}-${activeChoiceIndex}` : undefined} />
        {suggestion && <div id={mentionListId} className={styles.suggestions} role="listbox" aria-label="Mention a project member">{choices.length ? choices.map((member, index) => <button id={`${mentionListId}-${index}`} type="button" role="option" aria-selected={index === activeChoiceIndex} key={member.userId} onMouseEnter={() => setActiveChoiceIndex(index)} onMouseDown={(event) => event.preventDefault()} onClick={() => insertMention(member)}>{nameOf(member.user)}<small>{member.user?.primaryEmail}</small></button>) : <p>No matching members</p>}</div>}
        <div className={styles.composerActions}><small>{body.length}/2000</small>{onCancel && <button type="button" onClick={onCancel}>Cancel</button>}<button className={styles.primary} disabled={disabled || busy || !body.trim()}>{busy ? 'Saving…' : submitLabel}</button></div>
    </form>;
}

export default function TaskComments({ task, project, onChanged }) {
    const { getToken, userId } = useAuth(); const [items, setItems] = useState([]); const [cursor, setCursor] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [editingId, setEditingId] = useState(null);
    const load = useCallback(async (older = false) => {
        setLoading(true); try { const page = await getTaskComments(await getToken(), task.id, older ? cursor : null); setItems((current) => older ? [...page.items, ...current] : page.items); setCursor(page.nextCursor); setError(''); } catch (loadError) { setError(loadError.message); } finally { setLoading(false); }
    }, [getToken, task.id, cursor]);
    useEffect(() => { load(false); }, [task.id]); // eslint-disable-line react-hooks/exhaustive-deps
    const create = async (input) => { try { const comment = await createTaskComment(await getToken(), task.id, input); setItems((current) => [...current, comment]); setError(''); onChanged?.(1); window.dispatchEvent(new Event('collaboration:refresh')); } catch (saveError) { setError(saveError.message); throw saveError; } };
    const update = async (comment, input) => { try { const updated = await updateTaskComment(await getToken(), task.id, comment.id, input); setItems((current) => current.map((item) => item.id === comment.id ? updated : item)); setEditingId(null); onChanged?.(0); } catch (saveError) { setError(saveError.message); throw saveError; } };
    const remove = async (comment) => { if (!window.confirm('Delete this comment? A deleted-comment marker will remain.')) return; try { await deleteTaskComment(await getToken(), task.id, comment.id); setItems((current) => current.map((item) => item.id === comment.id ? { ...item, body: null, mentions: [], deletedAt: new Date().toISOString(), deletedById: userId } : item)); onChanged?.(-1); } catch (deleteError) { setError(deleteError.message); } };
    return <section className={styles.comments}>
        <div className={styles.heading}><h3>Discussion</h3><span>{items.length} loaded</span></div>
        {cursor && <button className={styles.older} disabled={loading} onClick={() => load(true)}>Load older comments</button>}
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.list}>{items.map((comment) => <article key={comment.id} className={styles.comment}>
            <div className={styles.commentHead}><div>{comment.author.imageUrl ? <img src={comment.author.imageUrl} alt="" /> : <span>{nameOf(comment.author).slice(0, 1).toUpperCase()}</span>}<p><strong>{nameOf(comment.author)}</strong><small>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(comment.createdAt))}{comment.editedAt ? ' · edited' : ''}</small></p></div>{!comment.deletedAt && !project.archivedAt && (comment.authorId === userId || project.role === 'owner') && <div className={styles.commentActions}>{comment.authorId === userId && <button onClick={() => setEditingId(comment.id)}>Edit</button>}<button onClick={() => remove(comment)}>Delete</button></div>}</div>
            {comment.deletedAt ? <p className={styles.deleted}>This comment was deleted.</p> : editingId === comment.id ? <CommentComposer members={project.memberships} initialBody={comment.body} initialMentions={comment.mentions} submitLabel="Save comment" onSubmit={(input) => update(comment, input)} onCancel={() => setEditingId(null)} /> : <p className={styles.body}><MentionedText body={comment.body} mentions={comment.mentions} /></p>}
        </article>)}</div>
        {!loading && items.length === 0 && <p className={styles.empty}>No comments yet. Start the conversation.</p>}
        {!project.archivedAt && <CommentComposer members={project.memberships} submitLabel="Comment" onSubmit={create} />}
    </section>;
}
