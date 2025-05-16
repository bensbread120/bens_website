import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";

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
    <main className="min-h-screen bg-gray-100 text-gray-800 px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-2">Your Name</h1>
          <p className="text-lg text-gray-600">Web Developer | Tech Enthusiast | Lifelong Learner</p>
        </header>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-2">About Me</h2>
          <p className="text-gray-700">
            I'm a web developer passionate about building clean and functional websites.
            This site is running on a Raspberry Pi using a Cloudflare tunnel as a proof of concept.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">Links</h2>
          <ul className="space-y-2">
            <li>
              <a href="https://github.com/yourusername" className="text-blue-600 hover:underline" target="_blank">
                GitHub
              </a>
            </li>
            <li>
              <a href="mailto:you@example.com" className="text-blue-600 hover:underline">
                Email
              </a>
            </li>
            <li>
              <a href="https://linkedin.com/in/yourname" className="text-blue-600 hover:underline" target="_blank">
                LinkedIn
              </a>
            </li>
          </ul>
        </section>

        <footer className="mt-16 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Your Name
        </footer>
      </div>
    </main>
  );
}

