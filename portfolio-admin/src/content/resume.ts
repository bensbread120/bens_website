// Public resume content. Sections with no entries are hidden.

export type ResumeEntry = {
  title: string
  organisation: string
  period: string
  summary?: string
}

export const resume = {
  name: "Ben Hatfield",
  tagline: "Web Developer | Tech Enthusiast | Lifelong Learner | Endurance Athlete",
  about: [
    "Hi, I'm Ben Hatfield, a passionate and curious computer science student with a strong drive to build, experiment, and understand systems from the ground up. Whether I'm reverse-engineering how domain names work, deploying a full-stack application on a Raspberry Pi through a secure Cloudflare tunnel, or fine-tuning a Next.js frontend with Chakra UI and Tailwind, I thrive on learning deeply and solving real-world challenges with clean, practical solutions.",
    "I'm currently developing this personal website as both a portfolio and a technical playground. The stack is self-hosted: a React (Next.js) frontend served through Cloudflare, with a Node.js/Express backend and a MySQL database — all running on my Raspberry Pi. I've built it with security and maintainability in mind, separating public-facing services from private ones and exploring how far I can push resource-constrained environments without compromising usability.",
    "In addition to web development, I'm also deeply interested in backend architecture, Linux systems, and self-hosting infrastructure. I enjoy working close to the metal — learning how things like tunnels, proxies, and sessions work behind the scenes — and I'm not afraid to dig into cryptic stack traces or low-level server configuration errors to get things running.",
    "Outside of code, I value simplicity, clarity, and the feeling of solving tough problems. I'm always building something — whether it's an API from scratch, a new UI layout, or a more efficient way to manage my own dev stack.",
    "This site is a living demo of my skills, my curiosity, and the kind of developer I am. Thanks for visiting — and feel free to reach out if you want to chat about projects, systems, or how to run a web server from your bedroom.",
  ],
  skills: ["TypeScript", "React", "Next.js", "Node.js", "PostgreSQL", "Prisma", "Tailwind CSS", "Linux", "Self-hosting"],
  experience: [] as ResumeEntry[],
  education: [] as ResumeEntry[],
  links: [
    { label: "GitHub", href: "https://github.com/bensbread120" },
    { label: "Email", href: "mailto:bhatfield120@gmail.com" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/benjamin-hatfield-076b011aa/" },
  ],
}
