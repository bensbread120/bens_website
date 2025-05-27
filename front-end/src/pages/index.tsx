import Image from "next/image";
import Background from "@/components/Background";




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
          Hi, I&apos;m Ben Hatfield, a passionate and curious computer science student with a strong drive to build, experiment, and understand systems from the ground up. Whether I&apos;m reverse-engineering how domain names work, deploying a full-stack application on a Raspberry Pi through a secure Cloudflare tunnel, or fine-tuning a Next.js frontend with Chakra UI and Tailwind, I thrive on learning deeply and solving real-world challenges with clean, practical solutions.
        <br></br><br></br>
        I&apos;m currently developing this personal website as both a portfolio and a technical playground. The stack is self-hosted: a React (Next.js) frontend served through Cloudflare, with a Node.js/Express backend and a MySQL database — all running on my Raspberry Pi. I&apos;ve built it with security and maintainability in mind, separating public-facing services from private ones and exploring how far I can push resource-constrained environments without compromising usability.
        <br></br><br></br>
        In addition to web development, I&apos;m also deeply interested in backend architecture, Linux systems, and self-hosting infrastructure. I enjoy working close to the metal — learning how things like tunnels, proxies, and sessions work behind the scenes — and I&apos;m not afraid to dig into cryptic stack traces or low-level server configuration errors to get things running.
        <br></br><br></br>
        Outside of code, I value simplicity, clarity, and the feeling of solving tough problems. I&apos;m always building something — whether it&apos;s an API from scratch, a new UI layout, or a more efficient way to manage my own dev stack.
        <br></br><br></br>
        This site is a living demo of my skills, my curiosity, and the kind of developer I am. Thanks for visiting — and feel free to reach out if you want to chat about projects, systems, or how to run a web server from your bedroom.
        </p>

        <h2 className="text-2xl font-semibold mb-2">Links</h2>
        <ul className="space-y-2">
          <li>
            <a href="https://github.com/bensbread120" className="text-blue-600 hover:underline" target="_blank">
              GitHub
            </a>
          </li>
          <li>
            <a href="bhatfield120@gmail.com" className="text-blue-600 hover:underline">
              Email
            </a>
          </li>
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
