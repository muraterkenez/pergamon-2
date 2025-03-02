/*
  # Küpe Numarası Format Güncellemesi

  1. Değişiklikler
    - Küpe numarası formatı daha esnek hale getirildi
    - TR veya tr ile başlayabilir
    - 10-12 rakam içerebilir
    - Tire (-) içerebilir

  2. Güvenlik
    - Mevcut RLS politikaları korundu
*/

-- Geçici olarak kısıtlamayı kaldır
ALTER TABLE animals DROP CONSTRAINT IF EXISTS valid_tag_number;

-- Yeni, daha esnek kısıtlamayı ekle
ALTER TABLE animals ADD CONSTRAINT valid_tag_number 
  CHECK (tag_number ~ '^[Tt][Rr][-]?\d{10,12}$');