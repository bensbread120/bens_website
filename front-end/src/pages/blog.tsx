import Background from "@/components/Background";
import BlogPostCard from "@/components/BlogPostCard";

export default function Blog() {
  const posts = [
    {
      title: "Why I Built My Portfolio on a Raspberry Pi",
      excerpt: "A deep dive into self-hosting using Cloudflare tunnels, static Next.js builds, and Raspberry Pi deployment.",
      image: "/images/ben.jpg",
      date: "May 10, 2025",
      link: "https://github.com/bensbread120/portfolio-blog",
    },
    {
      title: "Improving Productivity with Custom CLI Tools",
      excerpt: "Learn how to create and use simple CLI tools with Node.js and how they changed the way I work.",
      image: "/images/landscape.jpg",
      date: "April 28, 2025",
      link: "#",
    },
    // Add more blog posts here
  ];

  return (
    <Background>
      <div className="max-w-7xl mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold text-white text-center mb-12">Blog</h1>
        <div className="space-y-10">
          {posts.map((post, index) => (
            <BlogPostCard key={index} {...post} />
          ))}
        </div>
      </div>
    </Background>
  );
}
