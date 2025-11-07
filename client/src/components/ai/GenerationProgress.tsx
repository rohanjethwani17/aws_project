"use client";

import React, { useEffect } from "react";
import { useGetGenerationJobStatusQuery } from "@/state/api";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface GenerationProgressProps {
  jobId: string;
  courseId: string;
  onComplete: () => void;
  onError: (error: string) => void;
}

const GenerationProgress: React.FC<GenerationProgressProps> = ({
  jobId,
  courseId,
  onComplete,
  onError,
}) => {
  const { data: job, isLoading, error } = useGetGenerationJobStatusQuery(jobId, {
    pollingInterval: 2000, // Poll every 2 seconds
    skipPollingIfUnfocused: false,
  });

  useEffect(() => {
    if (job?.status === "completed") {
      toast.success("Content generation completed!");
      onComplete();
    } else if (job?.status === "failed") {
      toast.error("Content generation failed");
      onError(job.error || "Unknown error");
    }
  }, [job?.status]);

  if (isLoading && !job) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <span className="ml-2">Loading job status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <XCircle className="w-6 h-6" />
          <span className="font-semibold">Failed to load job status</span>
        </div>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  const getStatusColor = () => {
    switch (job.status) {
      case "completed":
        return "text-green-600 dark:text-green-400";
      case "failed":
        return "text-red-600 dark:text-red-400";
      case "processing":
        return "text-blue-600 dark:text-blue-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getStatusIcon = () => {
    switch (job.status) {
      case "completed":
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case "failed":
        return <XCircle className="w-6 h-6 text-red-600" />;
      case "processing":
        return <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />;
      default:
        return <Loader2 className="w-6 h-6 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-lg border">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-lg font-semibold">
              Content Generation {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </h3>
            <p className="text-sm text-gray-500">
              Using {job.llmProvider} • {job.apiCallsUsed} API calls used
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {(job.status === "processing" || job.status === "pending") && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progress</span>
            <span className="font-semibold">{job.progress}%</span>
          </div>
          <Progress value={job.progress} className="h-2" />
        </div>
      )}

      {/* Current Status */}
      {job.status === "processing" && job.currentSection !== undefined && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            Generating Section {job.currentSection + 1} of {job.totalSections}
            {job.currentChapter !== undefined &&
              ` - Chapter ${job.currentChapter + 1}`}
          </p>
        </div>
      )}

      {/* Completed Status */}
      {job.status === "completed" && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg space-y-3">
          <p className="text-sm text-green-900 dark:text-green-100">
            Successfully generated {job.totalChapters} chapters across {job.totalSections} sections!
          </p>
          <Button
            onClick={() => (window.location.href = `/teacher/courses/${courseId}`)}
            className="bg-green-600 hover:bg-green-700"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Generated Content
          </Button>
        </div>
      )}

      {/* Error Status */}
      {job.status === "failed" && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-sm text-red-900 dark:text-red-100 font-semibold mb-2">
            Generation Failed
          </p>
          <p className="text-sm text-red-800 dark:text-red-200">
            {job.error || "An unknown error occurred"}
          </p>
          <div className="mt-4">
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        <div>
          <p className="text-xs text-gray-500">Sections</p>
          <p className="text-lg font-semibold">{job.totalSections}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Chapters</p>
          <p className="text-lg font-semibold">{job.totalChapters}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">API Calls</p>
          <p className="text-lg font-semibold">{job.apiCallsUsed}</p>
        </div>
      </div>

      {/* Timestamps */}
      <div className="text-xs text-gray-500 space-y-1 border-t pt-4">
        <p>Started: {new Date(job.startedAt).toLocaleString()}</p>
        {job.completedAt && (
          <p>Completed: {new Date(job.completedAt).toLocaleString()}</p>
        )}
      </div>
    </div>
  );
};

export default GenerationProgress;
