import { Request, Response } from "express";
import { RecommendationService } from "../services/recommendationService";
import { getAuth } from "@clerk/express";

const recommendationService = new RecommendationService();

// Get personalized recommendations for authenticated user
export const getPersonalizedRecommendations = async (
  req: Request,
  res: Response
): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId || "demo-user"; // Use demo user if not authenticated
  const limit = parseInt(req.query.limit as string) || 5;

  try {
    const recommendations = await recommendationService.getRecommendations(
      userId,
      limit
    );

    res.json({
      message: "Recommendations retrieved successfully",
      data: recommendations,
    });
  } catch (error: any) {
    console.error("Recommendation error:", error);
    res.status(500).json({
      message: "Error retrieving recommendations",
      error: error.message,
    });
  }
};

// Get courses similar to a specific course
export const getSimilarCourses = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId } = req.params;
  const limit = parseInt(req.query.limit as string) || 5;

  try {
    const similarCourses = await recommendationService.getSimilarCourses(
      courseId,
      limit
    );

    res.json({
      message: "Similar courses retrieved successfully",
      data: similarCourses,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Error retrieving similar courses",
      error: error.message,
    });
  }
};

// Record user feedback on recommendations
export const recordRecommendationFeedback = async (
  req: Request,
  res: Response
): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId || "demo-user";
  const { courseId, feedback, recommendationScore, recommendationReasons } = req.body;

  try {
    if (!courseId || !feedback) {
      res.status(400).json({
        message: "Course ID and feedback are required",
      });
      return;
    }

    if (feedback !== "positive" && feedback !== "negative") {
      res.status(400).json({
        message: "Feedback must be 'positive' or 'negative'",
      });
      return;
    }

    await recommendationService.recordFeedback(
      userId,
      courseId,
      feedback,
      recommendationScore,
      recommendationReasons
    );

    res.json({
      message: "Feedback recorded successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Error recording feedback",
      error: error.message,
    });
  }
};

// Get trending/popular courses
export const getTrendingCourses = async (
  req: Request,
  res: Response
): Promise<void> => {
  const limit = parseInt(req.query.limit as string) || 10;

  try {
    const trendingCourses = await recommendationService.getTrendingCourses(
      limit
    );

    res.json({
      message: "Trending courses retrieved successfully",
      data: trendingCourses,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Error retrieving trending courses",
      error: error.message,
    });
  }
};
