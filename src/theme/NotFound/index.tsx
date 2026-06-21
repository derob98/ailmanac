import React, {type ReactNode} from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import Translate, {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

// Branded, localized 404 — turns a dead end into a helpful on-ramp.
export default function NotFound(): ReactNode {
  // Docusaurus localizes "/docs/..." links per locale build automatically.
  const lp = '';
  return (
    <Layout
      title={translate({id: 'notfound.title', message: 'Page Not Found'})}
      description={translate({id: 'notfound.desc', message: 'This page wandered off.'})}>
      <main
        className="container margin-vert--xl"
        style={{textAlign: 'center', maxWidth: '42rem'}}>
        <Heading as="h1" style={{fontSize: 'clamp(3rem, 12vw, 6rem)', marginBottom: '0.25rem'}}>
          404
        </Heading>
        <p style={{fontSize: '1.25rem', fontWeight: 600}}>
          <Translate id="notfound.heading">
            This page wandered off — let's get you back on track.
          </Translate>
        </p>
        <p style={{opacity: 0.85}}>
          <Translate id="notfound.sub">
            The link may be old or mistyped. Try one of these, or search from the top bar.
          </Translate>
        </p>
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginTop: '1.75rem',
          }}>
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
