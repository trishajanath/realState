import React from 'react';
import { Link } from 'react-router-dom';
import { Property } from '../../types';
import { SpotlightCard } from '../react-bits/SpotlightCard';
import { useCompareStore } from '../../store/useCompareStore';
import { Home, Bed, Bath, Maximize, Plus, Check } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  localityName?: string;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  localityName = 'Coimbatore'
}) => {
  const { addId, removeId, isCompared } = useCompareStore();
  const compared = isCompared(property.id);

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `${(price / 10000000).toFixed(2)} Cr`;
    }
    return `${(price / 100000).toFixed(1)} L`;
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (compared) {
      removeId(property.id);
    } else {
      addId(property.id);
    }
  };

  const ratingGrade = property.ai_investment_rating?.split('|')[0]?.replace('Grade:', '').trim() || 'B';

  return (
    <SpotlightCard className="flex flex-col h-full hover:shadow-md transition-shadow">
      <Link to={`/property/${property.id}`} className="flex flex-col h-full">
        {/* Mock image container */}
        <div className="relative aspect-[16/10] w-full rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center text-slate-300">
          <Home className="h-10 w-10 stroke-[1.5]" />
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-900 border border-slate-200/50 shadow-sm">
            {property.property_type}
          </div>
          <div className="absolute top-3 right-3 bg-blue-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-mono tracking-wider uppercase font-bold">
            Grade {ratingGrade}
          </div>
        </div>

        {/* Content details */}
        <div className="flex flex-col flex-grow mt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-display font-extrabold text-slate-900">
              {formatPrice(property.price)}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {property.listing_type === 'Sale' ? 'For Sale' : 'For Rent'}
            </span>
          </div>

          <h3 className="text-sm font-semibold text-slate-800 line-clamp-1 mt-1 hover:text-blue-600 transition-colors">
            {property.title}
          </h3>

          <p className="text-xs text-slate-500 mt-0.5">{localityName}, Coimbatore</p>

          {/* Specs grid */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-slate-600 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <Bed className="h-3.5 w-3.5 stroke-[1.8] text-slate-400" />
              <span>{property.bedrooms || '-'} BHK</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bath className="h-3.5 w-3.5 stroke-[1.8] text-slate-400" />
              <span>{property.bathrooms || '-'} Bath</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Maximize className="h-3.5 w-3.5 stroke-[1.8] text-slate-400" />
              <span>{property.area_sqft} sqft</span>
            </div>
          </div>

          {/* Action compare footer */}
          <button
            onClick={handleCompareClick}
            className={`w-full mt-4 py-2 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
              compared
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {compared ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Added to Compare</span>
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                <span>Compare Specs</span>
              </>
            )}
          </button>
        </div>
      </Link>
    </SpotlightCard>
  );
};
