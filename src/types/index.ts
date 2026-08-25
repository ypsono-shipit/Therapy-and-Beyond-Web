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
  clinician_id: string | null;
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
  appetite?: number | null;
  functioning?: number | null;
  copingUsed?: string[];
  wins?: string;
  stressors?: string;
  cyclePhase?: string;
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

export type AlertSeverity = 'low' | 'medium' | 'moderate' | 'high' | 'urgent';

export type AlertType =
  | 'mood_drop'
  | 'missed_med'
  | 'anxiety_spike'
  | 'missed_checkin'
  | 'ai_chat_flag'
  | 'risk_warning'
  | 'sleep_mood'
  | 'work_stress'
  | 'isolation'
  | 'med_pattern';

export interface Alert {
  id: string;
  patient_id: string;
  patientName: string;
  type: AlertType;
  message: string;
  severity: AlertSeverity;
  timestamp: string;
  resolved: boolean;
  clinicianRating?: number | null;
  clinicianFeedback?: string | null;
  dismissedAsNoise?: boolean;
}

export interface EmergencyContact {
  id: string;
  patient_id: string;
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
}

export interface SafetyPlan {
  id: string;
  patient_id: string;
  warningSigns: string[];
  internalCoping: string[];
  peopleAndPlaces: string[];
  professionalHelp: string[];
  makeEnvironmentSafe: string[];
  reasonsForLiving: string[];
  updatedAt: string;
}

export type CopingKind = 'grounding' | 'breathing' | 'crisis_plan' | 'playlist' | 'affirmation' | 'distraction' | 'custom';

export interface CopingItem {
  id: string;
  patient_id: string;
  kind: CopingKind;
  title: string;
  body: string;
  url: string | null;
  isPreset: boolean;
}

export interface HelpfulStrategy {
  id: string;
  patient_id: string;
  strategy: string;
  source: string;
  timesUsed: number;
  lastUsedAt: string;
}

export interface ReminderPrefs {
  patient_id: string;
  groundingCadence: 'daily' | 'weekly' | 'biweekly' | 'off';
  setBy: 'patient' | 'clinician';
}

export interface LifeEvent {
  id: string;
  patient_id: string;
  label: string;
  occurredOn: string;
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
