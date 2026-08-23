import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  href?: string;
  className?: string;
}

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base"
};

export function Button({ children, variant = "primary", size = "md", href, className }: ButtonProps) {
  const variantClass = variant === "primary" ? "btn-primary" : "btn-secondary";
  const classes = cn(variantClass, sizeClasses[size], className);

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return <button className={classes}>{children}</button>;
}