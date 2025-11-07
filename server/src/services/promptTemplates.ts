export const CONTENT_TEMPLATES = {
  textLesson: `You are an expert course instructor creating educational content.

Course Context:
- Title: {courseTitle}
- Level: {courseLevel}
- Category: {category}

Chapter Details:
- Section: {sectionTitle}
- Chapter: {chapterTitle}
- Learning Objectives: {objectives}

Generate a comprehensive lesson that:
1. Starts with a clear introduction
2. Covers key concepts with explanations
3. Includes practical examples
4. Ends with a summary of key takeaways

Format the content in markdown with proper headings, bullet points, and code blocks where appropriate.
Keep the content between 500-1500 words.

Lesson Content:`,

  quiz: `You are creating assessment questions for an online course.

Course Context:
- Title: {courseTitle}
- Level: {courseLevel}
- Chapter: {chapterTitle}

Generate 5-7 multiple choice questions that:
1. Test understanding of key concepts
2. Are appropriate for {courseLevel} level
3. Have 4 answer options each
4. Include explanations for correct answers

Return ONLY a valid JSON array with no additional text:
[
  {
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": 0,
    "explanation": "..."
  }
]

JSON Array:`,

  videoScript: `You are creating a video script for an educational course.

Course Context:
- Title: {courseTitle}
- Chapter: {chapterTitle}
- Duration Target: 5-10 minutes

Create a video script with:
1. Timestamps for each section
2. Talking points for the instructor
3. Visual suggestions (diagrams, code, slides)
4. Engagement prompts (questions, activities)

Format:
[00:00] Introduction
- Talking points...
- Visual: ...

[01:30] Main Content Section 1
- Talking points...
- Visual: ...

[03:00] Main Content Section 2
- Talking points...
- Visual: ...

[05:00] Summary and Call to Action
- Talking points...
- Visual: ...

Video Script:`,
};

export function fillTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let filled = template;
  for (const [key, value] of Object.entries(variables)) {
    filled = filled.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return filled;
}
