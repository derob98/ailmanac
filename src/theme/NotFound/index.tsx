import React, {type ReactNode} from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';

// Branded 404 — turns a dead end into a helpful on-ramp.
export default function NotFound(): ReactNode {
  return (
    <Layout title="Page Not Found" description="This page wandered off.">
      <main
        className="container margin-vert--xl"
        style={{textAlign: 'center', maxWidth: '42rem'}}>
        <Heading as="h1" style={{fontSize: 'clamp(3rem, 12vw, 6rem)', marginBottom: '0.25rem'}}>
          404
        </Heading>
        <p style={{fontSize: '1.25rem', fontWeight: 600}}>
          This page wandered off — let's get you back on track.
        </p>
        <p style={{opacity: 0.85}}>
          The link may be old or mistyped. Try one of these, or search from the top bar.
        </p>
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginTop: '1.75rem',
          }}>
          <Link className="button button--primary button--lg" to="/docs/start-here/welcome">
            Start Here
          </Link>
          <Link className="button button--secondary button--lg" to="/">
            Home
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="/docs/start-here/learning-paths">
            Learning Paths
          </Link>
        </div>
      </main>
    </Layout>
  );
}
