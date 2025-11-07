import express from "express";
import {
  getPersonalizedRecommendations,
  getSimilarCourses,
  recordRecommendationFeedback,
  getTrendingCourses,
} from "../controllers/recommendationController";

const router = express.Router();

// Get personalized recommendations
router.get("/for-you", getPersonalizedRecommendations);

// Get similar courses
router.get("/similar/:courseId", getSimilarCourses);

// Record feedback
router.post("/feedback", recordRecommendationFeedback);

// Get trending courses
router.get("/trending", getTrendingCourses);

export default router;
