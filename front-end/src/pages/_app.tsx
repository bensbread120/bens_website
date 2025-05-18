import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from "@/context/AuthContext";

// _app.tsx
export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider initialUser={pageProps.user ?? null}>
      <Header user={pageProps.user ?? null}/>
      <Component {...pageProps} />
      <Footer />
    </AuthProvider>
  );
}

