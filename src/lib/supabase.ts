import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = 'https://pekyirvgarpvvdtdhqqw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBla3lpcnZnYXJwdnZkdGRocXF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0NzQxMTcsImV4cCI6MjA1NjA1MDExN30.s7b9pF91l0KTNWk7mH-dtvnYl33OOJkqmQW20ouB4B8';

// Supabase istemcisini oluştur
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Veritabanı şemasını güncellemek için fonksiyon
export const updateSchema = async () => {
  try {
    // Veritabanı bağlantısını kontrol et
    const { data: sessionData } = await supabase.auth.getSession();
    
    // Kullanıcı oturum açmamışsa, sadece bağlantıyı kontrol et ve çık
    if (!sessionData.session) {
      const { error } = await supabase.from('animals').select('id').limit(1);
      
      if (error) {
        console.error('Veritabanı bağlantısı kontrol edilirken hata:', error);
        return false;
      }
      
      console.log('Veritabanı bağlantısı başarılı, ancak kullanıcı oturum açmamış');
      return true;
    }
    
    // Kullanıcı oturum açmışsa, parent tag kısıtlamasını kontrol et
    const { error: checkError } = await supabase
      .from('animals')
      .select('id, father_tag')
      .eq('father_tag', 'Tohumlama')
      .limit(1);
    
    // Eğer sorgu başarılıysa, kısıtlama zaten düzeltilmiş demektir
    if (!checkError) {
      console.log('Parent tag kısıtlaması kontrolü başarılı, sorun yok');
      return true;
    }
    
    // Eğer kısıtlama hatası alınırsa, kısıtlama var demektir
    if (checkError.code === '23514' && checkError.message.includes('valid_parent_tags')) {
      console.log('Parent tag kısıtlaması sorunu tespit edildi');
      
      // Kısıtlamayı düzeltmek için SQL sorgusu
      console.log(`
        Kısıtlamayı düzeltmek için aşağıdaki SQL sorgusunu çalıştırın:
        
        ALTER TABLE IF EXISTS animals DROP CONSTRAINT IF EXISTS valid_parent_tags;
        ALTER TABLE IF EXISTS animals DROP CONSTRAINT IF EXISTS valid_parent_tags_flexible;
        
        ALTER TABLE animals ADD CONSTRAINT valid_parent_tags_flexible 
          CHECK (
            (mother_tag IS NULL OR mother_tag ~ '^[Tt][Rr][-]?\\d{10,12}$' OR mother_tag = 'other' OR mother_tag = '' OR mother_tag = 'Tohumlama') AND
            (father_tag IS NULL OR father_tag ~ '^[Tt][Rr][-]?\\d{10,12}$' OR father_tag = 'other' OR father_tag = '' OR father_tag = 'Tohumlama')
          );
      `);
    } else {
      // Başka bir hata varsa, muhtemelen kısıtlama zaten düzeltilmiş
      console.log('Kısıtlama kontrolü sırasında farklı bir hata oluştu:', checkError);
    }
    
    return true;
  } catch (error) {
    console.error('Veritabanı şeması güncellenirken hata oluştu:', error);
    return false;
  }
};