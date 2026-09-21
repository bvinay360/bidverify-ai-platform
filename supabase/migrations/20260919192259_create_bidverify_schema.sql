/*
# BidVerify AI - Core Schema

Creates the full table set for the BidVerify AI compliance verification platform:
- profiles (extends Supabase auth.users with role, org, phone)
- tenders (procurement tenders posted by buyers)
- bids (seller submissions against tenders, with compliance score + risk)
- documents (uploaded bid documents with OCR data + verification status)
- compliance_reports (generated AI reports per bid)
- audit_logs (action tracking)

## Security
- RLS enabled on all tables.
- profiles: each user reads/updates own row; admins read all.
- tenders: buyers CRUD own; sellers + buyers read all.
- bids: sellers CRUD own; buyers read/update bids on their tenders.
- documents: read by bid owner or tender buyer; insert by bid owner.
- compliance_reports: read by bid owner or tender buyer.
- audit_logs: insert by any authenticated; read own or admin.
*/

-- ===== PROFILES =====
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text,
  organization text,
  phone text,
  role text NOT NULL DEFAULT 'BUYER' CHECK (role IN ('BUYER','SELLER','ADMIN')),
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON profiles;
CREATE POLICY "profiles_select_own_or_admin" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN'));

DROP POLICY IF EXISTS "profiles_insert_self" ON profiles;
CREATE POLICY "profiles_insert_self" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_self" ON profiles;
CREATE POLICY "profiles_update_self" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ===== TENDERS =====
CREATE TABLE IF NOT EXISTS tenders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  budget numeric(14,2) NOT NULL,
  deadline timestamptz NOT NULL,
  required_documents text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','CLOSED','EVALUATION','AWARDED')),
  buyer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenders_select_all" ON tenders;
CREATE POLICY "tenders_select_all" ON tenders FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "tenders_insert_own" ON tenders;
CREATE POLICY "tenders_insert_own" ON tenders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "tenders_update_own" ON tenders;
CREATE POLICY "tenders_update_own" ON tenders FOR UPDATE
  TO authenticated USING (auth.uid() = buyer_id) WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "tenders_delete_own" ON tenders;
CREATE POLICY "tenders_delete_own" ON tenders FOR DELETE
  TO authenticated USING (auth.uid() = buyer_id);

-- ===== BIDS =====
CREATE TABLE IF NOT EXISTS bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id uuid NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  compliance_score integer CHECK (compliance_score >= 0 AND compliance_score <= 100),
  risk_level text CHECK (risk_level IN ('LOW','MEDIUM','HIGH')),
  status text NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED')),
  submitted_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bids_select_owner_or_buyer" ON bids;
CREATE POLICY "bids_select_owner_or_buyer" ON bids FOR SELECT
  TO authenticated USING (
    auth.uid() = seller_id
    OR EXISTS (SELECT 1 FROM tenders t WHERE t.id = bids.tender_id AND t.buyer_id = auth.uid())
  );

DROP POLICY IF EXISTS "bids_insert_own" ON bids;
CREATE POLICY "bids_insert_own" ON bids FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "bids_update_own_or_buyer" ON bids;
CREATE POLICY "bids_update_own_or_buyer" ON bids FOR UPDATE
  TO authenticated USING (
    auth.uid() = seller_id
    OR EXISTS (SELECT 1 FROM tenders t WHERE t.id = bids.tender_id AND t.buyer_id = auth.uid())
  ) WITH CHECK (
    auth.uid() = seller_id
    OR EXISTS (SELECT 1 FROM tenders t WHERE t.id = bids.tender_id AND t.buyer_id = auth.uid())
  );

DROP POLICY IF EXISTS "bids_delete_own" ON bids;
CREATE POLICY "bids_delete_own" ON bids FOR DELETE
  TO authenticated USING (auth.uid() = seller_id);

-- ===== DOCUMENTS =====
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id uuid NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('GST_CERTIFICATE','PAN_CARD','UDYAM_REGISTRATION','BIS_CERTIFICATE','TECHNICAL_SPECS','OTHER')),
  file_url text NOT NULL,
  file_name text NOT NULL,
  ocr_data jsonb,
  verification_status text NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING','VERIFIED','WARNING','FAILED')),
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "docs_select_owner_or_buyer" ON documents;
CREATE POLICY "docs_select_owner_or_buyer" ON documents FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM bids b WHERE b.id = documents.bid_id AND b.seller_id = auth.uid())
    OR EXISTS (SELECT 1 FROM bids b JOIN tenders t ON t.id = b.tender_id WHERE b.id = documents.bid_id AND t.buyer_id = auth.uid())
  );

DROP POLICY IF EXISTS "docs_insert_owner" ON documents;
CREATE POLICY "docs_insert_owner" ON documents FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM bids b WHERE b.id = documents.bid_id AND b.seller_id = auth.uid())
  );

DROP POLICY IF EXISTS "docs_update_owner_or_buyer" ON documents;
CREATE POLICY "docs_update_owner_or_buyer" ON documents FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM bids b WHERE b.id = documents.bid_id AND b.seller_id = auth.uid())
    OR EXISTS (SELECT 1 FROM bids b JOIN tenders t ON t.id = b.tender_id WHERE b.id = documents.bid_id AND t.buyer_id = auth.uid())
  );

DROP POLICY IF EXISTS "docs_delete_owner" ON documents;
CREATE POLICY "docs_delete_owner" ON documents FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM bids b WHERE b.id = documents.bid_id AND b.seller_id = auth.uid())
  );

-- ===== COMPLIANCE REPORTS =====
CREATE TABLE IF NOT EXISTS compliance_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id uuid UNIQUE NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
  overall_score integer NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  risk_level text NOT NULL CHECK (risk_level IN ('LOW','MEDIUM','HIGH')),
  findings jsonb NOT NULL DEFAULT '[]',
  generated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_select_owner_or_buyer" ON compliance_reports;
CREATE POLICY "reports_select_owner_or_buyer" ON compliance_reports FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM bids b WHERE b.id = compliance_reports.bid_id AND b.seller_id = auth.uid())
    OR EXISTS (SELECT 1 FROM bids b JOIN tenders t ON t.id = b.tender_id WHERE b.id = compliance_reports.bid_id AND t.buyer_id = auth.uid())
  );

DROP POLICY IF EXISTS "reports_insert_owner_or_buyer" ON compliance_reports;
CREATE POLICY "reports_insert_owner_or_buyer" ON compliance_reports FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM bids b WHERE b.id = compliance_reports.bid_id AND b.seller_id = auth.uid())
    OR EXISTS (SELECT 1 FROM bids b JOIN tenders t ON t.id = b.tender_id WHERE b.id = compliance_reports.bid_id AND t.buyer_id = auth.uid())
  );

DROP POLICY IF EXISTS "reports_update_owner_or_buyer" ON compliance_reports;
CREATE POLICY "reports_update_owner_or_buyer" ON compliance_reports FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM bids b WHERE b.id = compliance_reports.bid_id AND b.seller_id = auth.uid())
    OR EXISTS (SELECT 1 FROM bids b JOIN tenders t ON t.id = b.tender_id WHERE b.id = compliance_reports.bid_id AND t.buyer_id = auth.uid())
  );

-- ===== AUDIT LOGS =====
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  metadata jsonb,
  timestamp timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_insert_any" ON audit_logs;
CREATE POLICY "audit_insert_any" ON audit_logs FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "audit_select_own_or_admin" ON audit_logs;
CREATE POLICY "audit_select_own_or_admin" ON audit_logs FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN')
  );

-- ===== INDEXES =====
CREATE INDEX IF NOT EXISTS idx_tenders_buyer_id ON tenders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_tenders_status ON tenders(status);
CREATE INDEX IF NOT EXISTS idx_bids_tender_id ON bids(tender_id);
CREATE INDEX IF NOT EXISTS idx_bids_seller_id ON bids(seller_id);
CREATE INDEX IF NOT EXISTS idx_documents_bid_id ON documents(bid_id);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_bid_id ON compliance_reports(bid_id);

-- ===== TRIGGER: auto-create profile on signup =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, organization, phone, role, is_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'organization', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'BUYER'),
    false
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();