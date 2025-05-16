import Image from "next/image";

interface BlogPostCardProps {
  title: string;
  excerpt: string;
  image: string;
  date: string;
  link?: string;
}

const BlogPostCard = ({ title, excerpt, image, date, link }: BlogPostCardProps) => {
  return (
    <div className="bg-white/90 rounded-2xl shadow-xl overflow-hidden flex flex-col sm:flex-row transition hover:scale-[1.01] hover:shadow-2xl">
      {/* <Image
        src={image}
        alt={title}
        width={300}
        height={200}
        className="w-full sm:w-1/3 object-cover"
      /> */}
      <div className="p-6 flex-1">
        <h3 className="text-2xl font-semibold mb-1">{title}</h3>
        <p className="text-gray-500 text-sm mb-2">{date}</p>
        <p className="text-gray-700 mb-4">{excerpt}</p>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm"
          >
            Read More →
          </a>
        )}
      </div>
    </div>
  );
};

export default BlogPostCard;
