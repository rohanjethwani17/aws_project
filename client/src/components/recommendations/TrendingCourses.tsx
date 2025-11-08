"use client";

import React from "react";
import { useGetTrendingCoursesQuery } from "@/state/api";
import CourseCard from "@/components/CourseCard";
import { TrendingUp, Users } from "lucide-react";

interface TrendingCoursesProps {
  limit?: number;
}

const TrendingCourses: React.FC<TrendingCoursesProps & { onCourseSelect?: (course: Course) => void }> = ({ limit = 6, onCourseSelect }) => {
  const { data: trendingCourses, isLoading, error } = useGetTrendingCoursesQuery({
    limit,
  });

  const onGoToCourse = (course: Course) => {
    if (onCourseSelect) {
      onCourseSelect(course);
    } else {
      window.location.href = `/search?id=${course.courseId}`;
    }
  };

  if (error) {
    console.error("Trending courses error:", error);
    return null;
  }

  if (isLoading) {
    return (
      <div className="py-8">
        <h2 className="text-2xl font-bold mb-6">Trending Courses</h2>
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

  if (!trendingCourses || trendingCourses.length === 0) {
    return null;
  }

  return (
    <div className="py-8">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-6 h-6 text-orange-500" />
        <h2 className="text-2xl font-bold">Trending Courses</h2>
        <span className="text-sm bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-semibold">Popular</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trendingCourses.map((course: any) => (
          <div key={course.courseId} className="relative group">
            {/* Enrollment Count Badge */}
            <div className="absolute top-4 right-4 z-10 bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
              <Users className="w-3 h-3" />
              {course.enrollmentCount || 0}
            </div>

            <CourseCard
              course={course}
              onGoToCourse={onGoToCourse}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendingCourses;
