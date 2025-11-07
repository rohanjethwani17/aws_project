"use client";

import React from "react";
import { useGetSimilarCoursesQuery } from "@/state/api";
import CourseCard from "@/components/CourseCard";
import { Sparkles } from "lucide-react";

interface SimilarCoursesProps {
  courseId: string;
  limit?: number;
}

const SimilarCourses: React.FC<SimilarCoursesProps> = ({
  courseId,
  limit = 4,
}) => {
  const { data: similarCourses, isLoading } = useGetSimilarCoursesQuery({
    courseId,
    limit,
  });

  const onGoToCourse = (course: Course) => {
    window.location.href = `/search?id=${course.courseId}`;
  };

  if (isLoading) {
    return (
      <div className="py-8">
        <h2 className="text-2xl font-bold mb-6">Similar Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-64 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!similarCourses || similarCourses.length === 0) {
    return null;
  }

  return (
    <div className="py-8">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-6 h-6 text-blue-500" />
        <h2 className="text-2xl font-bold">Similar Courses</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {similarCourses.map((rec) => (
          <div key={rec.course.courseId} className="relative group">
            {/* Similarity Score Badge */}
            <div className="absolute top-4 right-4 z-10 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
              {Math.round(rec.score)}% similar
            </div>

            <CourseCard
              course={rec.course}
              onGoToCourse={onGoToCourse}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimilarCourses;
