import { useRouter } from "next/router"

const Header = () => {
  const router = useRouter();

  const navItems= [
    { name: "Home", path: "/"},
    { name: "Projects", path: "/projects"},
    { name: "Blog", path: "/blog"},
  ];

  return (
    <header className="relative z-10">
      {navItems.map(({ name, path}) =>
        router.pathname ===path ? (
          <span key={path} className="px-10 py-5 rounded-md">
            {name}
          </span>
        ) : (
          <a key={path} href={path} className="hover:text-gray-200 px-10 py-5 transition-colors duration-200">
            {name}
          </a>
        )
      )}
    </header>
  )
}

export default Header;