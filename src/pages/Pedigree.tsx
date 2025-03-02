import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Printer, 
  Download, 
  Award, 
  Calendar, 
  Dna, 
  Droplet, 
  Milk, 
  Scale, 
  Star, 
  Clipboard, 
  FileText 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format, parseISO, differenceInMonths } from 'date-fns';
import { tr } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface PedigreeAnimal {
  id: string;
  tag_number: string;
  name: string | null;
  birth_date: string;
  gender: string;
  breed: string;
  color: string;
  mother_tag: string | null;
  father_tag: string | null;
}

export function Pedigree() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [animal, setAnimal] = useState<PedigreeAnimal | null>(null);
  const [mother, setMother] = useState<PedigreeAnimal | null>(null);
  const [father, setFather] = useState<PedigreeAnimal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pedigreeCertificateRef = useRef<HTMLDivElement>(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [isInsemination, setIsInsemination] = useState(false);

  useEffect(() => {
    fetchAnimalData();
  }, [id]);

  const fetchAnimalData = async () => {
    try {
      setLoading(true);
      if (!id) return;

      // Fetch the main animal
      const { data: animalData, error: animalError } = await supabase
        .from('animals')
        .select('*')
        .eq('id', id)
        .single();

      if (animalError) throw animalError;
      setAnimal(animalData);

      // Check if father is "Tohumlama"
      if (animalData.father_tag === 'Tohumlama') {
        setIsInsemination(true);
      } else {
        setIsInsemination(false);
      }

      // Fetch parents if available
      if (animalData.mother_tag && animalData.mother_tag !== 'Tohumlama') {
        const { data: motherData } = await supabase
          .from('animals')
          .select('*')
          .eq('tag_number', animalData.mother_tag)
          .single();
        
        setMother(motherData || null);
      }

      if (animalData.father_tag && animalData.father_tag !== 'Tohumlama') {
        const { data: fatherData } = await supabase
          .from('animals')
          .select('*')
          .eq('tag_number', animalData.father_tag)
          .single();
        
        setFather(fatherData || null);
      }
    } catch (err) {
      console.error('Error fetching animal data:', err);
      setError('Hayvan bilgileri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!pedigreeCertificateRef.current) return;
    
    try {
      setIsPdfGenerating(true);
      
      // Geçici olarak yazdırma sınıflarını ekle
      pedigreeCertificateRef.current.classList.add('print-mode');
      
      // Performans ve belgeler bölümlerini geçici olarak gizle
      const performanceSection = document.querySelector('.performance-section');
      const documentsSection = document.querySelector('.documents-section');
      
      if (performanceSection) performanceSection.classList.add('hidden');
      if (documentsSection) documentsSection.classList.add('hidden');
      
      const canvas = await html2canvas(pedigreeCertificateRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
      });
      
      // Yazdırma sınıflarını kaldır ve gizlenen bölümleri geri göster
      pedigreeCertificateRef.current.classList.remove('print-mode');
      if (performanceSection) performanceSection.classList.remove('hidden');
      if (documentsSection) documentsSection.classList.remove('hidden');
      
      const imgData = canvas.toDataURL('image/png');
      
      // A4 boyutunda PDF oluştur
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Canvas oranını koru
      const canvasRatio = canvas.height / canvas.width;
      const imgWidth = pdfWidth - 20; // Kenar boşlukları için
      const imgHeight = imgWidth * canvasRatio;
      
      // Görüntüyü PDF'e ekle
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      
      // PDF'i indir
      pdf.save(`pedigree_${animal?.tag_number.replace(/[^0-9]/g, '')}.pdf`);
    } catch (err) {
      console.error('PDF oluşturulurken hata oluştu:', err);
      alert('PDF oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handleBack = () => {
    navigate('/animals');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !animal) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Bir hata oluştu</h3>
        <p className="text-gray-600 mt-2">{error || 'Hayvan bulunamadı'}</p>
        <button
          onClick={handleBack}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ChevronLeft className="h-5 w-5 mr-2" />
          Geri Dön
        </button>
      </div>
    );
  }

  const ageInMonths = differenceInMonths(new Date(), parseISO(animal.birth_date));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pedigree</h1>
            <p className="text-gray-600">
              {animal.tag_number} {animal.name && `(${animal.name})`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 no-print">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Printer className="h-5 w-5" />
            Yazdır
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isPdfGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-5 w-5" />
            {isPdfGenerating ? 'PDF Hazırlanıyor...' : 'PDF İndir'}
          </button>
        </div>
      </div>

      {/* Pedigree Certificate */}
      <div className="bg-white rounded-lg shadow print-container" ref={pedigreeCertificateRef}>
        {/* Certificate Header */}
        <div className="bg-blue-600 text-white p-6 rounded-t-lg print-header">
          <div className="text-center">
            <h2 className="text-3xl font-bold print-certificate-title">Pedigree Sertifikası</h2>
            <p className="mt-2 text-lg">Türkiye Cumhuriyeti Tarım ve Orman Bakanlığı</p>
          </div>
        </div>

        {/* Animal Information */}
        <div className="p-6 print-content">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 border-b pb-2">Hayvan Bilgileri</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Küpe Numarası:</span>
                  <span className="font-medium">{animal.tag_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">İsim:</span>
                  <span className="font-medium">{animal.name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Doğum Tarihi:</span>
                  <span className="font-medium">
                    {format(parseISO(animal.birth_date), 'd MMMM yyyy', { locale: tr })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Yaş:</span>
                  <span className="font-medium">
                    {ageInMonths} ay
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cinsiyet:</span>
                  <span className="font-medium">
                    {animal.gender === 'male' ? 'Erkek' : 'Dişi'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Irk:</span>
                  <span className="font-medium">{animal.breed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Renk:</span>
                  <span className="font-medium">{animal.color}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4 border-b pb-2">Ebeveyn Bilgileri</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium mb-2">Anne</h4>
                  {mother ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Küpe Numarası:</span>
                        <span className="font-medium">{mother.tag_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">İsim:</span>
                        <span className="font-medium">{mother.name || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Irk:</span>
                        <span className="font-medium">{mother.breed}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Anne bilgisi mevcut değil</p>
                  )}
                </div>

                <div>
                  <h4 className="text-lg font-medium mb-2">Baba</h4>
                  {isInsemination ? (
                    <div className="bg-blue-50 p-3 rounded-md">
                      <p className="text-blue-700 font-medium">Tohumlama</p>
                      <p className="text-sm text-blue-600 mt-1">
                        Bu hayvan suni tohumlama yöntemiyle dünyaya gelmiştir.
                      </p>
                    </div>
                  ) : father ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Küpe Numarası:</span>
                        <span className="font-medium">{father.tag_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">İsim:</span>
                        <span className="font-medium">{father.name || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Irk:</span>
                        <span className="font-medium">{father.breed}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Baba bilgisi mevcut değil</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Pedigree Tree */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 border-b pb-2">Soy Ağacı</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print-pedigree-tree">
              <div>
                <h4 className="text-lg font-medium mb-3">Anne Tarafı</h4>
                <div className="border rounded-lg p-4 bg-purple-50 print-purple-bg print-pedigree-box">
                  <p className="font-semibold print-pedigree-parent">
                    {mother ? `${mother.tag_number} ${mother.name ? `(${mother.name})` : ''}` : 'Bilinmiyor'}
                  </p>
                  {mother && (
                    <div className="text-sm text-gray-600 print-pedigree-info">
                      <p>Irk: {mother.breed}</p>
                      <p>Doğum: {format(parseISO(mother.birth_date), 'd MMMM yyyy', { locale: tr })}</p>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="border rounded-lg p-3 bg-purple-50 print-purple-bg print-pedigree-box">
                    <p className="font-medium text-sm print-pedigree-grandparent">Anne'nin Annesi</p>
                    <p className="text-xs text-gray-500 print-pedigree-info">Bilgi mevcut değil</p>
                  </div>
                  <div className="border rounded-lg p-3 bg-purple-50 print-purple-bg print-pedigree-box">
                    <p className="font-medium text-sm print-pedigree-grandparent">Anne'nin Babası</p>
                    <p className="text-xs text-gray-500 print-pedigree-info">Bilgi mevcut değil</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-medium mb-3">Baba Tarafı</h4>
                <div className="border rounded-lg p-4 bg-blue-50 print-blue-bg print-pedigree-box">
                  {isInsemination ? (
                    <div>
                      <p className="font-semibold print-pedigree-parent">Tohumlama</p>
                      <p className="text-sm text-gray-600 print-pedigree-info">
                        Suni tohumlama yöntemiyle dünyaya gelmiştir.
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="font-semibold print-pedigree-parent">
                        {father ? `${father.tag_number} ${father.name ? `(${father.name})` : ''}` : 'Bilinmiyor'}
                      </p>
                      {father && (
                        <div className="text-sm text-gray-600 print-pedigree-info">
                          <p>Irk: {father.breed}</p>
                          <p>Doğum: {format(parseISO(father.birth_date), 'd MMMM yyyy', { locale: tr })}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                {!isInsemination && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="border rounded-lg p-3 bg-blue-50 print-blue-bg print-pedigree-box">
                      <p className="font-medium text-sm print-pedigree-grandparent">Baba'nın Annesi</p>
                      <p className="text-xs text-gray-500 print-pedigree-info">Bilgi mevcut değil</p>
                    </div>
                    <div className="border rounded-lg p-3 bg-blue-50 print-blue-bg print-pedigree-box">
                      <p className="font-medium text-sm print-pedigree-grandparent">Baba'nın Babası</p>
                      <p className="text-xs text-gray-500 print-pedigree-info">Bilgi mevcut değil</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Genetic Traits */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 border-b pb-2">Genetik Özellikler</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <Dna className="h-5 w-5 text-indigo-600" />
                  Genetik Değerler
                </h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Süt Verimi</span>
                      <span className="text-sm text-gray-500">85%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Süt Yağ Oranı</span>
                      <span className="text-sm text-gray-500">72%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: '72%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Süt Protein Oranı</span>
                      <span className="text-sm text-gray-500">68%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '68%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Doğurganlık</span>
                      <span className="text-sm text-gray-500">78%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <Scale className="h-5 w-5 text-green-600" />
                  Fiziksel Özellikler
                </h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Vücut Yapısı</span>
                      <span className="text-sm text-gray-500">90%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '90%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Meme Yapısı</span>
                      <span className="text-sm text-gray-500">82%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '82%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Ayak ve Bacak Yapısı</span>
                      <span className="text-sm text-gray-500">75%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Genel Görünüm</span>
                      <span className="text-sm text-gray-500">88%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: '88%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Certification */}
          <div className="border-t pt-6 mt-8">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Sertifika No: PED-{animal.tag_number.replace(/[^0-9]/g, '')}</p>
                <p className="text-sm text-gray-600">Düzenleme Tarihi: {format(new Date(), 'd MMMM yyyy', { locale: tr })}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Onaylayan</p>
                <p className="text-sm text-gray-600">Dr. Ahmet Yılmaz</p>
                <p className="text-sm text-gray-600">Veteriner Hekim</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer for print */}
        <div className="hidden print-footer">
          <p>Bu belge {format(new Date(), 'd MMMM yyyy', { locale: tr })} tarihinde oluşturulmuştur.</p>
          <p>Çiftlik Yönetim Sistemi tarafından üretilmiştir.</p>
        </div>
      </div>

      {/* Performance Section */}
      <div className="bg-white rounded-lg shadow p-6 performance-section">
        <h3 className="text-xl font-semibold mb-4 border-b pb-2">Performans Verileri</h3>
        
        {animal.gender === 'female' && (
          <div className="mb-6">
            <h4 className="text-lg font-medium mb-3 flex items-center gap-2">
              <Milk className="h-5 w-5 text-blue-600" />
              Süt Üretim Performansı
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Laktasyon</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Süre (Gün)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Toplam Üretim (L)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Günlük Ortalama (L)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yağ (%)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Protein (%)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">305</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">8,750</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">28.7</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">3.8</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">3.2</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">298</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">9,120</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">30.6</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">3.9</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">3.3</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        <div className="mb-6">
          <h4 className="text-lg font-medium mb-3 flex items-center gap-2">
            <Scale className="h-5 w-5 text-green-600" />
            Büyüme Performansı
          </h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yaş</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ağırlık (kg)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yükseklik (cm)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Günlük Artış (g)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Doğum</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">42</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">75</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">-</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">6 Ay</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">185</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">110</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">795</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">12 Ay</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">320</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">125</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">745</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {animal.gender === 'female' && (
          <div>
            <h4 className="text-lg font-medium mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Üreme Performansı
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doğum No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doğum Tarihi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buzağı Cinsiyeti</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buzağı Ağırlığı</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gebelik Süresi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doğum Kolaylığı</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">15 Mart 2023</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Erkek</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">42 kg</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">278 gün</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Normal</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Documents Section */}
      <div className="bg-white rounded-lg shadow p-6 documents-section">
        <h3 className="text-xl font-semibold mb-4 border-b pb-2">Belgeler ve Sertifikalar</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <h4 className="text-lg font-medium mb-3 flex items-center gap-2">
              <Clipboard className="h-5 w-5 text-blue-600" />
              Kimlik Belgesi
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Belge No:</span>
                <span className="font-medium">ID-{animal.tag_number.replace(/[^0-9]/g, '')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Düzenleme Tarihi:</span>
                <span className="font-medium">10 Ocak 2022</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Düzenleyen Kurum:</span>
                <span className="font-medium">Tarım ve Orman Bakanlığı</span>
              </div>
              <div className="mt-4">
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium no-print">
                  Belgeyi Görüntüle
                </button>
              </div>
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <h4 className="text-lg font-medium mb-3 flex items-center gap-2">
              <Award className="h-5 w-5 text-green-600" />
              Irk Sertifikası
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Sertifika No:</span>
                <span className="font-medium">RC-{animal.tag_number.replace(/[^0-9]/g, '')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Düzenleme Tarihi:</span>
                <span className="font-medium">15 Ocak 2022</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Düzenleyen Kurum:</span>
                <span className="font-medium">Damızlık Sığır Yetiştiricileri Birliği</span>
              </div>
              <div className="mt-4">
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium no-print">
                  Belgeyi Görüntüle
                </button>
              </div>
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <h4 className="text-lg font-medium mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Sağlık Sertifikası
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Sertifika No:</span>
                <span className="font-medium">HC-{animal.tag_number.replace(/[^0-9]/g, '')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Düzenleme Tarihi:</span>
                <span className="font-medium">20 Ocak 2022</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Düzenleyen:</span>
                <span className="font-medium">Dr. Ahmet Yılmaz</span>
              </div>
              <div className="mt-4">
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium no-print">
                  Belgeyi Görüntüle
                </button>
              </div>
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <h4 className="text-lg font-medium mb-3 flex items-center gap-2">
              <Dna className="h-5 w-5 text-red-600" />
              DNA Testi Raporu
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Rapor No:</span>
                <span className="font-medium">DNA-{animal.tag_number.replace(/[^0-9]/g, '')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Test Tarihi:</span>
                <span className="font-medium">5 Şubat 2022</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Laboratuvar:</span>
                <span className="font-medium">Merkez Hayvancılık Araştırma Enstitüsü</span>
              </div>
              <div className="mt-4">
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium no-print">
                  Raporu Görüntüle
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}