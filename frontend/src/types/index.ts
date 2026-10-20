export type TaskState = 
  | 'IDLE' 
  | 'OBSERVING' 
  | 'PROCESSING' 
  | 'WAITING_FOR_USER' 
  | 'PAUSED' 
  | 'INTERRUPTED' 
  | 'COMPLETED' 
  | 'FAILED';

export type VisualCategory = 
  | 'TITLE' 
  | 'SLIDE' 
  | 'DIAGRAM' 
  | 'CODE' 
  | 'TABLE' 
  | 'DEFINITION' 
  | 'EXAMPLE' 
  | 'DEMO' 
  | 'CONFIGURATION' 
  | 'IMPORTANT' 
  | 'LOW_VALUE';

export type TeacherMode = 
  | 'simple' 
  | 'detailed' 
  | 'exam' 
  | 'quick_revision' 
  | 'example' 
  | 'teach_from_scratch' 
  | 'active_recall' 
  | 'flashcards' 
  | 'practice_quiz' 
  | 'weak_areas' 
  | 'compare' 
  | 'ask_anything';

export interface EvidenceItem {
  timestamp: string;
  timestamp_sec?: number;
  frame_id?: string;
  thumbnail_url?: string;
  quote?: string;
  concept_name?: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  mode?: TeacherMode;
  timestamp: number;
  evidence: EvidenceItem[];
  is_pinned?: boolean;
}

export interface Concept {
  id: string;
  session_id: string;
  name: string;
  definition: string;
  simple_explanation?: string;
  deep_explanation?: string;
  evidence_timestamp?: string;
  evidence_frame_id?: string;
  related_concepts: string[];
  exam_importance: 'High' | 'Medium' | 'Low';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  confidence: number;
  is_pinned: boolean;
}

export interface FrameCapture {
  id: string;
  session_id: string;
  timestamp_sec: number;
  timestamp_formatted: string;
  image_path: string;
  thumbnail_path?: string;
  p_hash?: string;
  ocr_text: string;
  visual_description: string;
  category: VisualCategory;
  importance_score: number;
  concepts: string[];
  is_pinned: boolean;
}

export interface TranscriptSegment {
  id: string;
  session_id: string;
  timestamp_start: number;
  timestamp_end: number;
  timestamp_formatted: string;
  speaker?: string;
  text: string;
  confidence: number;
  topic?: string;
  associated_frame_id?: string;
}

export interface QuizQuestion {
  id: string;
  session_id: string;
  question: string;
  options: string[];
  correct_option_index: number;
  concept_tested: string;
  relevant_timestamp?: string;
  explanation: string;
  user_answer_index?: number;
  is_bookmarked?: boolean;
}

export interface LearnerProfile {
  session_id: string;
  concepts_viewed: string[];
  concepts_grasped: string[];
  concepts_struggling: string[];
  questions_asked_count: number;
  pinned_count: number;
  practice_accuracy: number;
  weak_areas: string[];
  notes_summary: string;
}

export interface LearningSession {
  id: string;
  title: string;
  source_platform: string;
  source_url_or_title: string;
  created_at: number;
  updated_at: number;
  duration_sec: number;
  progress_pct: number;
  status: TaskState;
  is_pinned: boolean;
  tags: string[];
  topic_count: number;
  concept_count: number;
  screenshot_count: number;
  question_count: number;
}

export interface SystemStatus {
  ollama_connected: boolean;
  ollama_models: string[];
  whisper_available: boolean;
  ocr_available: boolean;
  active_session_id?: string;
  current_task_state: TaskState;
  system_load: Record<string, any>;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  education_level: string;
  standard_class?: string;
  institution?: string;
  degree_major?: string;
  branch?: string;
  current_year?: string;
  area_of_interest?: string[];
  ultimate_aim?: string;
  focus_topics: string[];
  credits_balance: number;
  total_credits_used: number;
  subscription_tier: 'FREE_TRIAL' | 'PRO_MONTHLY' | 'ANNUAL_PASS';
  payment_status?: 'FREE_TRIAL_ACTIVE' | 'PENDING_APPROVAL' | 'PAID_APPROVED' | 'REJECTED';
  payment_reference?: string;
  is_approved_by_admin?: boolean;
  credentials_sent?: boolean;
  role?: 'STUDENT' | 'ADMIN';
  created_at?: number;
  updated_at?: number;
}

export interface CreditStatus {
  user_id: string;
  credits_balance: number;
  total_credits_used: number;
  subscription_tier: string;
  can_analyze: boolean;
  currency: string;
  monthly_price: number;
  annual_price: number;
}

export interface NicheTopicItem {
  id: string;
  title: string;
  topic: string;
  channel_name?: string;
  target_stream: string;
  source_url: string;
  video_id?: string;
  duration_minutes: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  thumbnail_url: string;
  description: string;
  why_recommended?: string;
}

export interface NicheFeed {
  education_level: string;
  degree_major: string;
  standard_class: string;
  branch?: string;
  current_year?: string;
  ultimate_aim?: string;
  area_of_interest?: string[];
  focus_topics: string[];
  curated_topics: NicheTopicItem[];
}

export interface StudentProgressSummary {
  user_id: string;
  name: string;
  branch: string;
  current_year: string;
  ultimate_aim: string;
  total_study_hours: number;
  total_sessions: number;
  total_concepts_learned: number;
  concepts_grasped: number;
  concepts_struggling: number;
  total_screenshots_captured: number;
  total_transcripts_words: number;
  practice_accuracy_pct: number;
  study_streak_days: number;
  credits_remaining: number;
  subscription_tier: string;
  top_mastered_topics: Array<{ topic: string; mastery_pct: number; concepts_count: number }>;
  recent_activity: Array<{ session_id: string; title: string; platform: string; duration_min: number; timestamp: number }>;
}

export interface AdminStatsResponse {
  total_students: number;
  active_pro_subscribers: number;
  pending_approvals: number;
  total_revenue_inr: number;
  total_lectures_analyzed: number;
  total_ppts_generated: number;
  users_list: UserProfile[];
}

export interface AdminUserActionResponse {
  success: boolean;
  user: UserProfile;
  message: string;
  email_dispatched: boolean;
  dispatched_details?: Record<string, any>;
}


