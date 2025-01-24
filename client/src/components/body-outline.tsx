import { cn } from "@/lib/utils";

interface BodyOutlineProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export default function BodyOutline({ className, ...props }: BodyOutlineProps) {
  return (
    <svg
      viewBox="0 0 100 200"
      className={cn("w-full h-full", className)}
      {...props}
    >
      {/* Head */}
      <circle cx="50" cy="20" r="12" className="fill-none stroke-current" />
      
      {/* Neck */}
      <line x1="50" y1="32" x2="50" y2="40" className="stroke-current" />
      
      {/* Body */}
      <path
        d="M30 40 L30 90 Q30 100 50 100 Q70 100 70 90 L70 40 Z"
        className="fill-none stroke-current"
      />
      
      {/* Arms */}
      <path
        d="M30 45 L15 70 L20 90"
        className="fill-none stroke-current"
      />
      <path
        d="M70 45 L85 70 L80 90"
        className="fill-none stroke-current"
      />
      
      {/* Legs */}
      <path
        d="M50 100 L40 150 L35 190"
        className="fill-none stroke-current"
      />
      <path
        d="M50 100 L60 150 L65 190"
        className="fill-none stroke-current"
      />
    </svg>
  );
}
