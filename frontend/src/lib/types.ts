/**
 * Domain types — mirrored from the NestJS backend's response shapes.
 * Kept narrow on purpose; if a backend field isn't displayed, it isn't here.
 */

export interface Course {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  category: string;
  teacherId: string;
  inviteCode: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Deck {
  id: string;
  courseId: string;
  name: string;
  description: string;
  ownerId: string;
  createdAt: string;
  cardCount?: number;
}

export interface Flashcard {
  id: string;
  deckId: string;
  question: string;
  answer: string;
  hint: string;
  tags: string[];
  createdAt: string;
}

export interface ReviewState {
  id: string;
  userId: string;
  flashcardId: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  dueAt: string;
  lastReviewedAt?: string;
}

export interface NextCardsResponse {
  dueNow: Array<{ card: Flashcard; state: ReviewState }>;
  newCards: Flashcard[];
}

export interface StudyStats {
  totalReviewed: number;
  dueNow: number;
  learning: number;
  mature: number;
}

export interface Note {
  id: string;
  authorId: string;
  courseId?: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}
