import { Schema, model } from "dynamoose";

const contentGenerationJobSchema = new Schema(
  {
    jobId: {
      type: String,
      hashKey: true,
      required: true,
    },
    courseId: {
      type: String,
      required: true,
      index: {
        name: "CourseIdIndex",
        type: "global",
      },
    },
    instructorId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      required: true,
    },
    progress: {
      type: Number,
      default: 0,
    },
    outline: {
      type: Object,
      required: true,
    },
    options: {
      type: Object,
    },
    currentSection: {
      type: Number,
    },
    currentChapter: {
      type: Number,
    },
    totalSections: {
      type: Number,
      required: true,
    },
    totalChapters: {
      type: Number,
      required: true,
    },
    startedAt: {
      type: String,
      required: true,
    },
    completedAt: {
      type: String,
    },
    error: {
      type: String,
    },
    apiCallsUsed: {
      type: Number,
      default: 0,
    },
    llmProvider: {
      type: String,
      enum: ["gemini", "huggingface", "ollama"],
      default: "gemini",
    },
  },
  {
    timestamps: true,
  }
);

const ContentGenerationJob = model(
  "ContentGenerationJob",
  contentGenerationJobSchema
);
export default ContentGenerationJob;
