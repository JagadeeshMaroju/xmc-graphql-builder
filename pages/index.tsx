import Head from "next/head";
import { MainApp } from "@/components/MainApp";

export default function Home() {
  return (
    <>
      <Head>
        <title>Sitecore GraphQL Query Builder</title>
        <meta
          name="description"
          content="Build and test GraphQL queries for Sitecore"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <MainApp />
    </>
  );
}
