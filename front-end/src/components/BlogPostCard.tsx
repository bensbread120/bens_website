import Image from "next/image";

interface BlogPostCardProps {
  title: string;
  excerpt: string;
  image: string;
  createdAt: string;
}

const BlogPostCard = ({
  title,
  excerpt,
  image,
  createdAt,
}: BlogPostCardProps) => {
  return (
    <div className="bg-white/90 rounded-2xl shadow-xl overflow-hidden flex flex-col sm:flex-row transition hover:scale-[1.01] hover:shadow-2xl relative">
      {image && (
        <div className="sm:w-1/3 w-full h-48 sm:h-auto relative">
          <Image
            src={image}
            alt={title}
            fill
            style={{ objectFit: "cover" }}
            sizes="(max-width: 640px) 100vw, 33vw"
            priority
          />
        </div>
      )}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-2xl font-semibold mb-1">{title}</h3>
          <p className="text-gray-500 text-sm mb-2">{createdAt}</p>
          <p className="text-gray-700 mb-4">{excerpt}</p>
        </div>
      </div>
    </div>
  );
};

export default BlogPostCard;
