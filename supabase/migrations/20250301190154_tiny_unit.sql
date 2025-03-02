/*
  # Eksik tabloları ve kullanıcı oluşturma trigger'ını oluştur

  1. Yeni Tablolar
    - `profiles` - Kullanıcı profil bilgileri
    - `farms` - Çiftlik detayları
    - `notification_settings` - Kullanıcı bildirim tercihleri
  2. Güvenlik
    - Tüm tablolarda RLS etkinleştir
    - Kimlik doğrulaması yapılmış kullanıcılar için politikalar ekle
  3. Trigger'lar
    - Yeni kullanıcılar için otomatik olarak varsayılan kayıtlar oluşturacak trigger'lar ekle
*/

-- Profil tablosu
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Çiftlik bilgileri tablosu
CREATE TABLE IF NOT EXISTS farms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  address text,
  size decimal(10,2),
  type text CHECK (type IN ('dairy', 'meat', 'mixed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bildirim ayarları tablosu
CREATE TABLE IF NOT EXISTS notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled boolean DEFAULT true,
  health_alerts boolean DEFAULT true,
  financial_reports boolean DEFAULT true,
  milk_production_alerts boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- İndeksler
CREATE UNIQUE INDEX IF NOT EXISTS farms_user_id_idx ON farms (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS notification_settings_user_id_idx ON notification_settings (user_id);

-- RLS Etkinleştirme
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS Politikaları: Profiller
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Politikaları: Çiftlikler
CREATE POLICY "Users can view their own farms"
  ON farms FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own farms"
  ON farms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own farms"
  ON farms FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own farms"
  ON farms FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Politikaları: Bildirim Ayarları
CREATE POLICY "Users can view their own notification settings"
  ON notification_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings"
  ON notification_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings"
  ON notification_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification settings"
  ON notification_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Yeni kullanıcı oluşturma işlemini yönetecek fonksiyon
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Yeni kullanıcı için profil oluştur
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  
  -- Varsayılan çiftlik kaydı oluştur
  INSERT INTO public.farms (user_id, type)
  VALUES (NEW.id, 'dairy');
  
  -- Varsayılan bildirim ayarları oluştur
  INSERT INTO public.notification_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Yeni kullanıcılar için otomatik olarak profil, çiftlik ve bildirim ayarları oluşturacak trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Mevcut kullanıcılar için varsayılan kayıtlar oluştur
DO $$
DECLARE
  user_rec RECORD;
BEGIN
  FOR user_rec IN SELECT id FROM auth.users WHERE id NOT IN (SELECT id FROM profiles)
  LOOP
    -- Profil yoksa oluştur
    INSERT INTO profiles (id)
    VALUES (user_rec.id)
    ON CONFLICT (id) DO NOTHING;
    
    -- Çiftlik yoksa oluştur
    IF NOT EXISTS (SELECT 1 FROM farms WHERE user_id = user_rec.id) THEN
      INSERT INTO farms (user_id, type)
      VALUES (user_rec.id, 'dairy');
    END IF;
    
    -- Bildirim ayarları yoksa oluştur
    IF NOT EXISTS (SELECT 1 FROM notification_settings WHERE user_id = user_rec.id) THEN
      INSERT INTO notification_settings (user_id)
      VALUES (user_rec.id);
    END IF;
  END LOOP;
END;
$$;