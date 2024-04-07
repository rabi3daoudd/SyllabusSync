import type { AppProps } from "next/app";
import Layout from "../app/layout.tsx";
import "../app/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;