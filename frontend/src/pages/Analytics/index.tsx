import React, { useState } from 'react';
import { useLocalities } from '../../hooks/useApi';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { LayoutDashboard, TrendingUp, Percent, Landmark, Activity, Calendar, MapPin } from 'lucide-react';
import { mockScores, mockMetrics } from '../../services/mockData';

export const AnalyticsPage: React.FC = () => {
  const { data: localities } = useLocalities();
  const [activeBoardTab, setActiveBoardTab] = useState<'trends' | 'yields' | 'infra' | 'rankings'>('trends');

  // Multi-locality price trend history
  const priceTrendsData = [
    { year: '2023', Saravanampatti: 3500, Peelamedu: 5500, RSPuram: 8200, Kalapatti: 3400 },
    { year: '2024', Saravanampatti: 3850, Peelamedu: 6050, RSPuram: 8850, Kalapatti: 3750 },
    { year: '2025', Saravanampatti: 4200, Peelamedu: 6480, RSPuram: 9380, Kalapatti: 4050 },
    { year: '2026', Saravanampatti: 4500, Peelamedu: 6800, RSPuram: 9800, Kalapatti: 4300 }
  ];

  // Rental yield comparisons
  const yieldComparisonData = localities?.map(l => {
    const metrics = mockMetrics[l.id] || { rental_yield_estimate: 3.5 };
    return {
      name: l.name,
      yield: metrics.rental_yield_estimate || 3.5
    };
  }) || [];

  // Locality rankings compiled data
  const rankingTableData = localities?.map(l => {
    const scores = mockScores[l.id] || { investment_score: 75, overall_livability_score: 70, connectivity_score: 70 };
    const metrics = mockMetrics[l.id] || { listing_velocity: 6.0, avg_price_per_sqft: 4000 };
    const ratingSafety = scores.healthcare_score ? (scores.healthcare_score + (scores.education_score || 70)) / 2 : 75;

    return {
      id: l.id,
      name: l.name,
      investScore: scores.investment_score || 75.0,
      safetyScore: ratingSafety,
      connectScore: scores.connectivity_score || 70.0,
      livability: scores.overall_livability_score || 70.0,
      velocity: metrics.listing_velocity || 6.5,
      price: metrics.avg_price_per_sqft || 4200
    };
  }).sort((a, b) => b.investScore - a.investScore) || [];

  // Infrastructure timeline markers
  const infraTimeline = [
    { title: 'Avinashi Road Flyover Project', phase: 'Phase 2 Completion', date: 'Q4 2026', impact: 'Directly improves connectivity ratings of Peelamedu and Hopes College corridors by reducing peak hour travel duration by 35%.', status: 'In Progress', color: 'bg-blue-500' },
    { title: 'Coimbatore Metro Line Phase 1', phase: 'Zoning Approvals', date: 'Q2 2027', impact: 'Proposed line connects Kalapatti and Saravanampatti peripheral sectors. Projected to yield a 12-15% bump in price-per-sqft margins near stations.', status: 'Approved', color: 'bg-emerald-500' },
    { title: 'CHIL SEZ IT Park Corridor Expansion', phase: 'Development Kickoff', date: 'Q1 2027', impact: 'Addition of 40,000 corporate seats. Will accelerate rental demand velocity in Saravanampatti sector.', status: 'Planning', color: 'bg-amber-500' },
    { title: 'DB Road Pedestrian Plaza Expansion', phase: 'Phase 1 Launch', date: 'Completed', impact: 'Upgraded pedestrian zones and lifestyle scores in RS Puram commercial avenues.', status: 'Completed', color: 'bg-slate-500' }
  ];

  return (
    <div className="flex-grow flex flex-col bg-slate-900 text-slate-100 p-6 md:p-10 font-mono">
      
      {/* Dashboard Top bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-blue-500" />
            <h1 className="text-xl md:text-2xl font-bold font-display text-white tracking-tight">Coimbatore Real Estate Intelligence Console</h1>
          </div>
          <p className="text-[10px] text-slate-500 uppercase mt-1">Direct metric indices compiled daily &bull; Active indices cached</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-slate-400 font-bold uppercase">Market Feeds Active</span>
        </div>
      </div>

      {/* Analytics Summary index grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
          <span className="text-[9px] text-slate-500 block uppercase">City Price Avg</span>
          <span className="text-xl font-bold text-white block mt-1">6,350 INR/sqft</span>
          <span className="text-[9px] text-emerald-500 flex items-center gap-0.5 mt-1 font-sans">
            <TrendingUp className="h-3 w-3" /> +5.4% vs prev year
          </span>
        </div>
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
          <span className="text-[9px] text-slate-500 block uppercase">Rental Index Average</span>
          <span className="text-xl font-bold text-white block mt-1">3.78%</span>
          <span className="text-[9px] text-slate-500 mt-1 block">Municipal standard: 3.5%</span>
        </div>
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
          <span className="text-[9px] text-slate-500 block uppercase">Appreciation Velocity</span>
          <span className="text-xl font-bold text-white block mt-1">Grade: A-</span>
          <span className="text-[9px] text-blue-500 mt-1 block">High liquidity transactions</span>
        </div>
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
          <span className="text-[9px] text-slate-500 block uppercase">Monitored Inventory</span>
          <span className="text-xl font-bold text-white block mt-1">715 Units</span>
          <span className="text-[9px] text-slate-500 mt-1 block">across 7 active sectors</span>
        </div>
      </div>

      {/* Board layout containing Recharts and tables */}
      <div className="mt-8">
        <Tabs defaultValue="trends" value={activeBoardTab} onValueChange={(val: any) => setActiveBoardTab(val)}>
          <TabsList className="bg-slate-950 border border-slate-800 p-1 rounded-xl flex flex-wrap gap-1 mb-6 w-full justify-start h-auto text-slate-400">
            <TabsTrigger value="trends" className="flex items-center gap-1.5 text-xs py-2 cursor-pointer rounded-lg hover:text-white">
              <TrendingUp className="h-4 w-4" />
              <span>Price History Trends</span>
            </TabsTrigger>
            <TabsTrigger value="yields" className="flex items-center gap-1.5 text-xs py-2 cursor-pointer rounded-lg hover:text-white">
              <Percent className="h-4 w-4" />
              <span>Rental Yield Matrix</span>
            </TabsTrigger>
            <TabsTrigger value="infra" className="flex items-center gap-1.5 text-xs py-2 cursor-pointer rounded-lg hover:text-white">
              <Landmark className="h-4 w-4" />
              <span>Infrastructure Projects</span>
            </TabsTrigger>
            <TabsTrigger value="rankings" className="flex items-center gap-1.5 text-xs py-2 cursor-pointer rounded-lg hover:text-white">
              <Activity className="h-4 w-4" />
              <span>Locality Rankings Board</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Content: Price Trends */}
          <TabsContent value="trends">
            <Card className="bg-slate-950 border-slate-800">
              <CardHeader>
                <CardTitle className="text-xs text-slate-500 uppercase font-mono">Comparative price appreciation path (INR / sqft)</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceTrendsData}>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                    <XAxis dataKey="year" stroke="#475569" fontSize={11} tickLine={false} />
                    <YAxis stroke="#475569" fontSize={11} tickLine={false} domain={['dataMin - 1000', 'dataMax + 1000']} />
                    <Tooltip contentStyle={{ background: '#020617', color: '#fff', borderRadius: '12px', border: '1px solid #1e293b' }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="Saravanampatti" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="Peelamedu" stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey="RSPuram" stroke="#f59e0b" strokeWidth={2} />
                    <Line type="monotone" dataKey="Kalapatti" stroke="#a855f7" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Content: Yield Analysis */}
          <TabsContent value="yields">
            <Card className="bg-slate-950 border-slate-800">
              <CardHeader>
                <CardTitle className="text-xs text-slate-500 uppercase font-mono">Annualized rental yield percentages across micro-sectors</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yieldComparisonData}>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} />
                    <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#020617', color: '#fff', borderRadius: '12px', border: '1px solid #1e293b' }} />
                    <Bar dataKey="yield" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Content: Infrastructure timelines */}
          <TabsContent value="infra">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {infraTimeline.map((item, idx) => (
                <Card key={idx} className="bg-slate-950 border-slate-800">
                  <CardHeader className="flex flex-row justify-between items-start gap-4 pb-3">
                    <div>
                      <h3 className="font-bold text-white text-xs">{item.title}</h3>
                      <p className="text-[9px] text-slate-500 mt-1 uppercase font-semibold">{item.phase}</p>
                    </div>
                    <Badge variant={item.status === 'Completed' ? 'success' : item.status === 'In Progress' ? 'default' : 'secondary'} className="font-mono text-[9px] py-0.5">
                      {item.status}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">{item.impact}</p>
                    <div className="flex items-center gap-4 text-[10px] text-slate-500 pt-2 border-t border-slate-900">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Target: {item.date}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tab Content: Locality Rankings */}
          <TabsContent value="rankings">
            <Card className="bg-slate-950 border-slate-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-950 border-b border-slate-800">
                  <TableRow>
                    <TableHead className="text-slate-400 font-bold">Rank</TableHead>
                    <TableHead className="text-slate-400 font-bold">Micro-Sector Name</TableHead>
                    <TableHead className="text-slate-400 font-bold text-center">Investment Score</TableHead>
                    <TableHead className="text-slate-400 font-bold text-center">Safety Rating</TableHead>
                    <TableHead className="text-slate-400 font-bold text-center">Connectivity</TableHead>
                    <TableHead className="text-slate-400 font-bold text-center">Livability Score</TableHead>
                    <TableHead className="text-slate-400 font-bold text-right">Avg Sqft Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-800">
                  {rankingTableData.map((item, idx) => (
                    <TableRow key={item.id} className="hover:bg-slate-900/40">
                      <TableCell className="font-bold text-slate-400">{idx + 1}</TableCell>
                      <TableCell className="font-bold text-white flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-500" />
                        <span>{item.name}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="bg-amber-950 text-amber-400 border border-amber-800/40 px-2 py-0.5 rounded text-[10px] font-bold">
                          {item.investScore.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-slate-300">{item.safetyScore.toFixed(1)}%</TableCell>
                      <TableCell className="text-center text-slate-300">{item.connectScore.toFixed(1)}%</TableCell>
                      <TableCell className="text-center text-slate-300 font-bold">{item.livability.toFixed(1)}%</TableCell>
                      <TableCell className="text-right font-bold text-blue-400">{item.price.toLocaleString()} INR</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
};
