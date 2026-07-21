import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import Translate, {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './styles.module.css';

// Branded, localized 404 — turns a dead end into a helpful on-ramp.
export default function NotFound(): ReactNode {
  // Docusaurus localizes "/docs/..." links per locale build automatically.
  const lp = '';
  return (
    <Layout
      title={translate({id: 'notfound.title', message: 'Page Not Found'})}
      description={translate({id: 'notfound.desc', message: 'This page wandered off.'})}>
      <main className={clsx('container', 'margin-vert--xl', styles.notFound)}>
        <Heading as="h1" className={styles.code}>
          404
        </Heading>
        <p className={styles.heading}>
          <Translate id="notfound.heading">
            This page wandered off — let's get you back on track.
          </Translate>
        </p>
        <p className={styles.sub}>
          <Translate id="notfound.sub">
            The link may be old or mistyped. Try one of these, or search from the top bar.
          </Translate>
        </p>
        <div className={styles.actions}>
          <Link className="button button--primary button--lg" to={`${lp}/docs/start-here/welcome`}>
            <Translate id="notfound.cta.start">Start Here</Translate>
          </Link>
          <Link className="button button--secondary button--lg" to={`${lp}/`}>
            <Translate id="notfound.cta.home">Home</Translate>
          </Link>
          <Link className="button button--secondary button--lg" to={`${lp}/docs/start-here/learning-paths`}>
            <Translate id="notfound.cta.paths">Learning Paths</Translate>
          </Link>
        </div>
      </main>
    </Layout>
  );
}
