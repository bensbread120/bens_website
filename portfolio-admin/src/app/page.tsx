import Image from "next/image";
import { resume, type ResumeEntry } from "@/content/resume";

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center h-screen text-white text-center px-4 max-h-50%">
        <Image
          src="/images/ben.jpg"
          alt={resume.name}
          width={250}
          height={250}
          className="rounded-full border-6 border-black shadow-lg mb-6"
        />
        <h1 className="text-5xl font-bold mb-2">{resume.name}</h1>
        <p className="text-xl text-gray-200">{resume.tagline}</p>
        <p className="mt-8 animate-bounce text-3xl">↓</p>
      </section>

      {/* White Content Panel */}
      <section className="relative z-10 bg-white rounded-3xl shadow-xl px-10 p-10 w-full max-w-4xl mx-auto mt-10 mb-0 space-y-10" style={{ boxShadow: '0 40px 40px rgba(0,0,0,0.65)' }}>
        <div>
          <h2 className="text-2xl font-semibold mb-4">About Me</h2>
          <div className="space-y-4 text-gray-700">
            {resume.about.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>

        <EntrySection title="Experience" entries={resume.experience} />
        <EntrySection title="Education" entries={resume.education} />

        <div>
          <h2 className="text-2xl font-semibold mb-4">Skills</h2>
          <ul className="flex flex-wrap gap-2">
            {resume.skills.map((skill) => (
              <li key={skill} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-800">
                {skill}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">Links</h2>
          <ul className="space-y-2">
            {resume.links.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-blue-600 hover:underline"
                  {...(link.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function EntrySection({ title, entries }: { title: string; entries: ResumeEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">{title}</h2>
      <ul className="space-y-4">
        {entries.map((entry) => (
          <li key={`${entry.title}-${entry.organisation}`}>
            <div className="flex flex-wrap justify-between gap-2">
              <span className="font-medium text-gray-900">
                {entry.title}, {entry.organisation}
              </span>
              <span className="text-sm text-gray-500">{entry.period}</span>
            </div>
            {entry.summary && <p className="mt-1 text-gray-700">{entry.summary}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
