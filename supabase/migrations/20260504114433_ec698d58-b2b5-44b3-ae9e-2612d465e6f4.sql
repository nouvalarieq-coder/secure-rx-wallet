-- Enum role
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  wallet_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by owner" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profiles updatable by owner" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Profiles insertable by owner" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Medicines
CREATE TABLE public.medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  bpom_number TEXT UNIQUE,
  qr_code TEXT UNIQUE,
  image_url TEXT,
  manufacturer TEXT,
  requires_prescription BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active medicines" ON public.medicines
  FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage medicines" ON public.medicines
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('fiat','crypto')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','success','failed')),
  tx_signature TEXT,
  wallet_address TEXT,
  shipping_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own orders" ON public.orders
  FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Order items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  medicine_id UUID NOT NULL REFERENCES public.medicines(id),
  medicine_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
  );
CREATE POLICY "Insert own order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );

-- Fake drug reports
CREATE TABLE public.fake_drug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  query_value TEXT NOT NULL,
  query_type TEXT NOT NULL CHECK (query_type IN ('qr','bpom')),
  result TEXT NOT NULL CHECK (result IN ('asli','palsu','tidak_ditemukan')),
  medicine_id UUID REFERENCES public.medicines(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fake_drug_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert reports" ON public.fake_drug_reports
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users view own reports, admin all" ON public.fake_drug_reports
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- Trigger handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_medicines_updated BEFORE UPDATE ON public.medicines
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed medicines
INSERT INTO public.medicines (name, description, price, stock, category, bpom_number, qr_code, manufacturer, requires_prescription) VALUES
('Paracetamol 500mg', 'Obat pereda nyeri dan penurun demam. Isi 10 tablet per strip.', 15000, 120, 'Analgesik', 'DBL1234567890A1', 'QR-PARA-500-001', 'Kimia Farma', false),
('Amoxicillin 500mg', 'Antibiotik untuk infeksi bakteri. Hanya dengan resep dokter.', 45000, 60, 'Antibiotik', 'DKL9876543210B2', 'QR-AMOX-500-002', 'Kalbe Farma', true),
('Vitamin C 1000mg', 'Suplemen daya tahan tubuh. 30 tablet effervescent.', 75000, 200, 'Vitamin', 'POM1122334455C3', 'QR-VITC-1K-003', 'Sido Muncul', false),
('OBH Combi Batuk Berdahak', 'Sirup pereda batuk berdahak 100ml.', 28000, 85, 'Obat Batuk', 'DBL5566778899D4', 'QR-OBH-100-004', 'Combiphar', false),
('Antasida DOEN', 'Mengatasi sakit maag dan asam lambung berlebih.', 12000, 150, 'Lambung', 'GBL2233445566E5', 'QR-ANTA-DOEN-005', 'Indofarma', false),
('Loratadine 10mg', 'Antihistamin untuk alergi. 10 tablet per strip.', 32000, 70, 'Alergi', 'DBL7788990011F6', 'QR-LORA-10-006', 'Dexa Medica', false),
('Insulin Pen Novorapid', 'Insulin untuk penderita diabetes. Resep dokter.', 185000, 25, 'Diabetes', 'DKI3344556677G7', 'QR-INSU-NOV-007', 'Novo Nordisk', true),
('Multivitamin Anak Sirup', 'Vitamin lengkap untuk anak rasa jeruk 60ml.', 42000, 95, 'Vitamin', 'POM4455667788H8', 'QR-MVA-60-008', 'Sanbe Farma', false);