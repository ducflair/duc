import { ThemeToggle } from "@/components/theme-toggle";
import { FORUM_URL, GITHUB_URL } from "@/constants/links";
import { BLOG, DOCS, HOME } from "@/constants/routes";
import Link from "next/link";

const links = [{
  title: 'Home',
  href: HOME
}, {
  title: 'Docs',
  href: DOCS
}, {
  title: 'Blog',
  href: BLOG
}, {
  title: 'GitHub',
  href: GITHUB_URL
}, {
  title: 'Forum',
  href: FORUM_URL
}];
const currentYear = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container flex flex-col items-center space-y-8 py-12 md:py-16 lg:py-24">
        <nav className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
          {links.map((link, index) => (
            <Link
              key={index}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.title}
            </Link>
          ))}
          <ThemeToggle />
        </nav>
        
        <p className="text-sm text-muted-foreground">
          Copyright &copy; {currentYear} Ducflair
        </p>
      </div>
    </footer>
  );
}

export default Footer;