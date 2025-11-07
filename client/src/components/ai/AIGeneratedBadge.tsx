"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AIGeneratedBadgeProps {
  showBadge?: boolean;
  className?: string;
}

const AIGeneratedBadge: React.FC<AIGeneratedBadgeProps> = ({
  showBadge = true,
  className = "",
}) => {
  if (!showBadge) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium ${className}`}
          >
            <Sparkles className="w-3 h-3" />
            AI-Generated
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs max-w-xs">
            This content was generated using AI and reviewed by the instructor
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AIGeneratedBadge;
