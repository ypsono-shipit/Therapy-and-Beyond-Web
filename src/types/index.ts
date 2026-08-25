export type UserRole = 'patient' | 'clinician';

export interface Profile {
  id: string;
  role: UserRole;
  email: string;
  name: string;
  avatar_url: string | null;
  onboarding_completed_at: string | null;
}

export type ConsentType =
  | 'checkin_data_sharing'
  | 'ai_transcription'
  | 'privacy_policy'
  | 'sensitive_data_processing'
  | 'dpa_acceptance';

export interface Consent {
  consent_type: ConsentType;
  granted: boolean;
  policy_version: string;
}

export interface PatientDemographics {
  pronouns: string;
  occupation: string;
  maritalStatus: string;
  phone: string;
  emergencyContact: string;
}

export interface Patient {
  id: string;
  clinician_id: string;
  name: string;
  email: string;
  avatar: string;
  age: number;
  gender: string;
  demographics: PatientDemographics;
  streakDays: number;
  lastCheckInDate: string;
}

export interface CheckIn {
  id: string;
  patient_id: string;
  mood: number;
  anxiety: number;
  energy: number;
  sleepDuration: number;
  sleepQuality: 'Poor' | 'Fair' | 'Good' | 'Excellent';
  medicationTaken: boolean;
  significantEvent: string;
  notes: string;
  timestamp: string;
  source: 'patient' | 'voice_journal';
}

export interface VoiceJournal {
  id: string;
  patient_id: string;
  transcript: string;
  audioDuration: string;
  timestamp: string;
}

export interface Insight {
  id: string;
  patient_id: string;
  summary: string;
  themes: { name: string; percentage: number }[];
  recommendations: string[];
  suggestedDiscussionTopics: string[];
  lastUpdated: string;
}

export interface Session {
  id: string;
  patient_id: string;
  clinician_id: string;
  date: string;
  time: string;
  notes: string;
  status: 'scheduled' | 'completed' | 'canceled';
  type: 'In-Hand' | 'Telehealth';
}

export interface Message {
  id: string;
  patient_id: string;
  sender: 'patient' | 'clinician';
  text: string;
  timestamp: string;
  isCompletedExercise?: boolean;
}

export type AlertSeverity = 'low' | 'medium' | 'high';

export interface Alert {
  id: string;
  patient_id: string;
  patientName: string;
  type: 'mood_drop' | 'missed_med' | 'anxiety_spike' | 'missed_checkin' | 'ai_chat_flag';
  message: string;
  severity: AlertSeverity;
  timestamp: string;
  resolved: boolean;
}

export interface AIChatMessage {
  id: string;
  patient_id: string;
  role: 'user' | 'assistant';
  content: string;
  flagged: boolean;
  flagReason: string | null;
  timestamp: string;
}

export interface AIChatSummary {
  id: string;
  patient_id: string;
  summary: string;
  keyPoints: string[];
  concerns: string[];
  lastUpdated: string;
}

export const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200';

export const FALLBACK_CLINICIAN_AVATAR =
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200';
