import { Link } from 'react-router-dom';
import { ArrowUpRightIcon } from '@phosphor-icons/react/dist/csr/ArrowUpRight';
import { PublicFooter, PublicLayout, repoUrl } from '../components/public-layout/public-layout';
import styles from './case-study-page.module.css';

const chapters = [
  { number: '01', title: 'The problem', body: 'Personal to-do lists are easy to start, but work often grows into shared decisions. Flowboard keeps the familiar task board and adds projects, assignment, discussion, and a visible history when a team needs them.' },
  { number: '02', title: 'Who it is for', body: 'The product is designed for individuals organizing daily work and small teams coordinating a project. As a portfolio project, it demonstrates a connected interface, API, data model, and permission system rather than a static concept.' },
  { number: '03', title: 'The visual system', body: 'A calm neutral canvas, rust accent, Geist typography, compact task cards, and semantic light and dark tokens give the product a consistent rhythm. The public pages use actual product captures alongside restrained planning materials.' },
  { number: '04', title: 'Architecture and data flow', body: 'React and Vite render the client. React Router separates public and protected routes, Clerk supplies authentication, and the client requests an Express API with a Clerk token. Controllers apply project policy before Prisma reads and writes PostgreSQL data. Task changes update the interface optimistically and roll back when a request fails.' },
  { number: '05', title: 'What works today', body: 'Personal tasks support status changes, priorities, due dates, tags, checklists, search, filters, and sorting. Shared projects add membership roles, assignment, comments, activity, invitations, and project settings. Task forms offer optional AI description and checklist generation.' },
  { number: '06', title: 'Testing and access', body: 'The project has frontend component tests, backend policy and integration tests, linting, type checking, and production builds. Dialog focus management, keyboard task movement, visible focus, semantic themes, and reduced-motion support are part of the interface.' },
  { number: '07', title: 'What I learned', body: 'A believable task product needs more than a polished board. The hard parts are keeping permissions consistent across the interface and API, making fast updates recoverable, and preserving dense information without losing keyboard or small-screen usability.' },
];

function CaseStudyPage() {
  return <PublicLayout><main id="main-content" className={styles.main}>
    <div className={styles.hero}><span className={styles.eyebrow}>Flowboard / Case study</span><h1>From personal plans<br />to shared progress.</h1><p>A task management product built around the moment individual work becomes team work.</p><a href={repoUrl} target="_blank" rel="noopener noreferrer">View the repository <ArrowUpRightIcon size={18} aria-hidden="true" /></a></div>
    <div className={styles.proof}><img src="/captures/project-board.jpg" alt="Actual Flowboard shared project board for the Northline site launch" /><span>Actual Flowboard interface / Northline example workspace</span></div>
    <div className={styles.chapters}>{chapters.map((chapter) => <section key={chapter.number} className={styles.chapter}><span>{chapter.number}</span><h2>{chapter.title}</h2><p>{chapter.body}</p></section>)}</div>
    <div className={styles.end}><h2>Put the thinking to work.</h2><p>Create an account to start your own workspace, or return to the landing page to see Flowboard in context.</p><Link to="/sign-up">Create an account</Link><Link to="/">Back to landing page</Link></div>
  </main><PublicFooter /></PublicLayout>;
}

export default CaseStudyPage;
