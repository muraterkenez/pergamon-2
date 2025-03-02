import React from 'react';
import { Award } from 'lucide-react';

interface PedigreeNode {
  tag_number: string | null;
  name?: string | null;
  pedigree_number?: string | null;
  pedigree_class?: string | null;
  breed?: string | null;
}

interface PedigreeTreeProps {
  animal: PedigreeNode;
  sire: PedigreeNode;
  dam: PedigreeNode;
  grandSirePaternal: PedigreeNode;
  grandDamPaternal: PedigreeNode;
  grandSireMaternal: PedigreeNode;
  grandDamMaternal: PedigreeNode;
}

export function PedigreeTree({
  animal,
  sire,
  dam,
  grandSirePaternal,
  grandDamPaternal,
  grandSireMaternal,
  grandDamMaternal
}: PedigreeTreeProps) {
  const getPedigreeClassColor = (pedigreeClass: string | null | undefined) => {
    if (!pedigreeClass) return 'bg-gray-100 text-gray-800';
    
    switch (pedigreeClass) {
      case 'A': return 'bg-purple-100 text-purple-800';
      case 'B': return 'bg-blue-100 text-blue-800';
      case 'C': return 'bg-green-100 text-green-800';
      case 'D': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderNode = (node: PedigreeNode, gender: 'male' | 'female', generation: number) => {
    const genderColor = gender === 'male' ? 'border-blue-200' : 'border-pink-200';
    const generationClass = generation === 1 
      ? 'bg-blue-50' 
      : generation === 2 
        ? 'bg-green-50' 
        : 'bg-yellow-50';
    
    return (
      <div className={`p-3 border-2 ${genderColor} rounded-lg ${generationClass} shadow-sm`}>
        {node.tag_number ? (
          <>
            <div className="font-medium text-gray-900">{node.tag_number}</div>
            {node.name && <div className="text-sm text-gray-600">{node.name}</div>}
            {node.pedigree_number && (
              <div className="flex items-center mt-1">
                <Award className="h-3 w-3 text-yellow-600 mr-1" />
                <span className="text-xs text-gray-600">{node.pedigree_number}</span>
              </div>
            )}
            {node.pedigree_class && (
              <span className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPedigreeClassColor(node.pedigree_class)}`}>
                {node.pedigree_class} Sınıfı
              </span>
            )}
          </>
        ) : (
          <div className="text-gray-400 italic">Bilinmiyor</div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full overflow-auto">
      <div className="min-w-[800px] p-6">
        <div className="flex flex-col items-center">
          {/* Ana hayvan */}
          <div className="mb-8 w-64">
            {renderNode(animal, animal.tag_number ? 'male' : 'female', 0)}
          </div>
          
          {/* Ebeveynler */}
          <div className="grid grid-cols-2 gap-16 mb-8 w-full">
            <div className="flex justify-center">
              {renderNode(sire, 'male', 1)}
            </div>
            <div className="flex justify-center">
              {renderNode(dam, 'female', 1)}
            </div>
          </div>
          
          {/* Büyük ebeveynler */}
          <div className="grid grid-cols-4 gap-4 w-full">
            <div className="flex justify-center">
              {renderNode(grandSirePaternal, 'male', 2)}
            </div>
            <div className="flex justify-center">
              {renderNode(grandDamPaternal, 'female', 2)}
            </div>
            <div className="flex justify-center">
              {renderNode(grandSireMaternal, 'male', 2)}
            </div>
            <div className="flex justify-center">
              {renderNode(grandDamMaternal, 'female', 2)}
            </div>
          </div>
          
          {/* Bağlantı çizgileri için SVG */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: -1 }}>
            {/* Çizgiler burada olacak */}
          </svg>
        </div>
      </div>
    </div>
  );
}