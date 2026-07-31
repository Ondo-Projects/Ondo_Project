export type SuggestionCategory = 'BUG' | 'FEATURE' | 'OPERATION' | 'OTHER';

export type SuggestionStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';

export interface SuggestionPost {
  id: number;
  category: SuggestionCategory;
  title: string;
  content: string;
  status: SuggestionStatus;
  authorUsername: string;
  authorName: string;
  authorRole: string;
  adminReply?: string | null;
  repliedAt?: string | null;
  repliedByUsername?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SuggestionCreateRequest {
  category: SuggestionCategory;
  title: string;
  content: string;
}

export interface SuggestionUpdateRequest {
  category: SuggestionCategory;
  title: string;
  content: string;
}

export interface SuggestionDeleteResponse {
  message: string;
}
