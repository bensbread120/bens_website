import Link from "next/link";
import { getPosts } from "@/actions/blog";
import { BlogPost } from "@prisma/client";
import BlogPostCard from "@/components/BlogPostCard";
import DeleteToast from "@/src/components/DeleteToast";

type Props = {
  searchParams: Promise<{
    deleted?: string;
  }>;
};

export default async function BlogPage({ searchParams }: Props) {
  const posts: BlogPost[] = await getPosts();

  const { deleted } = await searchParams;
  const deletedPost = deleted === "1";

  return (
    <>
      {deletedPost && <DeleteToast />}

      <div className="max-w-7xl mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold text-center mb-12">Blog</h1>

        <div className="grid gap-8">
          {posts.map((post) => (
            <Link href={`/blog/${post.id}`} key={post.id}>
              <BlogPostCard
                title={post.title}
                excerpt={post.excerpt ?? ""}
                image={post.imageUrl ?? ""}
                createdAt={new Intl.DateTimeFormat("en-AU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }).format(new Date(post.createdAt))}
              />
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
