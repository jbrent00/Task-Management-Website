import { useAuth } from '@clerk/react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { ArrowsClockwiseIcon } from '@phosphor-icons/react/dist/csr/ArrowsClockwise';
import { CheckCircleIcon } from '@phosphor-icons/react/dist/csr/CheckCircle';
import { KeyboardIcon } from '@phosphor-icons/react/dist/csr/Keyboard';
import { LockKeyIcon } from '@phosphor-icons/react/dist/csr/LockKey';
import { PublicFooter, PublicLayout } from '../components/public-layout/public-layout';
import styles from './landing-page.module.css';

const asset = (name) => `/captures/${name.includes('.') ? name : `${name}.jpg`}`;

function ActionLinks({ centered = false }) {
  const { isSignedIn } = useAuth();
  return <div className={`${styles.actions} ${centered ? styles.actionsCentered : ''}`}>
    <Link className={styles.primaryAction} to="/demo">Explore the demo <ArrowRightIcon size={17} aria-hidden="true" /></Link>
    <Link className={styles.secondaryAction} to={isSignedIn ? '/tasks' : '/sign-up'}>{isSignedIn ? 'Open app' : 'Create an account'}</Link>
  </div>;
}

function Capture({ file, mobileFile, alt, className = '', eager = false }) {
  return <div className={`${styles.capture} ${className}`}><picture>{mobileFile && <source media="(max-width: 767px)" srcSet={asset(mobileFile)} />}<img src={asset(file)} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" /></picture></div>;
}

function LandingPage() {
  return <PublicLayout><main id="main-content">
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.heroCopy}><h1 id="hero-title">Plan clearly.<br />Move together.</h1><p>Organize your own work, then bring people in when a project needs shared momentum.</p><ActionLinks /></div>
      <div className={styles.heroVisual}><img className={styles.heroStill} src="/images/planning-still-life.png" alt="Blank paper and a metal planning clip in warm light" loading="eager" /><Capture file="project-board" alt="Flowboard project board for the Northline site launch with assigned tasks in three status columns" className={styles.heroCapture} eager /></div>
    </section>

    <section id="product" className={styles.personal} aria-labelledby="personal-title">
      <div className={styles.personalVisual}><Capture file="my-tasks" alt="Personal Flowboard task workspace with date views, filters, and three status columns" /><Capture file="personal-details-close.png" mobileFile="personal-details-mobile.png" alt="Close view of the Draft site launch copy task in Flowboard" className={styles.personalInset} /></div>
      <div className={styles.personalCopy}><span className={styles.kicker}>Personal planning</span><h2 id="personal-title">Your day,<br />without the noise.</h2><p>See what is due, narrow the board with search and filters, and keep checklist steps close to the task. Move work through the board when plans change.</p><Link className={styles.textLink} to="/sign-up">Explore personal planning <ArrowRightIcon size={18} aria-hidden="true" /></Link></div>
    </section>

    <section className={styles.shared} aria-labelledby="shared-title">
      <div className={styles.sharedCopy}><h2 id="shared-title">Bring the right<br />people into the work.</h2><p>Assign ownership, discuss the details, and keep project changes visible. Owner, editor, and viewer roles make participation clear.</p><Link className={styles.outlineAction} to="/sign-up">See collaborative projects <ArrowRightIcon size={18} aria-hidden="true" /></Link></div>
      <div className={styles.sharedVisual}><Capture file="project-board" alt="Northline shared project board with three members and assigned tasks" /><Capture file="task-discussion-close.png" mobileFile="task-discussion-mobile.png" alt="Close view of a real discussion among three Northline project members" className={styles.sharedInset} /></div>
    </section>

    <section className={styles.depth} aria-labelledby="depth-title">
      <div className={styles.sectionIntro}><span className={styles.kicker}>Product details</span><h2 id="depth-title">The details stay connected.</h2><p>Five practical tools keep every task understandable from first draft to final update.</p></div>
      <div className={styles.depthGrid}>
        <article className={`${styles.depthCell} ${styles.depthLarge}`}><div><h3>Task details</h3><p>Status, priority, assignees, dates, and checklists in one focused place.</p></div><Capture file="task-details-close.png" mobileFile="task-details-mobile.png" alt="Close view of real task details for Build responsive layouts" /></article>
        <article className={`${styles.depthCell} ${styles.depthLarge}`}><div><h3>Comments and notifications</h3><p>Discuss work where it happens and follow the updates that involve you.</p></div><Capture file="task-discussion-wide.png" mobileFile="task-discussion-mobile-short.png" alt="Close view of real comments from Northline project members" /></article>
        <article className={styles.depthCell}><h3>Tags</h3><p>Group related work with reusable personal and shared labels.</p><div className={styles.tagSamples}><span>Content</span><span>Design</span><span>Launch</span></div></article>
        <article className={styles.depthCell}><h3>Due-date views</h3><p>Move between Today, Next 7 days, Overdue, and Unscheduled.</p><Capture file="due-date-views-close.png" mobileFile="due-date-views-mobile.png" alt="Real Flowboard date views for personal tasks" className={styles.smallCapture} /></article>
        <article className={`${styles.depthCell} ${styles.aiCell}`}><h3>AI drafting and checklists</h3><p>Turn a rough idea into an editable description or checklist.</p><Capture file="ai-controls-close.png" alt="Real mobile task form showing a Generate description control and an editable draft" className={`${styles.smallCapture} ${styles.aiCapture}`} /></article>
      </div>
    </section>

    <section className={styles.workflows} aria-labelledby="workflows-title">
      <div className={styles.workflowCopy}><h2 id="workflows-title">Built for real<br />workflows.</h2><p>Clear permissions, accessible controls, and recoverable updates keep the interface dependable when work changes.</p><img src="/images/planning-still-life.png" alt="" loading="lazy" /></div>
      <div className={styles.workflowRows}>
        <article><KeyboardIcon size={27} aria-hidden="true" /><div><h3>Accessible by default</h3><p>Visible focus, labeled controls, keyboard reordering, and reduced-motion support.</p></div></article>
        <article><LockKeyIcon size={27} aria-hidden="true" /><div><h3>Permission-aware collaboration</h3><p>Owners manage the project. Editors work on tasks within project policy. Viewers can follow along.</p></div></article>
        <article><ArrowsClockwiseIcon size={27} aria-hidden="true" /><div><h3>Changes you can trust</h3><p>Optimistic task updates restore the previous state and show an error when a save fails.</p></div></article>
      </div>
    </section>

    <section className={styles.closing} aria-labelledby="closing-title"><div className={styles.closingContent}><CheckCircleIcon size={31} weight="light" aria-hidden="true" /><h2 id="closing-title">Start with work that feels clear.</h2><p>Explore Flowboard’s planning approach, or create an account when you are ready to make it yours.</p><ActionLinks centered /></div><div className={styles.closingMaterial} aria-hidden="true" /></section>
  </main><PublicFooter /></PublicLayout>;
}

export default LandingPage;
