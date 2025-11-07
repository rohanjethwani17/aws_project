"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Trash2, Sparkles } from "lucide-react";
import { useGenerateCourseContentMutation } from "@/state/api";
import { toast } from "sonner";

interface AIContentWizardProps {
  courseId: string;
  onGenerationStarted: (jobId: string) => void;
  onClose: () => void;
}

interface ChapterOutline {
  title: string;
  type: "Text" | "Quiz" | "Video";
}

interface SectionOutline {
  sectionTitle: string;
  sectionDescription?: string;
  chapters: ChapterOutline[];
}

const AIContentWizard: React.FC<AIContentWizardProps> = ({
  courseId,
  onGenerationStarted,
  onClose,
}) => {
  const [generateContent, { isLoading }] = useGenerateCourseContentMutation();

  const [outline, setOutline] = useState({
    title: "",
    description: "",
    category: "",
    level: "Beginner" as "Beginner" | "Intermediate" | "Advanced",
    sections: [
      {
        sectionTitle: "",
        sectionDescription: "",
        chapters: [
          {
            title: "",
            type: "Text" as "Text" | "Quiz" | "Video",
          },
        ],
      },
    ],
  });

  const [options, setOptions] = useState({
    tone: "professional" as "professional" | "casual" | "academic",
    detailLevel: "detailed" as "concise" | "detailed" | "comprehensive",
    includeExamples: true,
  });

  const addSection = () => {
    setOutline({
      ...outline,
      sections: [
        ...outline.sections,
        {
          sectionTitle: "",
          sectionDescription: "",
          chapters: [{ title: "", type: "Text" }],
        },
      ],
    });
  };

  const removeSection = (index: number) => {
    setOutline({
      ...outline,
      sections: outline.sections.filter((_, i) => i !== index),
    });
  };

  const addChapter = (sectionIndex: number) => {
    const newSections = [...outline.sections];
    newSections[sectionIndex].chapters.push({ title: "", type: "Text" });
    setOutline({ ...outline, sections: newSections });
  };

  const removeChapter = (sectionIndex: number, chapterIndex: number) => {
    const newSections = [...outline.sections];
    newSections[sectionIndex].chapters = newSections[
      sectionIndex
    ].chapters.filter((_, i) => i !== chapterIndex);
    setOutline({ ...outline, sections: newSections });
  };

  const updateSection = (
    index: number,
    field: string,
    value: string
  ) => {
    const newSections = [...outline.sections];
    (newSections[index] as any)[field] = value;
    setOutline({ ...outline, sections: newSections });
  };

  const updateChapter = (
    sectionIndex: number,
    chapterIndex: number,
    field: string,
    value: string
  ) => {
    const newSections = [...outline.sections];
    (newSections[sectionIndex].chapters[chapterIndex] as any)[field] = value;
    setOutline({ ...outline, sections: newSections });
  };

  const handleGenerate = async () => {
    // Validation
    if (!outline.title || !outline.category) {
      toast.error("Please fill in course title and category");
      return;
    }

    if (outline.sections.length === 0) {
      toast.error("Please add at least one section");
      return;
    }

    for (const section of outline.sections) {
      if (!section.sectionTitle) {
        toast.error("Please fill in all section titles");
        return;
      }
      if (section.chapters.length === 0) {
        toast.error(
          `Section "${section.sectionTitle}" must have at least one chapter`
        );
        return;
      }
      for (const chapter of section.chapters) {
        if (!chapter.title) {
          toast.error("Please fill in all chapter titles");
          return;
        }
      }
    }

    try {
      const result = await generateContent({
        courseId,
        outline,
        options,
      }).unwrap();

      toast.success("Content generation started!");
      onGenerationStarted(result.jobId);
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error(
        error.data?.message || "Failed to start content generation"
      );
    }
  };

  return (
    <div className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-500" />
          Generate Course Content with AI
        </h2>
      </div>

      {/* Course Info */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Course Title *</Label>
          <Input
            id="title"
            value={outline.title}
            onChange={(e) =>
              setOutline({ ...outline, title: e.target.value })
            }
            placeholder="e.g., Introduction to JavaScript"
          />
        </div>

        <div>
          <Label htmlFor="description">Course Description</Label>
          <Input
            id="description"
            value={outline.description}
            onChange={(e) =>
              setOutline({ ...outline, description: e.target.value })
            }
            placeholder="Brief description of the course"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">Category *</Label>
            <Input
              id="category"
              value={outline.category}
              onChange={(e) =>
                setOutline({ ...outline, category: e.target.value })
              }
              placeholder="e.g., Programming"
            />
          </div>

          <div>
            <Label htmlFor="level">Level *</Label>
            <Select
              value={outline.level}
              onValueChange={(value: any) =>
                setOutline({ ...outline, level: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Generation Options */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold">Generation Options</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tone">Tone</Label>
            <Select
              value={options.tone}
              onValueChange={(value: any) =>
                setOptions({ ...options, tone: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="academic">Academic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="detailLevel">Detail Level</Label>
            <Select
              value={options.detailLevel}
              onValueChange={(value: any) =>
                setOptions({ ...options, detailLevel: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="concise">Concise</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
                <SelectItem value="comprehensive">Comprehensive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4 border-t pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Course Sections *</h3>
          <Button onClick={addSection} variant="outline" size="sm">
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Section
          </Button>
        </div>

        {outline.sections.map((section, sectionIndex) => (
          <div
            key={sectionIndex}
            className="space-y-3 p-4 border rounded-lg bg-gray-50 dark:bg-gray-700"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Section {sectionIndex + 1}</h4>
              {outline.sections.length > 1 && (
                <Button
                  onClick={() => removeSection(sectionIndex)}
                  variant="ghost"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              )}
            </div>

            <Input
              value={section.sectionTitle}
              onChange={(e) =>
                updateSection(sectionIndex, "sectionTitle", e.target.value)
              }
              placeholder="Section title *"
            />

            <Input
              value={section.sectionDescription}
              onChange={(e) =>
                updateSection(
                  sectionIndex,
                  "sectionDescription",
                  e.target.value
                )
              }
              placeholder="Section description (optional)"
            />

            {/* Chapters */}
            <div className="space-y-2 ml-4">
              <div className="flex items-center justify-between">
                <Label>Chapters</Label>
                <Button
                  onClick={() => addChapter(sectionIndex)}
                  variant="outline"
                  size="sm"
                >
                  <PlusCircle className="w-3 h-3 mr-1" />
                  Add Chapter
                </Button>
              </div>

              {section.chapters.map((chapter, chapterIndex) => (
                <div
                  key={chapterIndex}
                  className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded"
                >
                  <Input
                    value={chapter.title}
                    onChange={(e) =>
                      updateChapter(
                        sectionIndex,
                        chapterIndex,
                        "title",
                        e.target.value
                      )
                    }
                    placeholder="Chapter title *"
                    className="flex-1"
                  />

                  <Select
                    value={chapter.type}
                    onValueChange={(value: any) =>
                      updateChapter(
                        sectionIndex,
                        chapterIndex,
                        "type",
                        value
                      )
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Text">Text</SelectItem>
                      <SelectItem value="Quiz">Quiz</SelectItem>
                      <SelectItem value="Video">Video</SelectItem>
                    </SelectContent>
                  </Select>

                  {section.chapters.length > 1 && (
                    <Button
                      onClick={() => removeChapter(sectionIndex, chapterIndex)}
                      variant="ghost"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <p className="text-sm text-gray-500">
          Generation typically takes 2-5 minutes depending on course size
        </p>
        <div className="flex gap-2">
          <Button onClick={onClose} variant="outline" disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Content
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIContentWizard;
