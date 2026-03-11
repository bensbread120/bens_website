import { notFound } from "next/navigation";
import { getPostById } from "@/actions/blog";
import Image from "next/image";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function BlogPostPage({ params }: Props) {
  const { id } = await params;

  const post = await getPostById(id);

  if (!post) {
    notFound();
  }

  return (
    <article className="max-w-3xl mx-auto mt-10 px-6 py-16 bg-white rounded-xl">
      <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

      <p className="text-gray-400 mb-8">
        {new Intl.DateTimeFormat("en-AU", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date(post.createdAt))}
      </p>

      {post.imageUrl && (
        <div className="relative w-full h-[400px] mb-10 rounded-xl overflow-hidden">
          <Image
            src={post.imageUrl}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      <div className="prose prose-invert max-w-none">
        {post.content}
      </div>
    </article>
  );
}