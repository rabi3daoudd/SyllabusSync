import dynamic from 'next/dynamic';

const App = dynamic(() => import('../../App'), { ssr: false });

export async function getStaticPaths() {
  // return an object with paths and fallback
  return {
    paths: [
      { params: { slug: ['home'] } }, // Note: slug should be an array of strings
    ],
    fallback: false, // can also be true or 'blocking'
  };
}

export default function Page() {
  return <App />;
}
