import { Schema, model } from "dynamoose";

const recommendationFeedbackSchema = new Schema(
  {
    feedbackId: {
      type: String,
      hashKey: true,
      required: true,
    },
    userId: {
      type: String,
      required: true,
      index: {
        name: "UserIdIndex",
        type: "global",
      },
    },
    courseId: {
      type: String,
      required: true,
    },
    feedback: {
      type: String,
      enum: ["positive", "negative"],
      required: true,
    },
    recommendationScore: {
      type: Number,
    },
    recommendationReasons: {
      type: Array,
      schema: [
        new Schema({
          type: String,
          description: String,
        }),
      ],
    },
  },
  {
    timestamps: true,
  }
);

const RecommendationFeedback = model(
  "RecommendationFeedback",
  recommendationFeedbackSchema
);
export default RecommendationFeedback;
