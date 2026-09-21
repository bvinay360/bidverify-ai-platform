export type Role = 'BUYER' | 'SELLER' | 'ADMIN';
export type TenderStatus = 'ACTIVE' | 'CLOSED' | 'EVALUATION' | 'AWARDED';
export type BidStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type DocType = 'GST_CERTIFICATE' | 'PAN_CARD' | 'UDYAM_REGISTRATION' | 'BIS_CERTIFICATE' | 'TECHNICAL_SPECS' | 'OTHER';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'WARNING' | 'FAILED';

export type Profile = {
  id: string;
  email: string;
  name: string | null;
  organization: string | null;
  phone: string | null;
  role: Role;
  is_verified: boolean;
  created_at: string;
};

export type Tender = {
  id: string;
  tender_id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  deadline: string;
  required_documents: DocType[];
  status: TenderStatus;
  buyer_id: string;
  created_at: string;
  buyer?: Profile;
  bid_count?: number;
};

export type Bid = {
  id: string;
  tender_id: string;
  seller_id: string;
  compliance_score: number | null;
  risk_level: RiskLevel | null;
  status: BidStatus;
  submitted_at: string;
  tender?: Tender;
  seller?: Profile;
  documents?: Document[];
  report?: ComplianceReport;
};

export type Document = {
  id: string;
  bid_id: string;
  type: DocType;
  file_url: string;
  file_name: string;
  ocr_data: Record<string, string> | null;
  verification_status: VerificationStatus;
  verified_at: string | null;
  created_at: string;
};

export type ComplianceReport = {
  id: string;
  bid_id: string;
  overall_score: number;
  risk_level: RiskLevel;
  findings: Finding[];
  generated_at: string;
};

export type Finding = {
  type: string;
  status: 'passed' | 'warning' | 'failed' | 'info';
  message: string;
  severity: 'info' | 'warning' | 'error';
};

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  GST_CERTIFICATE: 'GST Certificate',
  PAN_CARD: 'PAN Card',
  UDYAM_REGISTRATION: 'Udyam Registration',
  BIS_CERTIFICATE: 'BIS Certificate',
  TECHNICAL_SPECS: 'Technical Specs',
  OTHER: 'Other',
};

export const DOC_TYPE_SHORT: Record<DocType, string> = {
  GST_CERTIFICATE: 'GST',
  PAN_CARD: 'PAN',
  UDYAM_REGISTRATION: 'Udyam',
  BIS_CERTIFICATE: 'BIS',
  TECHNICAL_SPECS: 'Tech',
  OTHER: 'Other',
};

export const TENDER_STATUS_LABELS: Record<TenderStatus, string> = {
  ACTIVE: 'Active',
  CLOSED: 'Closed',
  EVALUATION: 'Evaluation',
  AWARDED: 'Awarded',
};

export const BID_STATUS_LABELS: Record<BidStatus, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  LOW: 'Low Risk',
  MEDIUM: 'Medium Risk',
  HIGH: 'High Risk',
};

export const CATEGORIES = [
  'IT Equipment',
  'Office Supplies',
  'Services',
  'Medical Equipment',
  'Construction',
  'Consulting',
  'Furniture',
  'Security',
];

export const ALL_DOC_TYPES: DocType[] = [
  'GST_CERTIFICATE',
  'PAN_CARD',
  'UDYAM_REGISTRATION',
  'BIS_CERTIFICATE',
  'TECHNICAL_SPECS',
  'OTHER',
];
