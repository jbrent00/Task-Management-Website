import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRightIcon } from '@phosphor-icons/react/dist/csr/ArrowUpRight';
import { PublicFooter, PublicLayout, repoUrl } from '../components/public-layout/public-layout';
import styles from './case-study-page.module.css';

const source = (path) => `${repoUrl}/blob/main/${path}`;

function CaseStudyPage() {
  useEffect(() => {
    const description = document.querySelector('meta[name="description"]');
    const previousTitle = document.title;
    const previousDescription = description?.content;
    document.title = 'Flowboard Case Study | Design and Engineering';
    if (description) description.content = 'How Flowboard connects personal task planning with shared projects, permission-aware collaboration, and recoverable updates.';
    return () => {
      document.title = previousTitle;
      if (description && previousDescription !== undefined) description.content = previousDescription;
    };
  }, []);

  return <PublicLayout><main id="main-content" className={styles.main}>
    <header className={styles.hero}>
      <div><span className={styles.eyebrow}>Flowboard case study</span><h1>A personal task board, built to share.</h1></div>
      <div className={styles.heroAside}><p>A full-stack project about keeping personal planning simple while making shared work accountable.</p><a href={repoUrl} target="_blank" rel="noopener noreferrer">View the repository <ArrowUpRightIcon size={18} aria-hidden="true" /></a></div>
    </header>

    <section className={styles.problem} aria-labelledby="problem-title">
      <div><h2 id="problem-title">When solo work becomes shared.</h2><p>Personal tasks need little setup. Shared projects need ownership, discussion, and a reliable record of change. Flowboard lets a person start with a task board and add that structure when a project grows.</p></div>
      <figure><img src="/captures/my-tasks.jpg" alt="Actual personal task board with date views and filters" loading="lazy" /><figcaption>Personal work remains a complete workspace of its own.</figcaption></figure>
    </section>

    <section className={styles.interface} aria-labelledby="interface-title">
      <div className={styles.interfaceIntro}><h2 id="interface-title">A familiar board, with the detail close by.</h2><p>The board supports quick scanning. The task editor holds the information that needs more attention, from due dates and assignees to checklists and discussion.</p></div>
      <div className={styles.interfaceProof}><figure><img src="/captures/project-board-cards.png" alt="Real shared project task cards in three status columns" loading="lazy" /><figcaption>Shared project board</figcaption></figure><figure><img src="/captures/task-details-metadata.png" alt="Real task editor with due date, assignees, and tags" loading="lazy" /><figcaption>Task details</figcaption></figure></div>
    </section>

    <section className={styles.architecture} aria-labelledby="architecture-title">
      <div className={styles.architectureCopy}><h2 id="architecture-title">The interface follows the same rules as the API.</h2><p>Clerk authenticates the client. The Express API checks project policy before Prisma reads or writes PostgreSQL data. The UI reflects the same owner, editor, and viewer permissions, including the project’s collaboration settings.</p><a href={source('backend/src/services/projectPolicy.ts')} target="_blank" rel="noopener noreferrer">Read the project policy <ArrowUpRightIcon size={16} aria-hidden="true" /></a></div>
      <div className={styles.architectureFlow} aria-label="Request flow from the React client through authentication and the API to project policy and the database"><div><strong>React client</strong><span>Shows permitted actions</span></div><div><strong>Clerk and Express</strong><span>Authenticates each request</span></div><div><strong>Project policy</strong><span>Checks roles and settings</span></div><div><strong>Prisma and PostgreSQL</strong><span>Stores the result</span></div></div>
    </section>

    <section className={styles.reliability} aria-labelledby="reliability-title">
      <div className={styles.reliabilityCopy}><h2 id="reliability-title">Fast feedback needs a recovery path.</h2><p>Moving a task updates the board immediately. If the request fails, the previous order returns and the interface explains what happened. Keyboard movement and visible focus make that interaction usable beyond drag and drop.</p><div className={styles.sourceLinks}><a href={source('frontend/src/pages/tasks-page.jsx')} target="_blank" rel="noopener noreferrer">Task move and rollback <ArrowUpRightIcon size={16} aria-hidden="true" /></a><a href={source('backend/src/services/projectPolicy.test.ts')} target="_blank" rel="noopener noreferrer">Permission tests <ArrowUpRightIcon size={16} aria-hidden="true" /></a></div></div>
      <figure><img src="/captures/task-discussion-close.png" alt="Actual task discussion with comments from three project members" loading="lazy" /><figcaption>Discussion stays attached to the task it describes.</figcaption></figure>
    </section>

    <section className={styles.lessons} aria-labelledby="lessons-title"><h2 id="lessons-title">What this project taught me.</h2><p>The hard part was keeping one product understandable as its scope grew. Permission rules had to agree across the UI and API. Immediate updates needed a visible way back when saving failed. Dense task information had to remain workable on a small screen and with a keyboard.</p><p>Those constraints shaped the interface more than decoration did.</p></section>

    <section className={styles.end} aria-labelledby="end-title"><h2 id="end-title">See how it works.</h2><p>Explore personal tasks and a shared project in the guest workspace.</p><div><a className={styles.primaryAction} href="/demo">Explore the demo</a><Link to="/sign-up">Create an account</Link><Link to="/">Back to the landing page</Link></div></section>
  </main><PublicFooter /></PublicLayout>;
}

export default CaseStudyPage;
