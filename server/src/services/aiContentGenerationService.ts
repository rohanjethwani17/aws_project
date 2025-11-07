import { LLMService } from "./llmService";
import { CONTENT_TEMPLATES, fillTemplate } from "./promptTemplates";
import ContentGenerationJob from "../models/contentGenerationJobModel";
import Course from "../models/courseModel";
import { v4 as uuidv4 } from "uuid";

interface CourseOutline {
  title: string;
  description: string;
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  sections: SectionOutline[];
}

interface SectionOutline {
  sectionTitle: string;
  sectionDescription?: string;
  chapters: ChapterOutline[];
}

interface ChapterOutline {
  title: string;
  type: "Text" | "Quiz" | "Video";
  learningObjectives?: string[];
}

interface GenerationOptions {
  tone?: "professional" | "casual" | "academic";
  detailLevel?: "concise" | "detailed" | "comprehensive";
  includeExamples?: boolean;
  targetAudience?: string;
}

// In-memory job queue
const jobQueue: Map<string, boolean> = new Map();
const activeJobs = new Set<string>();

export class AIContentGenerationService {
  private llmService: LLMService;
  private rateLimiter: Map<string, number[]> = new Map();

  constructor() {
    this.llmService = new LLMService();
  }

  // Check rate limit (5 generations per instructor per hour)
  private checkRateLimit(instructorId: string): boolean {
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;
    
    const instructorRequests = this.rateLimiter.get(instructorId) || [];
    const recentRequests = instructorRequests.filter(time => time > hourAgo);
    
    if (recentRequests.length >= 5) {
      return false;
    }
    
    recentRequests.push(now);
    this.rateLimiter.set(instructorId, recentRequests);
    return true;
  }

  // Generate complete course content
  async generateCourseContent(
    courseId: string,
    instructorId: string,
    outline: CourseOutline,
    options?: GenerationOptions
  ): Promise<any> {
    // Check rate limit
    if (!this.checkRateLimit(instructorId)) {
      throw new Error(
        "Rate limit exceeded. Maximum 5 content generations per hour per instructor."
      );
    }

    const jobId = uuidv4();
    const totalSections = outline.sections.length;
    const totalChapters = outline.sections.reduce(
      (sum, section) => sum + section.chapters.length,
      0
    );

    // Create job record
    const job = new ContentGenerationJob({
      jobId,
      courseId,
      instructorId,
      status: "pending",
      progress: 0,
      outline,
      options: options || {},
      totalSections,
      totalChapters,
      startedAt: new Date().toISOString(),
      apiCallsUsed: 0,
      llmProvider: "gemini",
    });

    await job.save();

    // Queue the job for async processing
    this.processJobAsync(jobId);

    return job;
  }

  // Process job asynchronously
  private async processJobAsync(jobId: string) {
    // Ensure we don't process more than 5 jobs simultaneously
    while (activeJobs.size >= 5) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    activeJobs.add(jobId);

    try {
      const job = await ContentGenerationJob.get(jobId);
      job.status = "processing";
      await job.save();

      const course = await Course.get(job.courseId);
      const outline = job.outline as CourseOutline;
      
      let chaptersProcessed = 0;
      const generatedSections: any[] = [];

      for (let sectionIndex = 0; sectionIndex < outline.sections.length; sectionIndex++) {
        const section = outline.sections[sectionIndex];
        const generatedChapters: any[] = [];

        job.currentSection = sectionIndex;
        await job.save();

        for (let chapterIndex = 0; chapterIndex < section.chapters.length; chapterIndex++) {
          const chapter = section.chapters[chapterIndex];
          
          job.currentChapter = chapterIndex;
          await job.save();

          try {
            const generatedChapter = await this.generateChapter(
              outline,
              section,
              chapter
            );

            generatedChapters.push({
              chapterId: uuidv4(),
              ...generatedChapter,
              aiGenerated: true,
              aiMetadata: {
                generatedAt: new Date().toISOString(),
                prompt: this.getPromptForChapter(outline, section, chapter),
                modified: false,
              },
            });

            job.apiCallsUsed += 1;
            chaptersProcessed++;
            job.progress = Math.round((chaptersProcessed / job.totalChapters) * 100);
            await job.save();
          } catch (error) {
            console.error(`Error generating chapter:`, error);
            throw error;
          }
        }

        generatedSections.push({
          sectionId: uuidv4(),
          sectionTitle: section.sectionTitle,
          sectionDescription: section.sectionDescription || "",
          chapters: generatedChapters,
        });
      }

      // Update course with generated content
      course.sections = generatedSections;
      course.aiGenerated = true;
      course.generationJobId = jobId;
      course.aiMetadata = {
        generatedAt: new Date().toISOString(),
        llmProvider: job.llmProvider,
        apiCallsUsed: job.apiCallsUsed,
        modificationPercentage: 0,
      };
      await course.save();

      // Mark job as completed
      job.status = "completed";
      job.progress = 100;
      job.completedAt = new Date().toISOString();
      await job.save();

    } catch (error: any) {
      const job = await ContentGenerationJob.get(jobId);
      job.status = "failed";
      job.error = error.message;
      await job.save();
    } finally {
      activeJobs.delete(jobId);
    }
  }

  // Generate single chapter content
  private async generateChapter(
    outline: CourseOutline,
    section: SectionOutline,
    chapter: ChapterOutline
  ): Promise<any> {
    const prompt = this.getPromptForChapter(outline, section, chapter);
    const { content, provider } = await this.llmService.generateContent(prompt);

    // Validate and format content based on type
    if (chapter.type === "Quiz") {
      return this.formatQuizContent(content, chapter);
    } else if (chapter.type === "Video") {
      return this.formatVideoContent(content, chapter);
    } else {
      return this.formatTextContent(content, chapter);
    }
  }

  // Get prompt for specific chapter type
  private getPromptForChapter(
    outline: CourseOutline,
    section: SectionOutline,
    chapter: ChapterOutline
  ): string {
    const objectives = chapter.learningObjectives?.join(", ") || "General understanding";

    const variables = {
      courseTitle: outline.title,
      courseLevel: outline.level,
      category: outline.category,
      sectionTitle: section.sectionTitle,
      chapterTitle: chapter.title,
      objectives: objectives,
    };

    if (chapter.type === "Quiz") {
      return fillTemplate(CONTENT_TEMPLATES.quiz, variables);
    } else if (chapter.type === "Video") {
      return fillTemplate(CONTENT_TEMPLATES.videoScript, variables);
    } else {
      return fillTemplate(CONTENT_TEMPLATES.textLesson, variables);
    }
  }

  // Format quiz content
  private formatQuizContent(content: string, chapter: ChapterOutline): any {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        const questions = JSON.parse(jsonMatch[0]);
        return {
          type: "Quiz",
          title: chapter.title,
          content: JSON.stringify(questions, null, 2),
        };
      }
    } catch (error) {
      console.error("Error parsing quiz content:", error);
    }

    // Fallback: create basic quiz structure
    return {
      type: "Quiz",
      title: chapter.title,
      content: JSON.stringify(
        [
          {
            question: `Sample question for ${chapter.title}`,
            options: ["Option A", "Option B", "Option C", "Option D"],
            correctAnswer: 0,
            explanation: "This is a sample question. Please edit this quiz.",
          },
        ],
        null,
        2
      ),
    };
  }

  // Format video content
  private formatVideoContent(content: string, chapter: ChapterOutline): any {
    return {
      type: "Video",
      title: chapter.title,
      content: content.substring(0, 10000), // Limit content length
      video: "", // Video URL will be added later by instructor
    };
  }

  // Format text content
  private formatTextContent(content: string, chapter: ChapterOutline): any {
    return {
      type: "Text",
      title: chapter.title,
      content: content.substring(0, 10000), // Limit content length
    };
  }

  // Regenerate single chapter
  async regenerateChapter(
    courseId: string,
    sectionId: string,
    chapterId: string,
    instructorId: string
  ): Promise<any> {
    // Check rate limit
    if (!this.checkRateLimit(instructorId)) {
      throw new Error(
        "Rate limit exceeded. Maximum 5 content generations per hour per instructor."
      );
    }

    const course = await Course.get(courseId);
    const section = course.sections.find((s: any) => s.sectionId === sectionId);
    if (!section) {
      throw new Error("Section not found");
    }

    const chapter = section.chapters.find((c: any) => c.chapterId === chapterId);
    if (!chapter) {
      throw new Error("Chapter not found");
    }

    // Generate new content
    const outline: CourseOutline = {
      title: course.title,
      description: course.description || "",
      category: course.category,
      level: course.level,
      sections: [],
    };

    const sectionOutline: SectionOutline = {
      sectionTitle: section.sectionTitle,
      sectionDescription: section.sectionDescription,
      chapters: [],
    };

    const chapterOutline: ChapterOutline = {
      title: chapter.title,
      type: chapter.type,
    };

    const generatedChapter = await this.generateChapter(
      outline,
      sectionOutline,
      chapterOutline
    );

    // Update chapter in course
    chapter.content = generatedChapter.content;
    chapter.aiGenerated = true;
    chapter.aiMetadata = {
      generatedAt: new Date().toISOString(),
      prompt: this.getPromptForChapter(outline, sectionOutline, chapterOutline),
      modified: false,
    };

    await course.save();

    return chapter;
  }

  // Get job status
  async getJobStatus(jobId: string): Promise<any> {
    return await ContentGenerationJob.get(jobId);
  }

  // Cancel job
  async cancelJob(jobId: string): Promise<void> {
    const job = await ContentGenerationJob.get(jobId);
    if (job.status === "processing" || job.status === "pending") {
      job.status = "failed";
      job.error = "Job cancelled by user";
      await job.save();
      activeJobs.delete(jobId);
    }
  }
}
