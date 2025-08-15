export interface Organization {
  id: string;
  name: string;
  size_category?: string;
  industry?: string;
  membership_start_date?: string;
  created_at: string;
}
export interface Member {
  id: string;
  email: string;
  name?: string;
  role?: string;
  preferences?: Record<string, any>;
  organization_id?: string;
  created_at: string;
  organization?: Organization;
}
export interface Survey {
  id: string;
  title: string;
  description?: string;
  config: SurveyConfig;
  version?: string;
  status: "draft" | "published" | "closed";
  created_by_id?: string;
  created_at: string;
  published_at?: string;
  closed_at?: string;
  responseCount?: number;
}
export interface SurveyResponse {
  id: string;
  survey_id: string;
  member_id?: string;
  organization_id?: string;
  answers: Record<string, any>;
  time_spent_seconds?: number;
  started_at: string;
  completed_at?: string;
  impact_score?: number;
  meta?: Record<string, any>;
}
export interface SurveyConfig {
  questions: Question[];
  estimatedTime?: number;
  settings?: {
    allowAnonymous?: boolean;
    multipleSubmissions?: boolean;
    showProgressBar?: boolean;
  };
}
export interface Question {
  id: string;
  type:
    | "text"
    | "textarea"
    | "radio"
    | "checkbox"
    | "select"
    | "scale"
    | "date";
  title: string;
  description?: string;
  required?: boolean;
  options?: QuestionOption[];
  validation?: QuestionValidation;
  conditionalLogic?: ConditionalLogic;
}
export interface QuestionOption {
  value: string;
  label: string;
}
export interface QuestionValidation {
  min?: number;
  max?: number;
  pattern?: string;
  message?: string;
}
export interface ConditionalLogic {
  show: boolean;
  when: string;
  is: string | string[];
}
export interface LoginCredentials {
  username: string;
  password: string;
}
export interface Token {
  access_token: string;
  token_type: string;
}
export interface MemberCreate {
  email: string;
  password: string;
  name?: string;
  role?: string;
  organization_id?: string;
}
export interface SurveyCreate {
  title: string;
  description?: string;
  config: SurveyConfig;
}
export interface SurveyResponseCreate {
  answers: Record<string, any>;
  time_spent_seconds?: number;
}
export interface SurveyAnalytics {
  survey_id: string;
  title: string;
  response_count: number;
}
