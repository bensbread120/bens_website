import Background from "@/components/Background";
import ProjectCard from "@/components/ProjectCard";

export default function Projects() {
  const projects = [
    {
      title: "Personal Portfolio",
      description: "A sleek portfolio site hosted on a Raspberry Pi via Cloudflare tunnel.",
      image: "/images/ben.jpg",
      link: "https://github.com/bensbread120/portfolio",
    },
    {
      title: "Weather App",
      description: "A responsive weather app using OpenWeatherMap API and geolocation.",
      image: "/images/ben.jpg",
      link: "https://github.com/bensbread120/weather-app",
    },
    {
      title: "Task Tracker",
      description: "A full-stack CRUD app built with Next.js and MongoDB.",
      image: "/images/ben.jpg",
      link: "https://github.com/bensbread120/task-tracker",
    },
    {
      title: "Task Tracker",
      description: "A full-stack CRUD app built with Next.js and MongoDB. A full-stack CRUD app built with Next.js and MongoDB.A full-stack CRUD app built with Next.js and MongoDB.A full-stack CRUD app built with Next.js and MongoDB.A full-stack CRUD app built with Next.js and MongoDB.A full-stack CRUD app built with Next.js and MongoDB. ",
      image: "/images/landscape.jpg",
      link: "https://github.com/bensbread120/task-tracker",
    },
    {
      title: "Task Tracker",
      description: "A full-stack CRUD app built with Next.js and MongoDB.",
      image: "/images/ben.jpg",
      link: "https://github.com/bensbread120/task-tracker",
    },
    // Add more projects as needed
  ];

  return (
    <Background>
      <div className="max-w-6xl mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold text-white text-center mb-12">Projects</h1>
        <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
          {projects.map((project, index) => (
            <ProjectCard key={index} {...project} />
          ))}
        </div>
      </div>
    </Background>
  );
}
