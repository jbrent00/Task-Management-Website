import { Link } from 'react-router-dom';
import Brand from '../brand/brand';
import ThemePicker from '../theme-picker/theme-picker';
import styles from './auth-layout.module.css';

export default function AuthLayout({ kind, children }) {
  const signingIn = kind === 'sign-in';
  return <div className={styles.page}>
    <a className={styles.skip} href="#auth-content">Skip to form</a>
    <div className={styles.formSide}><header><Brand to="/" /><ThemePicker /></header><main id="auth-content" className={styles.formArea}><span className={styles.eyebrow}>{signingIn ? 'Welcome back' : 'Start planning'}</span><h1>{signingIn ? 'Pick up where you left off.' : 'Make room for clearer work.'}</h1><p>{signingIn ? 'Sign in to your personal tasks and shared projects.' : 'Create an account to plan your work and bring in a team when you need one.'}</p><div className={styles.clerk}>{children}</div></main><footer><Link to="/">Back to Flowboard</Link><span>Designed and built by Justin Brent.</span></footer></div>
    <aside className={styles.imageSide} aria-label="Planning materials"><img src="/images/planning-still-life.png" alt="Blank paper and a metal clip ready for planning" /><div><span>FLOWBOARD</span><p>Start with your own work.<br />Bring in a team when it grows.</p></div></aside>
  </div>;
}
