import { Link, useLocation } from 'react-router-dom';
import { PublicFooter, PublicLayout } from '../components/public-layout/public-layout';
import styles from './not-found-page.module.css';

function NotFoundPage() {
  const { pathname } = useLocation();
  const demo = pathname === '/demo';
  return <PublicLayout><main id="main-content" className={styles.main}><span className={styles.code}>{demo ? 'COMING NEXT' : '404 / PAGE NOT FOUND'}</span><div className={styles.rule} /><h1>{demo ? 'The guest workspace is on its way.' : 'This page is off the board.'}</h1><p>{demo ? 'The interactive demo is being built in the next phase. You can create an account to try the live product now.' : 'The address may have changed, or the page may no longer be here. Head back to the public story or open your workspace.'}</p><div className={styles.actions}><Link to="/">Back to Flowboard</Link><Link to={demo ? '/sign-up' : '/tasks'}>{demo ? 'Create an account' : 'Open app'}</Link></div><div className={styles.material} aria-hidden="true" /></main><PublicFooter /></PublicLayout>;
}

export default NotFoundPage;
