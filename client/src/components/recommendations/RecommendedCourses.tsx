"use client";

import React from "react";
import { useGetPersonalizedRecommendationsQuery, useRecordRecommendationFeedbackMutation } from "@/state/api";
import CourseCard from "@/components/CourseCard";
import { ThumbsUp, ThumbsDown, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

interface RecommendedCoursesProps {
  limit?: number;
}

const RecommendedCourses: React.FC<RecommendedCoursesProps> = ({ limit = 5 }) => {
  const { user } = useUser();
  const { data: recommendations, isLoading, error } = useGetPersonalizedRecommendationsQuery(
    { limit },
    { skip: !user }
  );
  const [recordFeedback] = useRecordRecommendationFeedbackMutation();

  const handleFeedback = async (
    courseId: string,
    feedback: "positive" | "negative",
    score: number,
    reasons: any[]
  ) => {
    try {
      await recordFeedback({
        courseId,
        feedback,
        recommendationScore: score,
        recommendationReasons: reasons,
      }).unwrap();
      toast.success(
        `Thank you for your feedback! ${feedback === "positive" ? "👍" : "👎"}`
      );
    } catch (error) {
      console.error("Failed to record feedback:", error);
    }
  };

  const onGoToCourse = (course: Course) => {
    window.location.href = `/search?id=${course.courseId}`;
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-6 h-6 text-purple-500" />
          <h2 className="text-2xl font-bold">Recommended For You</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="py-8">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-6 h-6 text-purple-500" />
        <h2 className="text-2xl font-bold">Recommended For You</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((rec) => (
          <div key={rec.course.courseId} className="relative group">
            {/* Match Score Badge */}
            <div className="absolute top-4 right-4 z-10 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
              {Math.round(rec.score)}% match
            </div>

            <CourseCard
              course={rec.course}
              onGoToCourse={onGoToCourse}
            />

            {/* Recommendation Reasons */}
            <div className="mt-3 space-y-2">
              {rec.reasons.slice(0, 2).map((reason, idx) => (
                <p
                  key={idx}
                  className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1"
                >
                  <TrendingUp className="w-3 h-3 mt-0.5 text-purple-500 flex-shrink-0" />
                  <span>{reason.description}</span>
                </p>
              ))}
            </div>

            {/* Feedback Buttons */}
            <div className="mt-3 flex items-center gap-2">
              <p className="text-xs text-gray-500 flex-1">Was this helpful?</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleFeedback(
                    rec.course.courseId,
                    "positive",
                    rec.score,
                    rec.reasons
                  )
                }
                className="h-7 px-2"
                data-testid={`recommend-positive-${rec.course.courseId}`}
              >
                <ThumbsUp className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleFeedback(
                    rec.course.courseId,
                    "negative",
                    rec.score,
                    rec.reasons
                  )
                }
                className="h-7 px-2"
                data-testid={`recommend-negative-${rec.course.courseId}`}
              >
                <ThumbsDown className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedCourses;
