import express from "express";
import {
  generateCourseContent,
  getGenerationJobStatus,
  regenerateChapter,
  cancelGenerationJob,
} from "../controllers/aiContentController";

const router = express.Router();

// Generate complete course content
router.post("/courses/:courseId/generate-content", generateCourseContent);

// Get generation job status
router.get("/generation-jobs/:jobId", getGenerationJobStatus);

// Regenerate single chapter
router.post(
  "/courses/:courseId/sections/:sectionId/chapters/:chapterId/regenerate",
  regenerateChapter
);

// Cancel generation job
router.delete("/generation-jobs/:jobId", cancelGenerationJob);

export default router;
