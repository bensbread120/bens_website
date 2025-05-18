import Image from "next/image";

interface ProjectCardProps {
  name: string;
  description: string;
  image: string;
  link: string;
}

const ProjectCard = ({ name, description, image, link }: ProjectCardProps) => {
  return (
    <div className="bg-white/90 rounded-2xl shadow-xl overflow-hidden transform transition hover:scale-[1.02] hover:shadow-2xl">
      <Image
        src={image}
        alt={name}
        width={400}
        height={200}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-2">{name}</h3>
        <p className="text-gray-700 text-sm mb-4">{description}</p>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm"
          >
            View Project →
          </a>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
