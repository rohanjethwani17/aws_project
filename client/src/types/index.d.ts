declare global {
  interface Window {
    Clerk?: {
      session?: {
        getToken: () => Promise<string | null>;
      };
    };
  }
  interface PaymentMethod {
    methodId: string;
    type: string;
    lastFour: string;
    expiry: string;
  }

  interface UserSettings {
    theme?: "light" | "dark";
    emailAlerts?: boolean;
    smsAlerts?: boolean;
    courseNotifications?: boolean;
    notificationFrequency?: "immediate" | "daily" | "weekly";
  }

  interface User {
    userId: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    email: string;
    publicMetadata: {
      userType: "teacher" | "student";
    };
    privateMetadata: {
      settings?: UserSettings;
      paymentMethods?: Array<PaymentMethod>;
      defaultPaymentMethodId?: string;
      stripeCustomerId?: string;
    };
    unsafeMetadata: {
      bio?: string;
      urls?: string[];
    };
  }

  interface Course {
    courseId: string;
    teacherId: string;
    teacherName: string;
    title: string;
    description?: string;
    category: string;
    image?: string;
    price?: number; // Stored in cents (e.g., 4999 for $49.99)
    level: "Beginner" | "Intermediate" | "Advanced";
    status: "Draft" | "Published";
    sections: Section[];
    enrollments?: Array<{
      userId: string;
    }>;
    aiGenerated?: boolean;
    generationJobId?: string;
    aiMetadata?: {
      generatedAt: string;
      llmProvider: string;
      apiCallsUsed: number;
      modificationPercentage: number;
    };
  }

  interface Transaction {
    userId: string;
    transactionId: string;
    dateTime: string;
    courseId: string;
    paymentProvider: "stripe";
    paymentMethodId?: string;
    amount: number; // Stored in cents
    savePaymentMethod?: boolean;
  }

  interface DateRange {
    from: string | undefined;
    to: string | undefined;
  }

  interface UserCourseProgress {
    userId: string;
    courseId: string;
    enrollmentDate: string;
    overallProgress: number;
    sections: SectionProgress[];
    lastAccessedTimestamp: string;
  }

  type CreateUserArgs = Omit<User, "userId">;
  type CreateCourseArgs = Omit<Course, "courseId">;
  type CreateTransactionArgs = Omit<Transaction, "transactionId">;

  interface CourseCardProps {
    course: Course;
    onGoToCourse: (course: Course) => void;
  }

  interface TeacherCourseCardProps {
    course: Course;
    onEdit: (course: Course) => void;
    onDelete: (course: Course) => void;
    isOwner: boolean;
  }

  interface Comment {
    commentId: string;
    userId: string;
    text: string;
    timestamp: string;
  }

  interface Chapter {
    chapterId: string;
    title: string;
    content: string;
    video?: string | File;
    freePreview?: boolean;
    type: "Text" | "Quiz" | "Video";
    aiGenerated?: boolean;
    aiMetadata?: {
      generatedAt: string;
      prompt: string;
      modified: boolean;
    };
  }

  interface ChapterProgress {
    chapterId: string;
    completed: boolean;
  }

  interface SectionProgress {
    sectionId: string;
    chapters: ChapterProgress[];
  }

  interface Section {
    sectionId: string;
    sectionTitle: string;
    sectionDescription?: string;
    chapters: Chapter[];
  }

  interface WizardStepperProps {
    currentStep: number;
  }

  interface AccordionSectionsProps {
    sections: Section[];
  }

  interface SearchCourseCardProps {
    course: Course;
    isSelected?: boolean;
    onClick?: () => void;
  }

  interface CoursePreviewProps {
    course: Course;
  }

  interface CustomFixedModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
  }

  interface HeaderProps {
    title: string;
    subtitle: string;
    rightElement?: ReactNode;
  }

  interface SharedNotificationSettingsProps {
    title?: string;
    subtitle?: string;
  }

  interface SelectedCourseProps {
    course: Course;
    handleEnrollNow: (courseId: string) => void;
  }

  interface ToolbarProps {
    onSearch: (search: string) => void;
    onCategoryChange: (category: string) => void;
  }

  interface ChapterModalProps {
    isOpen: boolean;
    onClose: () => void;
    sectionIndex: number | null;
    chapterIndex: number | null;
    sections: Section[];
    setSections: React.Dispatch<React.SetStateAction<Section[]>>;
    courseId: string;
  }

  interface SectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    sectionIndex: number | null;
    sections: Section[];
    setSections: React.Dispatch<React.SetStateAction<Section[]>>;
  }

  interface DroppableComponentProps {
    sections: Section[];
    setSections: (sections: Section[]) => void;
    handleEditSection: (index: number) => void;
    handleDeleteSection: (index: number) => void;
    handleAddChapter: (sectionIndex: number) => void;
    handleEditChapter: (sectionIndex: number, chapterIndex: number) => void;
    handleDeleteChapter: (sectionIndex: number, chapterIndex: number) => void;
  }

  interface CourseFormData {
    courseTitle: string;
    courseDescription: string;
    courseCategory: string;
    coursePrice: string;
    courseStatus: boolean;
  }

  // AI Content Generation Types
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

  interface ContentGenerationJob {
    jobId: string;
    courseId: string;
    instructorId: string;
    status: "pending" | "processing" | "completed" | "failed";
    progress: number;
    outline: CourseOutline;
    options?: GenerationOptions;
    currentSection?: number;
    currentChapter?: number;
    totalSections: number;
    totalChapters: number;
    startedAt: string;
    completedAt?: string;
    error?: string;
    apiCallsUsed: number;
    llmProvider: "gemini" | "huggingface" | "ollama";
  }

  // Recommendation Types
  interface RecommendationReason {
    type: "category_match" | "similar_users" | "trending" | "instructor_match";
    description: string;
    weight: number;
  }

  interface CourseRecommendation {
    course: Course;
    score: number;
    reasons: RecommendationReason[];
  }

  interface RecommendationFeedback {
    feedbackId: string;
    userId: string;
    courseId: string;
    feedback: "positive" | "negative";
    recommendationScore?: number;
    recommendationReasons?: RecommendationReason[];
  }
}

export {};
