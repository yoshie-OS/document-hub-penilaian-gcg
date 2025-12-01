import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Komponen DonutChart dengan prop size opsional
const DonutChart: React.FC<{ value: number; color: string; size?: number }> = ({ value, color, size = 38 }) => {
  const radius = size;
  const stroke = Math.max(2, Math.round(size / 5));
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const percent = Math.max(0, Math.min(100, value));
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  return (
    <svg width={radius * 2} height={radius * 2} style={{ display: 'block' }}>
      <circle
        stroke="#eee"
        fill="none"
        strokeWidth={stroke}
        cx={radius}
        cy={radius}
        r={normalizedRadius}
      />
      <circle
        stroke={color}
        fill="none"
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        cx={radius}
        cy={radius}
        r={normalizedRadius}
        style={{ transition: 'stroke-dashoffset 0.5s' }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy="0.35em"
        fontSize={size * 0.58}
        fontWeight="bold"
        fill="#222"
      >
        {Math.round(value)}
      </text>
    </svg>
  );
};

// Mapping warna untuk setiap aspek (I-VI)
const aspekColorMap: Record<string, string> = {
  I: '#cab89aff',
  II: '#fcbe62ff',
  III: '#B4EBE6',
  IV: '#ACE1AF',
  V: '#88AB8E',
  VI: '#c5d8d2ff',
};

// Types for our data structure
interface ProcessedGCGData {
  year: number;
  totalScore: number;
  sections: SectionData[];
  hasLevel2Data: boolean;
  penilai?: string;
  penjelasan?: string;
}

interface SectionData {
  name: string;
  romanNumeral: string;
  capaian: number;
  height: number;
  color: string;
  bobot?: number;
  skor?: number;
  jumlah_parameter?: number;
  penjelasan?: string;
}

// Konstanta padding vertikal chart (untuk sumbu Y dan paddingTop bar container)
const CHART_VERTICAL_PADDING = 20; // px

interface GCGChartProps {
  data: ProcessedGCGData[];
  onBarClick?: (year: string) => void;
  barWidth?: number; // px
  barGap?: number; // px
  chartMode?: 'aspek' | 'tahun';
  setChartMode?: (mode: 'aspek' | 'tahun') => void;
}

interface YearlyScoreChartProps {
  data: ProcessedGCGData[];
  allYears: number[];
  yearFilter: { start: number; end: number } | null;
  setYearFilter: React.Dispatch<React.SetStateAction<{ start: number; end: number } | null>>;
  chartMode?: 'aspek' | 'tahun';
  setChartMode?: (mode: 'aspek' | 'tahun') => void;
}

const YearlyScoreChart: React.FC<YearlyScoreChartProps> = ({ data, allYears, yearFilter, setYearFilter, chartMode, setChartMode }) => {

  const chartAreaWidth = 1100;
  const chartHeight = 320; // lebih tinggi agar label bawah muat
  const yAxisPadding = 60;
  const xAxisPadding = 50;
  const chartWidth = chartAreaWidth - yAxisPadding;
  const barAreaHeight = chartHeight - xAxisPadding;

  // Hitung min dan max dinamis untuk sumbu Y
  const scores = data.map(d => d.totalScore);
  let minScoreY = Math.floor(Math.min(...scores)) - 5;
  let maxScoreY = Math.ceil(Math.max(...scores)) + 2;
  if (minScoreY < 0) minScoreY = 0;
  if (maxScoreY > 100) maxScoreY = 100;

  const barWidth = 40;
  const barGap = data.length > 1 ? (chartWidth - (data.length * barWidth)) / (data.length - 1) : 0;

  // Fungsi konversi skor ke posisi Y pada chart
  const getY = (score: number) => {
    return barAreaHeight - ((score - minScoreY) / (maxScoreY - minScoreY)) * barAreaHeight;
  };

  const points = data.map((yearData, index) => {
    const x = (index * (barWidth + barGap)) + (barWidth / 2);
    const y = getY(yearData.totalScore);
    return `${x},${y}`;
  }).join(' ');

  // Tabel aspek untuk tahun terakhir (atau bisa diubah sesuai kebutuhan)
  const [selectedYear, setSelectedYear] = React.useState<number|null>(null);
  const romanOrder = ['I', 'II', 'III', 'IV', 'V', 'VI'];
  
  const formatNum = (num: any) => {
    if (num === undefined || num === null) return '-';
    const n = typeof num === 'number' ? num : (typeof num === 'string' && !isNaN(Number(num)) ? Number(num) : null);
    if (n === null) return num;
    if (Number.isInteger(n)) return n.toString();
    return n.toFixed(3).replace(/\.0+$|([1-9])0+$/g, '$1').replace(/\.$/, '');
  };
  
  // Handler klik tahun
  const handleYearClick = (year: number) => setSelectedYear(year);
  return (
    <Card className="w-full mx-auto min-h-fit">
      <CardContent className="p-4 min-h-fit flex flex-col items-center">
        {/* Switch + Filter tahun di atas grafik skor tahunan */}
        <div className="flex flex-row items-center justify-center gap-2 mb-4">
          {setChartMode && (
            <div className="flex items-center space-x-2 mr-4">
              <Label htmlFor="chart-mode" className="text-xs">Capaian Aspek</Label>
              <Switch
                id="chart-mode"
                checked={chartMode === 'tahun'}
                onCheckedChange={(checked) => setChartMode(checked ? 'tahun' : 'aspek')}
                className="h-4 w-7"
              />
              <Label htmlFor="chart-mode" className="text-xs">Skor Tahunan</Label>
            </div>
          )}
          <span className="text-sm text-gray-600">Filter Tahun:</span>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={yearFilter?.start ?? ''}
            onChange={e => setYearFilter(f => f ? { ...f, start: Number(e.target.value) } : null)}
          >
            {allYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <span className="mx-1">-</span>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={yearFilter?.end ?? ''}
            onChange={e => setYearFilter(f => f ? { ...f, end: Number(e.target.value) } : null)}
          >
            {allYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div style={{ position: 'relative', width: chartAreaWidth }}>
          {/* Label vertikal 'Skor' di samping sumbu Y */}
          <div style={{
            position: 'absolute',
            left: -1, 
            top: 130,
            transform: 'rotate(-90deg)',
            transformOrigin: 'left top',
            fontSize: 13,
            color: '#64748b',
            fontWeight: 500,
            letterSpacing: 1,
            zIndex: 10,
            userSelect: 'none',
          }}>
            Skor
          </div>
          <svg width={chartAreaWidth} height={chartHeight} className="font-sans mb-8">
          {/* Sumbu Y dan grid */}
          <g className="text-xs text-muted-foreground" transform={`translate(${yAxisPadding - 10}, 0)`}>
            <text x="-18" y="-18" textAnchor="middle" fontSize="12" fontStyle="italic" fill="#64748b">Capaian(%)</text>
            {(() => {
              // Buat label Y kelipatan 5 antara minScoreY dan maxScoreY
              const start = Math.ceil(minScoreY / 5) * 5;
              const end = Math.floor(maxScoreY / 5) * 5;
              const labels = [];
              for (let v = start; v <= end; v += 5) labels.push(v);
              return labels.map(val => {
                const y = getY(val);
                return (
                  <g key={val} transform={`translate(0, ${y})`}>
                    <line x2="-5" stroke="currentColor" />
                    <text dy=".32em" x="-9" textAnchor="end">{val}</text>
                  </g>
                );
              });
            })()}
          </g>
          <g transform={`translate(${yAxisPadding}, 0)`}>
            {(() => {
              const start = Math.ceil(minScoreY / 5) * 5;
              const end = Math.floor(maxScoreY / 5) * 5;
              const lines = [];
              for (let v = start; v <= end; v += 5) lines.push(v);
              return lines.map(val => {
                const y = getY(val);
                return <line key={val} x1="0" x2={chartWidth} y1={y} y2={y} stroke="#e5e7eb" />;
              });
            })()}
            <line x1="0" x2={chartWidth} y1={barAreaHeight} y2={barAreaHeight} stroke="currentColor" />
            {data.map((yearData, index) => {
              const barHeight = ((yearData.totalScore - minScoreY) / (maxScoreY - minScoreY)) * barAreaHeight;
              const x = (index * (barWidth + barGap));
              const y = barAreaHeight - barHeight;
              // Custom path: sudut atas melengkung, bawah lancip
              const r = 8; // radius lengkung atas
              const w = barWidth;
              const h = barHeight;
              // Jika barHeight < r*2, kurangi radius agar tidak lebih dari tinggi
              const rY = Math.min(r, h/2);
              // SVG path: mulai kiri bawah, ke kiri atas (lengkung), ke kanan atas (lengkung), ke kanan bawah
              const path = `M0,${h} V${rY} Q0,0 ${rY},0 H${w-rY} Q${w},0 ${w},${rY} V${h} Z`;
              return (
                <g key={yearData.year} transform={`translate(${x}, 0)`} onClick={() => handleYearClick(yearData.year)} style={{ cursor: 'pointer' }}>
                  <path
                    d={path}
                    fill="#90cdf4"
                    className="opacity-90 hover:opacity-100 transition-opacity"
                    transform={`translate(0,${y})`}
                  />
                  <text x={barWidth / 2} y={y - 8} textAnchor="middle" fontSize="12" fill="#333" fontWeight="bold">
                    {yearData.totalScore.toFixed(2)}
                  </text>
                  {/* Label tahun */}
                  <text x={barWidth / 2} y={barAreaHeight + 20} textAnchor="middle" fontSize="14" fill="#666">
                    {yearData.year}
                  </text>
                  {/* Keterangan penilai dan penjelasan di bawah tahun */}
                  {yearData.penilai && (
                    <text x={barWidth / 2} y={barAreaHeight + 36} textAnchor="middle" fontSize="11" fill="#64748b">
                      {yearData.penilai}
                    </text>
                  )}
                  {yearData.penjelasan && (
                    <foreignObject x={-30} y={barAreaHeight + 44} width={barWidth + 60} height={40} xmlns="http://www.w3.org/1999/xhtml">
                      <div style={{
                        color: '#64748b',
                        fontSize: '11px',
                        textAlign: 'center',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-line',
                        maxWidth: `${barWidth + 60}px`,
                        margin: '0 auto',
                        lineHeight: 1.2,
                        padding: 0,
                      }}>
                        {yearData.penjelasan}
                      </div>
                    </foreignObject>
                  )}
                </g>
              );
            })}
            <polyline
              fill="none"
                stroke="#6ba2ddff"
              strokeWidth="2.5"
              points={points.replace(/NaN/g, '0')}
            />
            {data.map((yearData, index) => {
              const x = (index * (barWidth + barGap)) + (barWidth / 2);
              const y = getY(yearData.totalScore);
              return <circle key={yearData.year} cx={x} cy={y} r="4" fill="#4660a7ff" />;
            })}
          </g>
          </svg>
        </div>
        {/* Tabel aspek di bawah grafik, posisi tengah */}
        {!selectedYear ? (
          <div className="w-full flex justify-center mt-2">
            <span className="text-muted-foreground">Klik tahun untuk melihat tabel aspek</span>
          </div>
        ) : (
          (() => {
            const selectedData = data.find(d => d.year === selectedYear);
            if (!selectedData) return null;
            const sortedSections = [...selectedData.sections].sort((a, b) => romanOrder.indexOf(a.romanNumeral) - romanOrder.indexOf(b.romanNumeral));
            return (
              <div className="w-full flex justify-center mt-2">
                <div className="max-w-[580px] w-full">
            <Card className="w-full">
                    <CardContent className="p-2">
                      {selectedYear && (
                        <div className="mb-2 text-base font-semibold text-gray-500 text-center">Tahun Buku {selectedYear}</div>
                      )}
              <table className="min-w-[340px] max-w-[540px] w-full text-xs bg-white overflow-hidden">
                        <thead>
                          <tr className="bg-blue-100 text-blue-900">
                            <th className="px-4 py-3 font-semibold">Aspek</th>
                            <th className="px-4 py-3 font-semibold">Bobot</th>
                            <th className="px-4 py-3 font-semibold">Skor</th>
                            <th className="px-4 py-3 font-semibold">Capaian</th>
                            <th className="px-4 py-3 font-semibold">Penjelasan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedSections.map(section => {
                            return (
                              <tr key={section.romanNumeral} className="hover:bg-blue-50 transition">
                                <td className="px-4 py-2 font-bold text-center text-blue-800 align-middle">{section.romanNumeral}</td>
                                <td className="px-4 py-2 text-center align-middle">{section.bobot !== undefined ? formatNum(section.bobot) : '-'}</td>
                                <td className="px-4 py-2 text-center align-middle">{section.skor !== undefined ? formatNum(section.skor) : '-'}</td>
                                <td className="px-4 py-2 text-center align-middle">{section.capaian !== undefined ? formatNum(section.capaian) : '-'}</td>
                                <td className="px-4 py-2 align-middle max-w-[220px] whitespace-pre-line text-center">{section.penjelasan || '-'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })()
        )}
      </CardContent>
    </Card>
  );
};

export const GCGChart: React.FC<GCGChartProps> = ({ data, onBarClick, barWidth, barGap, chartMode = 'aspek', setChartMode }) => {
  const [selectedYear, setSelectedYear] = React.useState<number|null>(null);
  const [yearFilter, setYearFilter] = React.useState<{start: number, end: number} | null>(null);

  // Ambil semua tahun unik dari data
  const allYears = React.useMemo(() => {
    const years = data.map(d => d.year).sort((a, b) => a - b);
    return years;
  }, [data]);

  // Default filter: semua tahun
  React.useEffect(() => {
    if (!yearFilter && allYears.length > 0) {
      setYearFilter({ start: allYears[0], end: allYears[allYears.length - 1] });
    }
  }, [allYears, yearFilter]);

  // Data yang sudah difilter tahun
  const filteredData = React.useMemo(() => {
    if (!yearFilter) return data;
    return data.filter(d => d.year >= yearFilter.start && d.year <= yearFilter.end);
  }, [data, yearFilter]);

  // Default bar width & gap
  const defaultBarWidth = 18;
  const defaultBarGap = 4;

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Tidak ada data untuk ditampilkan. Pastikan file yang diupload sesuai format dan berisi data yang valid.</p>
        </CardContent>
      </Card>
    );
  }
  
  if (chartMode === 'tahun') {
    // Filter juga untuk grafik skor tahunan
    return <YearlyScoreChart data={filteredData} allYears={allYears} yearFilter={yearFilter} setYearFilter={setYearFilter} chartMode={chartMode} setChartMode={setChartMode} />;
  }

  // Chart width: fill screen horizontally, min 600px
  const chartWidth = Math.max(window.innerWidth - 70, 600); // 180px for sidebar, min 600px
  const barAreaHeight = Math.max(data.length * 50, 300); // 100px per bar, min 400px

  // Cek apakah tahun punya Level 2
  const hasLevel2 = (yearData: ProcessedGCGData) => yearData.hasLevel2Data;

  // Batang tahun hanya bisa diklik jika ada Level 2, atau jika tidak ada Level 2 aspek tidak bisa diklik
  const handleBarClick = (e: React.MouseEvent, yearData: ProcessedGCGData) => {
  e.stopPropagation();
  setSelectedYear(yearData.year);
  };

  // Lebar area chart (harus sama dengan maxWidth di style)
  const chartAreaWidth = 1100;

  return (
    <Card className="w-full mx-auto min-h-fit">
      <CardContent className="p-4 min-h-fit">
        <div className="w-full min-h-fit">
          {/* Filter tahun: tampilkan di atas grafik capaian aspek dan grafik skor tahunan */}
          <div className="flex flex-row items-center justify-center gap-2 mb-4">
            {setChartMode && (
              <div className="flex items-center space-x-2 mr-4">
                <Label htmlFor="chart-mode" className="text-xs">Capaian Aspek</Label>
                <Switch
                  id="chart-mode"
                  checked={chartMode === 'tahun'}
                  onCheckedChange={(checked) => setChartMode(checked ? 'tahun' : 'aspek')}
                  className="h-4 w-7"
                />
                <Label htmlFor="chart-mode" className="text-xs">Skor Tahunan</Label>
              </div>
            )}
            <span className="text-sm text-gray-600">Filter Tahun:</span>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={yearFilter?.start ?? ''}
              onChange={e => setYearFilter(f => f ? { ...f, start: Number(e.target.value) } : null)}
            >
              {allYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <span className="mx-1">-</span>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={yearFilter?.end ?? ''}
              onChange={e => setYearFilter(f => f ? { ...f, end: Number(e.target.value) } : null)}
            >
              {allYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col items-center justify-center">
            {/* Chart area vertikal */}
            <div className="relative w-full" style={{ maxWidth: chartAreaWidth, minWidth: 320, margin: '0 auto', padding: 0 }}>

              {/* Y-axis labels (capaian, 100 di atas, 0 di bawah), posisi sejajar bar, ada tanda % */}
              <div className="absolute left-0 top-0" style={{ width: '40px', height: '240px', zIndex: 2 }}>
                {/* Label miring 90 derajat di kiri angka sumbu y, benar-benar rata kiri angka */}
                <div style={{
                  position: 'absolute',
                  left: -160,
                  top: '67%', 
                  transform: 'translateY(-50%) rotate(-90deg)',
                  transformOrigin: 'left top',
                  width: '100px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  color: '#64748b',
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: 0.5,
                  zIndex: 3,
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                }}>
                  Capaian(%)
                </div>
                {/* paddingTop pada bar container: gunakan konstanta CHART_VERTICAL_PADDING */}
                {[100, 80, 60, 40, 20, 0].map((val, i) => {
                  // Hitung posisi top untuk label Y
                  // 0 = 200px dari atas, 100 = 0px dari atas, 20 = 160px dari atas, dst
                  const top = CHART_VERTICAL_PADDING + (200 - (val / 100) * 200) - 8; // -8px agar label center
                  return (
                    <div key={val} style={{ position: 'absolute', left: -150, top: `${top}px`, height: '16px', width: '40px', display: 'flex', alignItems: 'center' }}>
                      <span className="w-10 text-right pr-1 font-medium text-xs text-muted-foreground">{val}</span>
                    </div>
                  );
                })}
              </div>

              {/* Bars vertikal: 1 tahun = 6 bar berjajar ke samping */}
              {/* Bar tahun: jika >9 tahun, tampilkan dua baris */}
              {(() => {
                const n = filteredData.length;
                if (n <= 9) {
                  // Satu baris
                  return (
                    <div className="flex flex-row items-end justify-center w-full h-[320px] pl-[50px] gap-5" style={{ paddingTop: `${CHART_VERTICAL_PADDING}px` }}>
                      {filteredData.map((yearData, idx) => (
                        <div
                          key={yearData.year}
                          className="flex flex-col items-center h-full cursor-pointer group"
                          style={{ minWidth: `${(barWidth ?? defaultBarWidth) * 6 + (barGap ?? defaultBarGap) * 5}px` }}
                          onClick={() => setSelectedYear(yearData.year)}
                        >
                          {/* 6 bar per tahun berjajar ke samping */}
                          <div className="relative w-full h-[240px] transition group-hover:scale-[1.03] group-hover:bg-blue-50/40 rounded-lg" style={{ gap: `${barGap ?? defaultBarGap}px` }}>
                            {[...yearData.sections].map((section, sectionIdx) => {
                              const sectionColor = aspekColorMap[section.romanNumeral] || section.color;
                              let capaian = section.capaian;
                              if (capaian === 0) capaian = 0.1;
                              const isNeg = section.romanNumeral === 'VI' && capaian < 0;
                              const barHeight = (capaian / 100) * 200;
                              const capaianLabel = String(section.capaian).split('.')[0];
                              const zeroY = 200;
                              const barX = (yearData.sections.length - 1 - sectionIdx) * ((barWidth ?? defaultBarWidth) + (barGap ?? defaultBarGap));
                              return (
                                <div key={section.name} style={{ position: 'absolute', left: barX, width: `${barWidth ?? defaultBarWidth}px`, height: '200px' }}>
                                  <div
                                    className={`rounded ${isNeg ? 'bg-red-500' : ''}`}
                                    style={{
                                      position: 'absolute',
                                      left: 0,
                                      width: '100%',
                                      height: `${Math.abs(barHeight) < 2 ? 2 : Math.abs(barHeight)}px`,
                                      backgroundColor: sectionColor,
                                      opacity: 0.9,
                                      top: barHeight >= 0 ? zeroY - Math.abs(barHeight) : zeroY,
                                    }}
                                  >
                                    <div
                                      className="absolute left-1/2 -translate-x-1/2"
                                      style={{ top: '-18px', fontSize: '10px', color: isNeg ? '#c00' : '#222', fontWeight: 600 }}
                                    >
                                      {capaianLabel}
                                    </div>
                                  </div>
                                  {/* Label aspek di bawah bar */}
                                  <div
                                    style={{
                                      position: 'absolute',
                                      left: 0,
                                      top: 205,
                                      width: '100%',
                                      textAlign: 'center',
                                      fontSize: 10,
                                      color: '#334155',
                                      fontWeight: 500,
                                      letterSpacing: 1,
                                      userSelect: 'none',
                                    }}
                                  >
                                    {section.romanNumeral}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {/* Label tahun dan keterangan langsung di bawah bar, tanpa margin manual */}
                          <div className="flex flex-col items-center gap-0.5 w-full mt-2">
                            <span className="block text-xs font-medium text-center group-hover:underline group-hover:text-blue-700 transition">{yearData.year}</span>
                            <div className="flex flex-col items-center text-[11px] text-muted-foreground w-full">
                              <span>{yearData.penilai ?? '-'}</span>
                              <span>Skor: {typeof yearData.totalScore === 'number' ? yearData.totalScore.toFixed(2) : '-'}</span>
                              <span>{yearData.penjelasan ?? '-'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                } else {
                  // Baris pertama 9 tahun, sisanya di baris kedua
                  const rows = [filteredData.slice(0, 9), filteredData.slice(9)];
                  return (
                    <div className="flex flex-col items-center w-full gap-8" style={{ paddingTop: `${CHART_VERTICAL_PADDING}px` }}>
                      {rows.map((row, rowIdx) => (
                        <div key={rowIdx} className="flex flex-col items-center w-full">
                          <div className="flex flex-row items-end justify-center w-full h-[320px] pl-[50px] gap-5">
                            {row.map((yearData, idx) => (
                              <div
                                key={yearData.year}
                                className="flex flex-col items-center h-full cursor-pointer group"
                                style={{ minWidth: `${(barWidth ?? defaultBarWidth) * 6 + (barGap ?? defaultBarGap) * 5}px` }}
                                onClick={() => setSelectedYear(yearData.year)}
                              >
                                <div className="relative w-full h-[240px] transition group-hover:scale-[1.03] group-hover:bg-blue-50/40 rounded-lg" style={{ gap: `${barGap ?? defaultBarGap}px` }}>
                                  {[...yearData.sections].map((section, sectionIdx) => {
                                    const sectionColor = aspekColorMap[section.romanNumeral] || section.color;
                                    let capaian = section.capaian;
                                    if (capaian === 0) capaian = 0.1;
                                    const isNeg = section.romanNumeral === 'VI' && capaian < 0;
                                    const barHeight = (capaian / 100) * 200;
                                    const capaianLabel = String(section.capaian).split('.')[0];
                                    const zeroY = 200;
                                    const barX = (yearData.sections.length - 1 - sectionIdx) * ((barWidth ?? defaultBarWidth) + (barGap ?? defaultBarGap));
                                    return (
                                      <div key={section.name} style={{ position: 'absolute', left: barX, width: `${barWidth ?? defaultBarWidth}px`, height: '200px' }}>
                                        <div
                                          className={`rounded ${isNeg ? 'bg-red-500' : ''}`}
                                          style={{
                                            position: 'absolute',
                                            left: 0,
                                            width: '100%',
                                            height: `${Math.abs(barHeight) < 2 ? 2 : Math.abs(barHeight)}px`,
                                            backgroundColor: sectionColor,
                                            opacity: 0.9,
                                            top: barHeight >= 0 ? zeroY - Math.abs(barHeight) : zeroY,
                                          }}
                                        >
                                          <div
                                            className="absolute left-1/2 -translate-x-1/2"
                                            style={{ top: '-18px', fontSize: '10px', color: isNeg ? '#c00' : '#222', fontWeight: 600 }}
                                          >
                                            {capaianLabel}
                                          </div>
                                        </div>
                                        <div
                                          style={{
                                            position: 'absolute',
                                            left: 0,
                                            top: 205,
                                            width: '100%',
                                            textAlign: 'center',
                                            fontSize: 10,
                                            color: '#334155',
                                            fontWeight: 500,
                                            letterSpacing: 1,
                                            userSelect: 'none',
                                          }}
                                        >
                                          {section.romanNumeral}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                {/* Label tahun dan keterangan langsung di bawah bar, tanpa margin manual */}
                                <div className={`flex flex-col items-center gap-0.5 w-full${rowIdx === 1 ? ' mb-4' : ''}`} style={rowIdx === 1 ? { marginTop: 18 } : {}}>
                                  <span className="block text-xs font-medium text-center group-hover:underline group-hover:text-blue-700 transition">{yearData.year}</span>
                                  <div className="flex flex-col items-center text-[11px] text-muted-foreground w-full">
                                    <span>{yearData.penilai ?? '-'}</span>
                                    <span>Skor: {typeof yearData.totalScore === 'number' ? yearData.totalScore.toFixed(2) : '-'}</span>
                                    <span>{yearData.penjelasan ?? '-'}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }
              })()}
            </div>
          </div>

          {/* Area deskripsi aspek split 3 kolom: kiri, tengah, kanan (tabel kosong) */}
          <div className="mt-10 pl-11 pr-11 py-4 w-full rounded-lg">
            <div className="flex flex-row w-full gap-0">
              {/* Gabung 6 aspek dalam satu kotak besar */}
              {/* Kiri: aspek 1-3 */}
              <div className="flex-[1.5] flex flex-col gap-2 items-end pr-0 bg-blue-50/10">
                {[
                  { roman: 'I', desc: 'Komitmen terhadap penerapan tata kelola perusahaan yang baik secara berkelanjutan' },
                  { roman: 'II', desc: 'Pemegang saham dan RUPS/pemilik modal' },
                  { roman: 'III', desc: 'Dewan komisaris/dewan pengawas' },
                ].map(({ roman, desc }) => {
                  let sum = 0, count = 0;
                  filteredData.forEach(yearData => {
                    const section = yearData.sections.find(s => s.romanNumeral === roman);
                    if (section && typeof section.capaian === 'number') {
                      sum += section.capaian;
                      count++;
                    }
                  });
                  const avg = count > 0 ? sum / count : 0;
                  return (
                    <div key={roman} className="flex flex-row items-center min-h-[80px] p-2 gap-2 w-full ml-10 bg-white">
                      <div className="flex-shrink-0 flex items-center justify-center">
                        <DonutChart value={avg} color={aspekColorMap[roman]} size={35} />
                      </div>
                      <div className="flex flex-col justify-center pl-1">
                        <div className="flex items-center mb-0.5">
                          <span style={{ display: 'inline-block', width: 12, height: 12, background: aspekColorMap[roman], borderRadius: 3, border: '1px solid #ccc', marginRight: 6 }}></span>
                          <span className="font-semibold text-foreground text-xs">Aspek {roman}</span>
                        </div>
                        <span className="block text-[12px] text-muted-foreground leading-tight w-full">{desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Tengah: aspek 4-6 */}
              <div className="flex-[1.5] flex flex-col gap-2 items-start bg-blue-50/10">
                {[
                  { roman: 'IV', desc: 'Direksi' },
                  { roman: 'V', desc: 'Pengungkapan informasi dan transparansi' },
                  { roman: 'VI', desc: 'Aspek Lainnya' },
                ].map(({ roman, desc }) => {
                  let sum = 0, count = 0;
                  filteredData.forEach(yearData => {
                    const section = yearData.sections.find(s => s.romanNumeral === roman);
                    if (section && typeof section.capaian === 'number') {
                      sum += section.capaian;
                      count++;
                    }
                  });
                  const avg = count > 0 ? sum / count : 0;
                  return (
                    <div key={roman} className="flex flex-row items-center min-h-[80px] p-2 gap-2 w-full ml-4 bg-white">
                      <div className="flex-shrink-0 flex items-center justify-center">
                        <DonutChart value={avg} color={aspekColorMap[roman]} size={35} />
                      </div>
                      <div className="flex flex-col justify-center pl-1">
                        <div className="flex items-center mb-0.5">
                          <span style={{ display: 'inline-block', width: 12, height: 12, background: aspekColorMap[roman], borderRadius: 3, border: '1px solid #ccc', marginRight: 6 }}></span>
                          <span className="font-semibold text-foreground text-xs">Aspek {roman}</span>
                        </div>
                        <span className="block text-[12px] text-muted-foreground leading-tight w-full">{desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Kanan: tabel aspek tahun terpilih */}
              <div className="flex-[2] flex flex-col items-center justify-center min-h-[240px] bg-blue-50/10">
                {selectedYear ? (
                  (() => {
                    const selectedData = data.find(d => d.year === selectedYear);
                    if (!selectedData) return <span className="text-muted-foreground">Data tidak ditemukan</span>;
                    
                    // Sort so Aspek I is always at the top, then II, III, IV, V, VI
                    const romanOrder = ['I', 'II', 'III', 'IV', 'V', 'VI'];
                    const sortedSections = [...selectedData.sections].sort((a, b) => romanOrder.indexOf(a.romanNumeral) - romanOrder.indexOf(b.romanNumeral));
                    return (
                      <div className="overflow-x-auto w-full flex flex-col items-center justify-center mb-2">
                        <Card className="w-full">
                          <CardContent className="p-2">
                            {selectedYear && (
                              <div className="mb-2 text-base font-semibold text-gray-500 drop-shadow-sm text-center">Tahun Buku {selectedYear}</div>
                            )}
                            <table className="min-w-[340px] max-w-[540px] w-full text-xs bg-white overflow-hidden">
                              <thead>
                                <tr className="bg-blue-100 text-blue-900">
                                  <th className="px-4 py-3 font-semibold">Aspek</th>
                                  <th className="px-4 py-3 font-semibold">Bobot</th>
                                  <th className="px-4 py-3 font-semibold">Skor</th>
                                  <th className="px-4 py-3 font-semibold">Capaian</th>
                                  <th className="px-4 py-3 font-semibold">Penjelasan</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sortedSections.map(section => {
                                  // Format angka: integer tanpa koma, desimal max 3 digit tanpa trailing zero
                                  const formatNum = (num: any) => {
                                    if (num === undefined || num === null) return '-';
                                    const n = typeof num === 'number' ? num : (typeof num === 'string' && !isNaN(Number(num)) ? Number(num) : null);
                                    if (n === null) return num;
                                    if (Number.isInteger(n)) return n.toString();
                                    return n.toFixed(3).replace(/\.0+$|([1-9])0+$/g, '$1').replace(/\.$/, '');
                                  };
                                  return (
                                    <tr key={section.romanNumeral} className="hover:bg-blue-50 transition">
                                      <td className="px-4 py-2 font-bold text-center text-blue-800 align-middle">{section.romanNumeral}</td>
                                      <td className="px-4 py-2 text-center align-middle">{section.bobot !== undefined ? formatNum(section.bobot) : '-'}</td>
                                      <td className="px-4 py-2 text-center align-middle">{section.skor !== undefined ? formatNum(section.skor) : '-'}</td>
                                      <td className="px-4 py-2 text-center align-middle">{section.capaian !== undefined ? formatNum(section.capaian) : '-'}</td>
                                      <td className="px-4 py-2 align-middle max-w-[220px] whitespace-pre-line text-center">{section.penjelasan || '-'}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })()
                ) : (
                  <span className="text-muted-foreground">Klik tahun untuk melihat tabel aspek</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};