import React from 'react';
import { Link } from 'react-router-dom';
import { useCompareStore } from '../../store/useCompareStore';
import { useProperties, useLocalities } from '../../hooks/useApi';
import { ArrowLeftRight, Trash2, Home, Check, Plus } from 'lucide-react';

export const ComparePage: React.FC = () => {
  const { selectedIds, removeId, clear } = useCompareStore();
  const { data: properties } = useProperties();
  const { data: localities } = useLocalities();

  const comparedProperties = properties?.filter(p => selectedIds.includes(p.id)) || [];

  const getLocalityName = (localityId?: string | null) => {
    return localities?.find(l => l.id === localityId)?.name || 'Coimbatore';
  };

  const getPricePerSqft = (price: number, area: number) => {
    return area > 0 ? Math.round(price / area) : 0;
  };

  // Calculate winners
  const pricesPerSqft = comparedProperties.map(p => getPricePerSqft(p.price, p.area_sqft));
  const minPricePerSqft = pricesPerSqft.length > 0 ? Math.min(...pricesPerSqft) : null;

  const areas = comparedProperties.map(p => p.area_sqft);
  const maxArea = areas.length > 0 ? Math.max(...areas) : null;

  const getGradeScore = (rating?: string | null) => {
    const grade = rating?.split('|')[0]?.replace('Grade:', '').trim() || 'B';
    if (grade.startsWith('A')) return 3;
    if (grade.startsWith('B')) return 2;
    return 1;
  };

  const gradeScores = comparedProperties.map(p => getGradeScore(p.ai_investment_rating));
  const maxGradeScore = gradeScores.length > 0 ? Math.max(...gradeScores) : null;

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `${(price / 10000000).toFixed(2)} Cr`;
    }
    return `${(price / 100000).toFixed(1)} L`;
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 w-full flex-grow flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200/60 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-display text-slate-900 leading-tight">
            Property Specifications Comparison
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-1">COMPARE VALUE METRICS OF UP TO 4 DEVELOPER LISTINGS</p>
        </div>

        {comparedProperties.length > 0 && (
          <button
            onClick={clear}
            className="text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200/30 px-4 py-2 rounded-xl transition-all"
          >
            Clear All
          </button>
        )}
      </div>

      {comparedProperties.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center p-20 text-center">
          <ArrowLeftRight className="h-16 w-16 text-slate-300 stroke-[1.5] mb-4" />
          <h3 className="text-base font-bold text-slate-900 font-display">No properties selected for comparison</h3>
          <p className="text-xs text-slate-500 mt-2 max-w-sm">
            Browse listings on our platform and click "Compare Specs" to view their properties metrics compared side-by-side.
          </p>
          <Link
            to="/"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl mt-6 transition-all shadow-md"
          >
            Browse Neighborhoods
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start mt-4">
          {comparedProperties.map((prop) => {
            const pSqft = getPricePerSqft(prop.price, prop.area_sqft);
            const isBestPriceSqft = minPricePerSqft !== null && pSqft === minPricePerSqft;
            const isBestArea = maxArea !== null && prop.area_sqft === maxArea;
            const isBestGrade = maxGradeScore !== null && getGradeScore(prop.ai_investment_rating) === maxGradeScore;

            const ratingGrade = prop.ai_investment_rating?.split('|')[0]?.replace('Grade:', '').trim() || 'B';

            return (
              <div 
                key={prop.id}
                className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
              >
                {/* Property Card image details */}
                <div className="relative aspect-[16/10] bg-slate-100 flex items-center justify-center text-slate-300">
                  <Home className="h-8 w-8 stroke-[1.2]" />
                  <button
                    onClick={() => removeId(prop.id)}
                    className="absolute top-3 right-3 bg-white hover:bg-slate-50 text-slate-500 hover:text-rose-600 p-1.5 rounded-lg border border-slate-200/50 shadow-sm transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="p-5 flex-grow space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm font-display line-clamp-1">
                      {prop.title}
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">{getLocalityName(prop.locality_id)}, Coimbatore</p>
                  </div>

                  {/* Comparisons Parameters List */}
                  <div className="space-y-3 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-700">
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                      <span className="text-slate-400">Total Price</span>
                      <span className="font-bold text-slate-900">{formatPrice(prop.price)}</span>
                    </div>

                    <div className={`flex justify-between items-center py-1.5 border-b border-slate-50 px-1.5 rounded-lg -mx-1.5 ${isBestPriceSqft ? 'bg-emerald-50 text-emerald-800' : ''}`}>
                      <span className={isBestPriceSqft ? 'text-emerald-700' : 'text-slate-400'}>Price/Sqft</span>
                      <span className="font-mono">{pSqft.toLocaleString()} INR</span>
                    </div>

                    <div className={`flex justify-between items-center py-1.5 border-b border-slate-50 px-1.5 rounded-lg -mx-1.5 ${isBestArea ? 'bg-emerald-50 text-emerald-800' : ''}`}>
                      <span className={isBestArea ? 'text-emerald-700' : 'text-slate-400'}>Build Area</span>
                      <span className="font-mono">{prop.area_sqft} sqft</span>
                    </div>

                    <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                      <span className="text-slate-400">Beds/Baths</span>
                      <span>{prop.bedrooms || '-'} BHK / {prop.bathrooms || '-'} Bath</span>
                    </div>

                    <div className={`flex justify-between items-center py-1.5 px-1.5 rounded-lg -mx-1.5 ${isBestGrade ? 'bg-emerald-50 text-emerald-800' : ''}`}>
                      <span className={isBestGrade ? 'text-emerald-700' : 'text-slate-400'}>AI Rating</span>
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg font-mono text-[10px] font-bold uppercase">{ratingGrade}</span>
                    </div>
                  </div>

                  <div className="pt-4 mt-2 border-t border-slate-100 flex gap-2">
                    <Link
                      to={`/property/${prop.id}`}
                      className="w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 rounded-xl transition-all"
                    >
                      View Report
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
