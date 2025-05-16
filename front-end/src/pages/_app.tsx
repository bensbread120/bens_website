import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "@/styles/globals.css";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <main className="text-gray-800">  {/* No bg-* class here! */}
      <Header />
      <Component {...pageProps} />
      <Footer />
    </main>

  );
}
