import TvDisplay from '@/components/TvDisplay.jsx';

export const dynamic = 'force-dynamic';

// Public, un-authenticated TV display. Open this URL on the screen; it polls
// for its assigned page and updates itself automatically.
export default async function TvPage({ params }) {
  const { slug } = await params;
  return <TvDisplay slug={slug} />;
}
