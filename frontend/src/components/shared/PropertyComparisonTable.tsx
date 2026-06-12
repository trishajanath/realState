import React from 'react';
import type { Property, Locality, LocalityScores } from '../../types';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../ui/Table';
import { Badge } from '../ui/Badge';

interface PropertyComparisonTableProps {
  properties: Property[];
  localities?: Locality[];
  scores?: Record<string, LocalityScores>;
  onRemove: (id: string) => void;
}

export const PropertyComparisonTable: React.FC<PropertyComparisonTableProps> = ({
  properties,
  localities = [],
  scores = {},
  onRemove
}) => {
  const getLocalityName = (localityId?: string | null) => {
    return localities.find(l => l.id === localityId)?.name || 'Coimbatore';
  };

  const getPricePerSqft = (price: number, area: number) => {
    return area > 0 ? Math.round(price / area) : 0;
  };

  const pricePerSqfts = properties.map(p => getPricePerSqft(p.price, p.area_sqft));
  const minPricePerSqft = pricePerSqfts.length > 0 ? Math.min(...pricePerSqfts) : null;

  const getGradeValue = (rating?: string | null) => {
    const grade = rating?.split('|')[0]?.replace('Grade:', '').trim() || 'B';
    if (grade.startsWith('A')) return 3;
    if (grade.startsWith('B')) return 2;
    return 1;
  };
  const gradeValues = properties.map(p => getGradeValue(p.ai_investment_rating));
  const maxGradeValue = gradeValues.length > 0 ? Math.max(...gradeValues) : null;

  const getConnectivity = (localityId?: string | null) => {
    if (!localityId) return 70;
    return scores[localityId]?.connectivity_score || 70;
  };
  const connectivityScores = properties.map(p => getConnectivity(p.locality_id));
  const maxConnectivity = connectivityScores.length > 0 ? Math.max(...connectivityScores) : null;

  const getLifestyle = (localityId?: string | null) => {
    if (!localityId) return 70;
    return scores[localityId]?.lifestyle_score || 70;
  };
  const lifestyleScores = properties.map(p => getLifestyle(p.locality_id));
  const maxLifestyle = lifestyleScores.length > 0 ? Math.max(...lifestyleScores) : null;

  return (
    <div className="overflow-hidden border border-slate-200/60 rounded-2xl bg-white shadow-sm">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-white">
          <TableRow>
            <TableHead className="w-[180px]">Specification</TableHead>
            {properties.map((p) => (
              <TableHead key={p.id} className="min-w-[200px]">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs font-display">{p.title}</h4>
                    <p className="text-[9px] text-slate-400 font-mono mt-0.5">{getLocalityName(p.locality_id)}, Coimbatore</p>
                  </div>
                  <button
                    onClick={() => onRemove(p.id)}
                    className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          <TableRow>
            <TableCell className="font-mono text-slate-400 text-[10px] uppercase font-bold">Total Price</TableCell>
            {properties.map((p) => (
              <TableCell key={p.id} className="font-display font-extrabold text-sm text-slate-900">
                {p.price >= 10000000 ? `${(p.price / 10000000).toFixed(2)} Cr` : `${(p.price / 100000).toFixed(1)} L`}
              </TableCell>
            ))}
          </TableRow>

          <TableRow>
            <TableCell className="font-mono text-slate-400 text-[10px] uppercase font-bold">Price per SqFt</TableCell>
            {properties.map((p) => {
              const pSqft = getPricePerSqft(p.price, p.area_sqft);
              const isBest = minPricePerSqft !== null && pSqft === minPricePerSqft;
              return (
                <TableCell key={p.id} className={`font-mono text-xs ${isBest ? 'bg-emerald-50/50 text-emerald-800 font-bold' : ''}`}>
                  <div className="flex items-center justify-between">
                    <span>{pSqft.toLocaleString()} INR</span>
                    {isBest && <Badge variant="success" className="ml-2 bg-emerald-500 text-white font-bold">Best Value</Badge>}
                  </div>
                </TableCell>
              );
            })}
          </TableRow>

          <TableRow>
            <TableCell className="font-mono text-slate-400 text-[10px] uppercase font-bold">Build Up Area</TableCell>
            {properties.map((p) => (
              <TableCell key={p.id} className="font-mono text-xs text-slate-800">
                {p.area_sqft} sqft
              </TableCell>
            ))}
          </TableRow>

          <TableRow>
            <TableCell className="font-mono text-slate-400 text-[10px] uppercase font-bold">Configuration</TableCell>
            {properties.map((p) => (
              <TableCell key={p.id} className="font-sans text-xs text-slate-800">
                {p.bedrooms || '-'} BHK / {p.bathrooms || '-'} Bath
              </TableCell>
            ))}
          </TableRow>

          <TableRow>
            <TableCell className="font-mono text-slate-400 text-[10px] uppercase font-bold">AI Rating</TableCell>
            {properties.map((p) => {
              const ratingVal = getGradeValue(p.ai_investment_rating);
              const isBest = maxGradeValue !== null && ratingVal === maxGradeValue;
              const ratingGrade = p.ai_investment_rating?.split('|')[0]?.replace('Grade:', '').trim() || 'B';
              return (
                <TableCell key={p.id} className={`font-mono text-xs ${isBest ? 'bg-amber-50/40 text-amber-800' : ''}`}>
                  <div className="flex items-center justify-between">
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg font-bold">{ratingGrade}</span>
                    {isBest && <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-800 border-amber-200 font-bold">Best Investment</Badge>}
                  </div>
                </TableCell>
              );
            })}
          </TableRow>

          <TableRow>
            <TableCell className="font-mono text-slate-400 text-[10px] uppercase font-bold">Connectivity Index</TableCell>
            {properties.map((p) => {
              const conn = getConnectivity(p.locality_id);
              const isBest = maxConnectivity !== null && conn === maxConnectivity;
              return (
                <TableCell key={p.id} className={`font-mono text-xs ${isBest ? 'bg-blue-50/30 text-blue-800 font-bold' : ''}`}>
                  <div className="flex items-center justify-between">
                    <span>{conn.toFixed(1)}%</span>
                    {isBest && <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800 border-blue-200 font-bold">Best Transit</Badge>}
                  </div>
                </TableCell>
              );
            })}
          </TableRow>

          <TableRow>
            <TableCell className="font-mono text-slate-400 text-[10px] uppercase font-bold">Amenity Density</TableCell>
            {properties.map((p) => {
              const lifestyle = getLifestyle(p.locality_id);
              const isBest = maxLifestyle !== null && lifestyle === maxLifestyle;
              return (
                <TableCell key={p.id} className={`font-mono text-xs ${isBest ? 'bg-rose-50/30 text-rose-800 font-bold' : ''}`}>
                  <div className="flex items-center justify-between">
                    <span>{lifestyle.toFixed(1)}%</span>
                    {isBest && <Badge variant="secondary" className="ml-2 bg-rose-100 text-rose-800 border-rose-200 font-bold">Best Amenities</Badge>}
                  </div>
                </TableCell>
              );
            })}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};
