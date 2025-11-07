import Course from "../models/courseModel";
import UserCourseProgress from "../models/userCourseProgressModel";
import RecommendationFeedback from "../models/recommendationFeedbackModel";
import { v4 as uuidv4 } from "uuid";

interface CourseRecommendation {
  course: any;
  score: number;
  reasons: RecommendationReason[];
}

interface RecommendationReason {
  type: "category_match" | "similar_users" | "trending" | "instructor_match";
  description: string;
  weight: number;
}

// In-memory cache for recommendations
const recommendationCache: Map<string, { data: CourseRecommendation[]; timestamp: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class RecommendationService {
  // Get personalized recommendations for a user
  async getRecommendations(
    userId: string,
    limit: number = 5
  ): Promise<CourseRecommendation[]> {
    // Check cache
    const cached = recommendationCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data.slice(0, limit);
    }

    // Get user's enrollment history
    const userProgress = await UserCourseProgress.query("userId").eq(userId).exec();
    const enrolledCourseIds = userProgress.map((p: any) => p.courseId);

    // Get all published courses
    const allCourses = await Course.scan("status").eq("Published").exec();
    
    // Filter out already enrolled courses
    const unenrolledCourses = allCourses.filter(
      (course: any) => !enrolledCourseIds.includes(course.courseId)
    );

    if (unenrolledCourses.length === 0) {
      return [];
    }

    // Get user's enrolled courses for context
    const enrolledCourses = await Promise.all(
      enrolledCourseIds.map((id: string) => Course.get(id))
    );

    // Calculate recommendations
    const recommendations: CourseRecommendation[] = [];

    for (const course of unenrolledCourses) {
      const score = await this.calculateRecommendationScore(
        userId,
        course,
        enrolledCourses,
        allCourses
      );

      if (score > 0) {
        recommendations.push({
          course,
          score,
          reasons: await this.getRecommendationReasons(
            userId,
            course,
            enrolledCourses,
            allCourses
          ),
        });
      }
    }

    // Sort by score
    recommendations.sort((a, b) => b.score - a.score);

    // Cache results
    recommendationCache.set(userId, {
      data: recommendations,
      timestamp: Date.now(),
    });

    return recommendations.slice(0, limit);
  }

  // Calculate recommendation score
  private async calculateRecommendationScore(
    userId: string,
    course: any,
    enrolledCourses: any[],
    allCourses: any[]
  ): Promise<number> {
    // If no enrollment history, use popularity
    if (enrolledCourses.length === 0) {
      return this.calculatePopularityScore(course, allCourses) * 100;
    }

    const contentScore = this.calculateContentSimilarity(course, enrolledCourses);
    const collaborativeScore = await this.calculateCollaborativeScore(userId, course);
    const popularityScore = this.calculatePopularityScore(course, allCourses);
    const instructorScore = this.calculateInstructorScore(course, enrolledCourses);

    let finalScore =
      contentScore * 0.4 +
      collaborativeScore * 0.3 +
      popularityScore * 0.2 +
      instructorScore * 0.1;

    // Apply feedback adjustments
    const feedbackAdjustment = await this.getUserFeedbackAdjustment(
      userId,
      course.courseId
    );
    finalScore += feedbackAdjustment;

    return Math.min(100, Math.max(0, finalScore));
  }

  // Content-based filtering
  private calculateContentSimilarity(
    course: any,
    enrolledCourses: any[]
  ): number {
    let similarityScore = 0;

    for (const enrolledCourse of enrolledCourses) {
      // Category match (50 points)
      if (course.category === enrolledCourse.category) {
        similarityScore += 50;
      }

      // Level progression (30 points)
      const levelProgression: Record<string, number> = {
        Beginner: 1,
        Intermediate: 2,
        Advanced: 3,
      };
      const enrolledLevel = levelProgression[enrolledCourse.level];
      const courseLevel = levelProgression[course.level];

      if (courseLevel === enrolledLevel || courseLevel === enrolledLevel + 1) {
        similarityScore += 30;
      }

      // Description keyword matching (20 points)
      if (course.description && enrolledCourse.description) {
        const courseWords = new Set(
          course.description.toLowerCase().split(/\s+/)
        );
        const enrolledWords = new Set(
          enrolledCourse.description.toLowerCase().split(/\s+/)
        );
        const intersection = new Set(
          [...courseWords].filter((x) => enrolledWords.has(x))
        );
        const jaccard = intersection.size / (courseWords.size + enrolledWords.size - intersection.size);
        similarityScore += jaccard * 20;
      }
    }

    // Average across enrolled courses
    return Math.min(100, similarityScore / Math.max(1, enrolledCourses.length));
  }

  // Collaborative filtering
  private async calculateCollaborativeScore(
    userId: string,
    course: any
  ): Promise<number> {
    try {
      // Get all users who enrolled in the same courses as the target user
      const userProgress = await UserCourseProgress.query("userId").eq(userId).exec();
      const userCourseIds = userProgress.map((p: any) => p.courseId);

      if (userCourseIds.length === 0) {
        return 0;
      }

      // Get all progress records for these courses
      const allProgress = await UserCourseProgress.scan().exec();
      
      // Find similar users (users who enrolled in at least 2 of the same courses)
      const userSimilarity: Map<string, number> = new Map();

      for (const progress of allProgress) {
        if (progress.userId === userId) continue;

        const otherUserProgress = allProgress.filter(
          (p: any) => p.userId === progress.userId
        );
        const otherUserCourseIds = otherUserProgress.map((p: any) => p.courseId);

        const commonCourses = userCourseIds.filter((id) =>
          otherUserCourseIds.includes(id)
        );

        if (commonCourses.length >= 1) {
          // Jaccard similarity
          const union = new Set([...userCourseIds, ...otherUserCourseIds]);
          const similarity = commonCourses.length / union.size;
          userSimilarity.set(progress.userId, similarity);
        }
      }

      // Check if similar users enrolled in this course
      let collaborativeScore = 0;
      for (const [similarUserId, similarity] of userSimilarity.entries()) {
        const similarUserProgress = allProgress.filter(
          (p: any) => p.userId === similarUserId
        );
        const hasEnrolled = similarUserProgress.some(
          (p: any) => p.courseId === course.courseId
        );

        if (hasEnrolled) {
          collaborativeScore += similarity * 100;
        }
      }

      return Math.min(100, collaborativeScore);
    } catch (error) {
      console.error("Error calculating collaborative score:", error);
      return 0;
    }
  }

  // Popularity-based scoring
  private calculatePopularityScore(course: any, allCourses: any[]): number {
    const enrollmentCount = course.enrollments?.length || 0;
    const maxEnrollments = Math.max(
      ...allCourses.map((c: any) => c.enrollments?.length || 0)
    );

    if (maxEnrollments === 0) {
      return 50; // Default score if no enrollments
    }

    return (enrollmentCount / maxEnrollments) * 100;
  }

  // Instructor-based scoring
  private calculateInstructorScore(
    course: any,
    enrolledCourses: any[]
  ): number {
    const enrolledInstructors = enrolledCourses.map((c) => c.teacherId);
    return enrolledInstructors.includes(course.teacherId) ? 100 : 0;
  }

  // Get user feedback adjustment
  private async getUserFeedbackAdjustment(
    userId: string,
    courseId: string
  ): Promise<number> {
    try {
      const feedback = await RecommendationFeedback.query("userId")
        .eq(userId)
        .exec();

      // Check if user gave negative feedback to this course
      const courseFeedback = feedback.find(
        (f: any) => f.courseId === courseId
      );

      if (courseFeedback) {
        return courseFeedback.feedback === "negative" ? -20 : 0;
      }

      // Check feedback for similar courses
      const course = await Course.get(courseId);
      const similarCourseFeedback = feedback.filter((f: any) => {
        const feedbackCourse = allCourses.find(
          (c: any) => c.courseId === f.courseId
        );
        return (
          feedbackCourse &&
          feedbackCourse.category === course.category &&
          f.feedback === "negative"
        );
      });

      // Reduce score slightly for each similar negative feedback
      return Math.max(-10, -2 * similarCourseFeedback.length);
    } catch (error) {
      console.error("Error getting feedback adjustment:", error);
      return 0;
    }
  }

  // Get recommendation reasons
  private async getRecommendationReasons(
    userId: string,
    course: any,
    enrolledCourses: any[],
    allCourses: any[]
  ): Promise<RecommendationReason[]> {
    const reasons: RecommendationReason[] = [];

    // Category match
    const categoryMatch = enrolledCourses.some(
      (c) => c.category === course.category
    );
    if (categoryMatch) {
      reasons.push({
        type: "category_match",
        description: `Based on your interest in ${course.category}`,
        weight: 0.4,
      });
    }

    // Instructor match
    const instructorMatch = enrolledCourses.some(
      (c) => c.teacherId === course.teacherId
    );
    if (instructorMatch) {
      reasons.push({
        type: "instructor_match",
        description: `From ${course.teacherName}, whose courses you've taken before`,
        weight: 0.1,
      });
    }

    // Trending
    const enrollmentCount = course.enrollments?.length || 0;
    if (enrollmentCount > 10) {
      reasons.push({
        type: "trending",
        description: `Popular course with ${enrollmentCount} students enrolled`,
        weight: 0.2,
      });
    }

    // Similar users (collaborative filtering)
    if (enrolledCourses.length > 0) {
      reasons.push({
        type: "similar_users",
        description: "Students with similar interests also enrolled in this course",
        weight: 0.3,
      });
    }

    return reasons;
  }

  // Get similar courses based on a specific course
  async getSimilarCourses(
    courseId: string,
    limit: number = 5
  ): Promise<CourseRecommendation[]> {
    const targetCourse = await Course.get(courseId);
    const allCourses = await Course.scan("status").eq("Published").exec();

    const similarCourses = allCourses
      .filter((c: any) => c.courseId !== courseId)
      .map((course: any) => {
        const score = this.calculateContentSimilarity(course, [targetCourse]);
        return {
          course,
          score,
          reasons: [
            {
              type: "category_match" as const,
              description: `Similar to ${targetCourse.title}`,
              weight: 1.0,
            },
          ],
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return similarCourses;
  }

  // Record user feedback
  async recordFeedback(
    userId: string,
    courseId: string,
    feedback: "positive" | "negative",
    recommendationScore?: number,
    recommendationReasons?: RecommendationReason[]
  ): Promise<void> {
    const feedbackRecord = new RecommendationFeedback({
      feedbackId: uuidv4(),
      userId,
      courseId,
      feedback,
      recommendationScore,
      recommendationReasons,
    });

    await feedbackRecord.save();

    // Invalidate cache
    recommendationCache.delete(userId);
  }

  // Get trending courses
  async getTrendingCourses(limit: number = 10): Promise<any[]> {
    const allCourses = await Course.scan("status").eq("Published").exec();

    const trending = allCourses
      .map((course: any) => ({
        ...course,
        enrollmentCount: course.enrollments?.length || 0,
      }))
      .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
      .slice(0, limit);

    return trending;
  }

  // Refresh recommendations (clear cache)
  async refreshRecommendations(userId: string): Promise<void> {
    recommendationCache.delete(userId);
  }
}

// Store reference to allCourses for feedback adjustment
let allCourses: any[] = [];
Course.scan().exec().then((courses) => {
  allCourses = courses;
});
