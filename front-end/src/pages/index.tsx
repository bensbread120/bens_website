import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import Background from "@/components/Background";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export default function Home() {
  return (
    <Background>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center h-screen text-white text-center px-4 max-h-50%">
        <Image
          src="/images/ben.jpg"
          alt="Ben Hatfield"
          width={250}
          height={250}
          className="rounded-full border-6 border-black shadow-lg mb-6"
        />
        <h1 className="text-5xl font-bold mb-2">Ben Hatfield</h1>
        <p className="text-xl text-gray-200">
          Web Developer | Tech Enthusiast | Lifelong Learner
        </p>
        <p className="mt-8 animate-bounce text-3xl">↓</p>

      </section>

      {/* White Content Panel */}
      <section className="relative z-10 bg-white rounded-3xl shadow-xl px-10 p-10 w-full max-w-4xl mx-auto mt-10 mb-0" style={{ boxShadow: '0 40px 40px rgba(0,0,0,0.65)' }}>
        <h2 className="text-2xl font-semibold mb-4">About Me</h2>
        <p className="text-gray-700 mb-6">
          I'm a web developer passionate about building clean and functional websites.
          This site is running on a Raspberry Pi using a Cloudflare tunnel as a proof of concept.
        </p>

        <h2 className="text-2xl font-semibold mb-2">Links</h2>
        <ul className="space-y-2">
          <li>
            <a href="https://github.com/bensbread120" className="text-blue-600 hover:underline" target="_blank">
              GitHub
            </a>
          </li>
          {/* <li>
            <a href="mailto:you@example.com" className="text-blue-600 hover:underline">
              Email
            </a>
          </li> */}
          <li>
            <a href="https://www.linkedin.com/in/benjamin-hatfield-076b011aa/" className="text-blue-600 hover:underline" target="_blank">
              LinkedIn
            </a>
          </li>
        </ul>       
      </section>
    </Background>
  );
}
