"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface NavigationButtonProps {
  href: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export function NavigationButton({
  href,
  variant = "default",
  className,
  children,
  disabled = false,
}: NavigationButtonProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleClick = () => {
    if (disabled || isNavigating) return;
    
    setIsNavigating(true);
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <Button
      variant={variant}
      className={className}
      onClick={handleClick}
      disabled={disabled || isNavigating}
    >
      {isNavigating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>加载中...</span>
        </>
      ) : (
        children
      )}
    </Button>
  );
}

