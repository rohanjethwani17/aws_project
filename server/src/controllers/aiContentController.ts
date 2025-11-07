import { Request, Response } from "express";
import { AIContentGenerationService } from "../services/aiContentGenerationService";
import { getAuth } from "@clerk/express";
import Course from "../models/courseModel";

const aiService = new AIContentGenerationService();

// Generate complete course content from outline
export const generateCourseContent = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId } = req.params;
  const { outline, options } = req.body;
  const { userId } = getAuth(req);

  try {
    // Verify course ownership
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    if (course.teacherId !== userId) {
      res.status(403).json({ message: "Not authorized to generate content for this course" });
      return;
    }

    // Validate outline
    if (!outline || !outline.sections || outline.sections.length === 0) {
      res.status(400).json({ message: "Course outline must contain at least one section" });
      return;
    }

    const job = await aiService.generateCourseContent(
      courseId,
      userId!,
      outline,
      options
    );

    res.json({
      message: "Content generation started",
      data: job,
    });
  } catch (error: any) {
    if (error.message.includes("Rate limit")) {
      res.status(429).json({
        message: error.message,
        error: "RATE_LIMIT_EXCEEDED",
        retryAfter: 3600,
      });
    } else {
      res.status(500).json({ message: "Error generating content", error: error.message });
    }
  }
};

// Get generation job status
export const getGenerationJobStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { jobId } = req.params;

  try {
    const job = await aiService.getJobStatus(jobId);
    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    res.json({ message: "Job status retrieved", data: job });
  } catch (error: any) {
    res.status(500).json({ message: "Error retrieving job status", error: error.message });
  }
};

// Regenerate single chapter
export const regenerateChapter = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId } = req.params;
  const { userId } = getAuth(req);

  try {
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    if (course.teacherId !== userId) {
      res.status(403).json({ message: "Not authorized to regenerate content for this course" });
      return;
    }

    const chapter = await aiService.regenerateChapter(
      courseId,
      sectionId,
      chapterId,
      userId!
    );

    res.json({
      message: "Chapter regenerated successfully",
      data: chapter,
    });
  } catch (error: any) {
    if (error.message.includes("Rate limit")) {
      res.status(429).json({
        message: error.message,
        error: "RATE_LIMIT_EXCEEDED",
      });
    } else {
      res.status(500).json({ message: "Error regenerating chapter", error: error.message });
    }
  }
};

// Cancel generation job
export const cancelGenerationJob = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { jobId } = req.params;
  const { userId } = getAuth(req);

  try {
    const job = await aiService.getJobStatus(jobId);
    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    if (job.instructorId !== userId) {
      res.status(403).json({ message: "Not authorized to cancel this job" });
      return;
    }

    await aiService.cancelJob(jobId);

    res.json({ message: "Job cancelled successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Error cancelling job", error: error.message });
  }
};
