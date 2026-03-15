import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export default async function Header() {
  const session = await getServerSession(authOptions);

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: "Exercise", path: "/activities" }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 backdrop-blur-md bg-black/30">
      <div className="max-w-7xl mx-auto grid grid-cols-3 items-center px-6 py-4 text-gray-200">

        {/* Left: Logo */}
        <div className="flex items-center">
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-80 transition"
          >
            <Image
              src="/favicon.ico"
              alt="Site Logo"
              width={36}
              height={36}
              priority
              className="transition-transform duration-300 hover:rotate-6"
            />
            <span className="text-xl font-semibold tracking-tight">
              BenHatfield.com
            </span>
          </Link>
        </div>

        {/* Center: Navigation */}
        <nav className="flex justify-center gap-8 text-lg">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className="relative hover:text-white transition-colors"
            >
              {item.name}
            </Link>
          ))}

          {session && (
            <Link
              href="/admin"
              className="relative hover:text-white transition-colors"
            >
              Admin
            </Link>
          )}
        </nav>

        {/* Right: User */}
        <div className="flex justify-end items-center gap-4 text-sm">
          {session ? (
            <>
              <span className="text-gray-400 hidden sm:block">
                {session.user?.email}
              </span>
              <LogoutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="relative hover:text-white transition-colors"
            >
              Login
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}