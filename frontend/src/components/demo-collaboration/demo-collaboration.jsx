import styles from './demo-collaboration.module.css';

const formatDate = (value) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

function GuestNote() {
  return <p className={styles.guestNote}>Sample history is read-only. <a href="/sign-up">Create an account</a> to collaborate with your team.</p>;
}

export function DemoDiscussion({ task }) {
  const comments = task.discussion ?? [];
  return <section className={styles.section} aria-label="Task discussion">
    <div className={styles.heading}><h3>Discussion</h3><span>Demo data</span></div>
    <div className={styles.items}>{comments.map((comment) => <article className={styles.comment} key={comment.id}>
      <div className={styles.author}><span className={styles.avatar} aria-hidden="true">{comment.author.slice(0, 1)}</span><div><strong>{comment.author}</strong><time dateTime={comment.createdAt}>{formatDate(comment.createdAt)}</time></div></div>
      <p>{comment.body}</p>
    </article>)}{comments.length === 0 && <p className={styles.empty}>No sample discussion for this task yet.</p>}</div>
    <div className={styles.composer}><label htmlFor={`demo-comment-${task.id}`}>Add to discussion</label><textarea id={`demo-comment-${task.id}`} placeholder="Create an account to write a comment." disabled /><button type="button" disabled>Comment</button></div>
    <GuestNote />
  </section>;
}

export function DemoActivity({ tasks, taskId = null }) {
  const entries = tasks.flatMap((task) => (task.activity ?? []).map((item) => ({ ...item, taskTitle: task.title }))).sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt));
  return <section className={styles.section} aria-label={taskId ? 'Task activity' : 'Project activity'}>
    <div className={styles.heading}><h3>{taskId ? 'Activity' : 'Project activity'}</h3><span>Demo data</span></div>
    <div className={styles.items}>{entries.map((item) => <article className={styles.event} key={item.id}><p><strong>{item.actor}</strong> {item.text}{!taskId && <> on “{item.taskTitle}”</>}</p><time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time></article>)}{entries.length === 0 && <p className={styles.empty}>No sample activity for this task yet.</p>}</div>
    <GuestNote />
  </section>;
}
