import { useAuth } from '@clerk/react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { PublicFooter, PublicLayout } from '../components/public-layout/public-layout';
import styles from './landing-page.module.css';

function Capture({ file, alt, className = '', eager = false }) {
  return <img className={`${styles.capture} ${className}`} src={`/captures/${file}`} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" />;
}

function AccountLink() {
  const { isSignedIn } = useAuth();
  return <Link className={styles.secondaryAction} to={isSignedIn ? '/tasks' : '/sign-up'}>{isSignedIn ? 'Open app' : 'Create an account'}</Link>;
}

function LandingPage() {
  return <PublicLayout><main id="main-content">
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.heroCopy}>
        <h1 id="hero-title">Personal tasks that grow into shared projects.</h1>
        <p>Plan daily work in one place. Add assignments, discussion, and activity when others join.</p>
        <a className={styles.primaryAction} href="/demo">Explore the demo <ArrowRightIcon size={18} aria-hidden="true" /></a>
      </div>
      <div className={styles.heroVisual}><Capture file="project-board-cards.png" alt="Northline project tasks moving through To do, In progress, and Completed" eager /></div>
    </section>

    <section id="product" className={styles.personal} aria-labelledby="personal-title">
      <div className={styles.sectionCopy}><span className={styles.kicker}>Personal planning</span><h2 id="personal-title">See the day. Keep the detail.</h2><p>Switch date views, filter the board, and keep the next checklist step with its task.</p><a className={styles.textLink} href="/demo">Try personal tasks <ArrowRightIcon size={18} aria-hidden="true" /></a></div>
      <div className={styles.personalVisual}><Capture file="my-tasks.jpg" alt="Flowboard personal task workspace with date views and filters" /><Capture file="personal-details-close.png" alt="Task title, description, priority, and due date in the task editor" className={styles.personalDetail} /></div>
    </section>

    <section className={styles.shared} aria-labelledby="shared-title">
      <div className={styles.sharedVisual}><Capture file="task-discussion-close.png" alt="Three Northline teammates discussing a task in Flowboard" /><p>Discussion stays with the task it concerns.</p></div>
      <div className={styles.sectionCopy}><h2 id="shared-title">A project gives the work a shared place.</h2><p>Assign owners, discuss decisions, and follow changes. Roles keep each person’s access clear.</p><a className={styles.textLink} href="/demo">Explore the shared project <ArrowRightIcon size={18} aria-hidden="true" /></a></div>
    </section>

    <section className={styles.depth} aria-labelledby="depth-title">
      <div className={styles.sectionIntro}><h2 id="depth-title">The useful details stay close.</h2><p>The task editor brings together the information people need to keep work moving.</p></div>
      <div className={styles.depthFeatures}>
        <article className={styles.featurePrimary}><div><h3>One task, the whole picture.</h3><p>Status, priority, due date, assignees, and tags live together. A checklist makes the next step visible.</p></div><Capture file="task-details-metadata.png" alt="Actual task editor showing status, due date, assignees, and tags" /></article>
        <article className={styles.featureSecondary}><div><h3>From idea to editable draft.</h3><p>Optional AI drafting helps start a description or checklist. The result remains yours to edit.</p></div><Capture file="ai-controls-close.png" alt="Actual task form showing the Generate description action and editable text" /></article>
      </div>
      <div className={styles.supportingDetails}><p><strong>Tags</strong><span>Group related work across personal and shared tasks.</span></p><p><strong>Due-date views</strong><span>Find what is due today, soon, or overdue.</span></p><p><strong>Notifications</strong><span>See mentions and assignments in the signed-in inbox.</span></p></div>
    </section>

    <section className={styles.workflows} aria-labelledby="workflows-title">
      <div className={styles.workflowLead}><h2 id="workflows-title">Built for the parts that need care.</h2><p>Fast changes, clear access, and keyboard controls matter as much as the board itself.</p><Capture file="task-checklist-close.png" alt="Flowboard checklist with completed and remaining steps" /></div>
      <div className={styles.workflowList}>
        <article><h3>Keyboard access</h3><p>Move tasks with keyboard controls, follow visible focus, and reduce automatic motion.</p></article>
        <article><h3>Project permissions</h3><p>Owner, editor, and viewer policy is enforced by the API as well as reflected in the interface.</p></article>
        <article><h3>Recoverable updates</h3><p>Task changes appear immediately. A failed save restores the previous state and explains the error.</p></article>
      </div>
    </section>

    <section className={styles.closing} aria-labelledby="closing-title"><div><h2 id="closing-title">Try the workspace for yourself.</h2><p>Explore personal tasks and a shared project in the browser.</p><div className={styles.actions}><a className={styles.primaryAction} href="/demo">Explore the demo <ArrowRightIcon size={18} aria-hidden="true" /></a><AccountLink /></div></div></section>
  </main><PublicFooter /></PublicLayout>;
}

export default LandingPage;
