import { useState, useEffect } from "react";
import Background from "@/components/Background";
import BlogPostCard from "@/components/BlogPostCard";
import { blogPostApi, BlogPost } from "../services/api";
import { useAuth } from "@/context/AuthContext";
import { requireAuth } from "@/lib/requireAuth";
import { GetServerSideProps } from "next";

type BlogPageProps = {
  user: {
    id: number;
    name: string;
    email: string;
  } | null;
};

export const getServerSideProps: GetServerSideProps<BlogPageProps> = async (ctx) => {
  return requireAuth(ctx);
};


export default function Blog ({ user }: { user: any }) {
  // const { user: contextUser, logout } = useAuth();
  // const effectiveUser = contextUser || user;
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingBlogPostId, setEditingBlogPostId] = useState<number | null>(null);
  const [editBlogPost, setEditBlogPost] = useState<Partial<BlogPost>>({});

  const [newBlogPost, setNewBlogPost] = useState({
    title: "",
    content: "",
    excerpt: "",
  });
  const [newImageFile, setNewImageFile] = useState<File | null>(null);

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  const fetchBlogPosts = async () => {
    try {
      const data = await blogPostApi.getAllBlogPosts();
      setBlogPosts(data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch blog posts");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBlogPost = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    // Pass the File object directly as `image` property
    await blogPostApi.createBlogPost({ ...newBlogPost, image: newImageFile || undefined });

    setNewBlogPost({ title: "", content: "", excerpt: "" });
    setNewImageFile(null);
    fetchBlogPosts();
  } catch {
    setError("Failed to create blog post.");
  }
};

  const handleDeleteBlogPost = async (id: number) => {
    try {
      await blogPostApi.deleteBlogPost(id);
      fetchBlogPosts();
    } catch {
      setError("Failed to delete blog post");
    }
  };

  const handleUpdateBlogPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBlogPostId) return;

    try {
      await blogPostApi.updateBlogPost(editingBlogPostId, editBlogPost);
      setEditingBlogPostId(null);
      setEditBlogPost({});
      fetchBlogPosts();
    } catch {
      setError("Failed to update blog post");
    }
  };

  const startEditing = (blogPost: BlogPost) => {
    setEditingBlogPostId(blogPost.id);
    setEditBlogPost({
      title: blogPost.title,
      content: blogPost.content,
      excerpt: blogPost.excerpt,
      image: blogPost.image,
    });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <Background>
      <div className="max-w-7xl mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold text-white text-center mb-12">Blog</h1>

        {/* Create BlogPost Form */}
        { user && (
          <form
            onSubmit={handleCreateBlogPost}
            className="mb-8 p-6 border rounded bg-white"
          >
            <h2 className="text-xl font-semibold mb-4">Create New BlogPost</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Title"
                value={newBlogPost.title}
                onChange={(e) =>
                  setNewBlogPost({ ...newBlogPost, title: e.target.value })
                }
                className="p-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="Content"
                value={newBlogPost.content}
                onChange={(e) =>
                  setNewBlogPost({ ...newBlogPost, content: e.target.value })
                }
                className="p-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="Excerpt"
                value={newBlogPost.excerpt}
                onChange={(e) =>
                  setNewBlogPost({ ...newBlogPost, excerpt: e.target.value })
                }
                className="p-2 border rounded"
                required
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNewImageFile(e.target.files?.[0] || null)}
                className="p-2 border rounded"
              />
            </div>
            <button
              type="submit"
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create BlogPost
            </button>
          </form>
        )}

        {/* BlogPosts List */}
        <div className="grid gap-8">
          {blogPosts.map((post) =>
            editingBlogPostId === post.id ? (
              <form
                key={post.id}
                onSubmit={handleUpdateBlogPost}
                className="p-6 border rounded bg-white"
              >
                <h2 className="text-xl font-semibold mb-4">Edit BlogPost</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Title"
                    value={editBlogPost.title || ""}
                    onChange={(e) =>
                      setEditBlogPost({ ...editBlogPost, title: e.target.value })
                    }
                    className="p-2 border rounded"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Content"
                    value={editBlogPost.content || ""}
                    onChange={(e) =>
                      setEditBlogPost({ ...editBlogPost, content: e.target.value })
                    }
                    className="p-2 border rounded"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Excerpt"
                    value={editBlogPost.excerpt || ""}
                    onChange={(e) =>
                      setEditBlogPost({ ...editBlogPost, excerpt: e.target.value })
                    }
                    className="p-2 border rounded"
                    required
                  />
                  {/* If you want to update image with file upload, you can implement here */}
                </div>
                <div className="mt-4 flex gap-4">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBlogPostId(null);
                      setEditBlogPost({});
                    }}
                    className="px-6 py-2 bg-gray-400 text-black rounded hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div key={post.id} className="relative">
                <BlogPostCard
                  title={post.title}
                  excerpt={post.excerpt}
                  image={
                    // image could be base64 or URL string
                    typeof post.image === "string"
                      ? post.image.startsWith("data:") // already base64/URL
                        ? post.image
                        : `data:image/jpeg;base64,${post.image}`
                      : ""
                  }
                  createdAt={post.createdAt}
                />
                {user && (
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={() => startEditing(post)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteBlogPost(post.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </Background>
  );
}
