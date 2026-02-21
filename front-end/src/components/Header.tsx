import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/services/api";

const Header = ({ user }: { user: User }) => {
  const router = useRouter();
  const { logout } = useAuth();

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Projects", path: "/projects" },
    { name: "Blog", path: "/blog" },
  ];

  const handleLogout = async () => {
    await logout();
    router.reload(); // Refresh the page after logout
  };

  return (
    <header className="relative z-10 text-xl text-gray-200 mt-5 flex gap-6 items-center">
      {navItems.map(({ name, path }) => (
        <a
          key={path}
          href={path}
          className={`px-4 py-2 rounded-md transition-colors duration-200 ${
            router.pathname === path ? "text-white" : "hover:text-gray-500"
          }`}
        >
          {name}
        </a>
      ))}

      {user && (
        <button
          onClick={handleLogout}
          className="ml-auto px-4 py-2 rounded-md hover:text-red-400 transition-colors duration-200"
        >
          Logout
        </button>
      )}
    </header>
  );
};

export default Header;
