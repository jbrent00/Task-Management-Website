import { useAuth } from '@clerk/react';
import { Link, useLocation } from 'react-router-dom';
import { PublicFooter, PublicLayout } from '../components/public-layout/public-layout';
import styles from './not-found-page.module.css';

function NotFoundPage() {
  const { pathname } = useLocation();
  const { isSignedIn } = useAuth();
  const demo = pathname === '/demo';
  return <PublicLayout><main id="main-content" className={styles.main}><span className={styles.code}>{demo ? 'DEMO PREVIEW / COMING NEXT' : '404 / PAGE NOT FOUND'}</span><div className={styles.rule} /><h1>{demo ? 'The guest workspace is on its way.' : 'This page is off the board.'}</h1><p>{demo ? `This is a preview of the upcoming interactive demo. To use Flowboard today, ${isSignedIn ? 'open your workspace.' : 'sign in or create an account.'}` : 'The address may have changed, or the page may no longer be here. Return to the landing page or sign in to your workspace.'}</p><div className={styles.actions}><Link to={isSignedIn ? '/tasks' : demo ? '/sign-up' : '/sign-in'}>{isSignedIn ? 'Open workspace' : demo ? 'Create an account' : 'Sign in to workspace'}</Link><Link to="/">Back to landing page</Link></div><div className={styles.material} aria-hidden="true" /></main><PublicFooter /></PublicLayout>;
}

export default NotFoundPage;
