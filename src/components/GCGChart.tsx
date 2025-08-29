import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
// Komponen DonutChart dengan prop size opsional
const DonutChart: React.FC<{ value: number; color: string; size?: number }> = ({ value, color, size = 35 }) => {
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
        fill="#585754ff"
      >
        {Math.round(value)}
      </text>
    </svg>
  );
};
import React from 'react';

import { ProcessedGCGData, GCGData } from '@/types/gcg';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];

// Konstanta padding vertikal chart (untuk sumbu Y dan paddingTop bar container)
const CHART_VERTICAL_PADDING = 20; // px

interface GCGChartProps {
  data: ProcessedGCGData[];
  rawData?: GCGData[];
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
  rawData?: GCGData[];
}

const YearlyScoreChart: React.FC<YearlyScoreChartProps> = ({ data, allYears, yearFilter, setYearFilter, chartMode, setChartMode, rawData = [] }) => {

  // chartAreaWidth dinamis sesuai jumlah tahun yang terfilter
  const filteredYearsCount = data.length;
  let chartAreaWidth = 1000;
  if (filteredYearsCount > 15) chartAreaWidth = 1450;
  else if (filteredYearsCount > 10) chartAreaWidth = 1250;
  const yAxisPadding = 60;
  const barAreaHeight = 270; // tinggi area bar tetap
  const xAxisLabelPadding = 60; // ruang bawah untuk label X
  const chartHeight = barAreaHeight + xAxisLabelPadding; // total tinggi SVG
  const chartWidth = chartAreaWidth - yAxisPadding;

  // Hitung min dan max dinamis untuk sumbu Y
  const scores = data.map(d => d.totalScore);
  let minScoreY = Math.floor(Math.min(...scores)) - 5;
  let maxScoreY = Math.ceil(Math.max(...scores)) + 2;
  if (minScoreY < 0) minScoreY = 0;
  if (maxScoreY > 100) maxScoreY = 100;

  const barWidth = 40;
  const barSidePadding = 24; // padding kiri-kanan chart agar bar tidak mepet
  const barGap = data.length > 1 ? (chartWidth - (data.length * barWidth) - 2 * barSidePadding) / (data.length - 1) : 0;

  // Fungsi konversi skor ke posisi Y pada chart
  const getY = (score: number) => {
    return barAreaHeight - ((score - minScoreY) / (maxScoreY - minScoreY)) * barAreaHeight;
  };

  const points = data.map((yearData, index) => {
    const x = barSidePadding + (index * (barWidth + barGap)) + (barWidth / 2);
    const y = getY(yearData.totalScore);
    return `${x},${y}`;
  }).join(' ');

  const [hoveredYear, setHoveredYear] = React.useState<number | null>(null);

  // Tabel aspek untuk tahun terakhir (atau bisa diubah sesuai kebutuhan)
  const [selectedYear, setSelectedYear] = React.useState<number|null>(null);
  // Use raw data passed from parent component
  const inputData = rawData;
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
    <Card className="w-full min-h-fit">
      <CardContent className="p-4 min-h-fit flex flex-col items-center">
        {/* Switch + Filter tahun di atas grafik skor tahunan */}
        <div className="flex flex-row items-center justify-center gap-2 mb-7">
          {setChartMode && (
            <div className="flex items-center space-x-2 mr-4">
              <Label htmlFor="chart-mode" className="text-sm">Capaian Aspek</Label>
              <Switch
                id="chart-mode"
                checked={chartMode === 'tahun'}
                onCheckedChange={(checked) => setChartMode(checked ? 'tahun' : 'aspek')}
                className="h-5 w-9"
              />
              <Label htmlFor="chart-mode" className="text-sm">Skor Tahunan</Label>
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
          <svg width={chartAreaWidth} height={chartHeight} className="font-sans mb-5">
            {/* Sumbu Y dan grid */}
            <g className="text-xs text-muted-foreground" transform={`translate(${yAxisPadding - 10}, 0)`}>
              <text x="-18" y="-18" textAnchor="middle" fontSize="12" fontStyle="italic" fill="#64748b">Capaian(%)</text>
              {/* Label angka sumbu Y dan grid (setiap 5 sesuai rentang) */}
              {(() => {
                const labels = [];
                const start = Math.ceil(minScoreY / 5) * 5;
                const end = Math.floor(maxScoreY / 5) * 5;
                for (let val = start; val <= end; val += 5) {
                  const yVal = getY(val);
                  labels.push(
                    <g key={val}>
                      <text x="-12" y={yVal + 4} textAnchor="end" fontSize="12" fill="#64748b">{val}</text>
                      <line x1={0} y1={yVal} x2={chartWidth} y2={yVal} stroke="#e5e7eb" strokeDasharray="4 2" />
                    </g>
                  );
                }
                return labels;
              })()}
              {/* Bar dulu */}
              {data.map((yearData, index) => {
                const x = barSidePadding + (index * (barWidth + barGap));
                const y = getY(yearData.totalScore);
                const barH = barAreaHeight - y;
                const r = 10;
                const path = `M0,${y + r} Q0,${y} ${r},${y} H${barWidth - r} Q${barWidth},${y} ${barWidth},${y + r} V${y + barH} H0 Z`;
                const yearLabelY = barAreaHeight + 20;
                const penilaiLabelY = barAreaHeight + 36;
                const penjelasanLabelY = barAreaHeight + 32;
                return (
                  <g 
                    key={yearData.year} 
                    transform={`translate(${x}, 0)`} 
                    onClick={() => handleYearClick(yearData.year)} 
                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }} 
                    onMouseEnter={() => setHoveredYear(yearData.year)}
                    onMouseLeave={() => setHoveredYear(null)}>
                    <path
                      d={path}
                      fill="#112861d0"
                      className="opacity-90 hover:opacity-100 transition-opacity"
                      style={{ transform: hoveredYear === yearData.year ? 'scale(1.05)' : 'scale(1)', transformOrigin: `${barWidth/2}px ${barAreaHeight}px` }}
                    />
                    {/* Label tahun */}
                    <text x={barWidth / 2} y={yearLabelY} textAnchor="middle" fontSize="14" fill="#000000ff">
                      {yearData.year}
                    </text>
                    {/* Jenis Penilaian di bawah tahun */}
                    {yearData.jenisPenilaian && (
                      <text x={barWidth / 2} y={yearLabelY + 16} textAnchor="middle" fontSize="11" fill="#888">
                        {yearData.jenisPenilaian}
                      </text>
                    )}
                    {yearData.penjelasan && (
                      <foreignObject x={-30} y={penjelasanLabelY + 10} width={barWidth + 60} height={40} xmlns="http://www.w3.org/1999/xhtml">
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
              {/* Polyline (line) di atas bar */}
              <polyline
                fill="none"
                stroke="#6ba2dd80"
                strokeWidth="2.5"
                points={points.replace(/NaN/g, '0')}
              />
              {data.map((yearData, index) => {
                const x = barSidePadding + (index * (barWidth + barGap)) + (barWidth / 2);
                const y = getY(yearData.totalScore);
                return <circle key={yearData.year} cx={x} cy={y} r="4" fill="#90cdf4" />;
              })}
              {/* Label skor di atas bar */}
              {data.map((yearData, index) => {
                const x = barSidePadding + (index * (barWidth + barGap)) + (barWidth / 2);
                const y = getY(yearData.totalScore);
                return (
                  <text key={yearData.year + '-score'} x={x} y={y - 8} textAnchor="middle" fontSize="12" fill="#333" fontWeight="bold">
                    {yearData.totalScore.toFixed(2)}
                  </text>
                );
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
            const sortedSections = [...selectedData.sections].sort((a, b) => romanNumerals.indexOf(a.romanNumeral) - romanNumerals.indexOf(b.romanNumeral));
            return (
              <div className="w-full flex justify-center mt-2">
                <div className="max-w-[900px] w-full">
            <Card className="w-full">
                    <CardContent className="p-2">
                      {selectedYear && (
                        <div className="mb-1 text-sm font-semibold text-gray-600 text-center">
                          <span className="font-semibold text-gray-600">
                            {selectedData.jenisPenilaian ? `${selectedData.jenisPenilaian} ` : ''}GCG Tahun Buku {selectedYear}
                          </span>
                          {selectedData.penilai && String(selectedData.penilai).trim() && String(selectedData.penilai).toLowerCase() !== 'nan' && (
                            <div style={{ fontSize: '0.82em', fontWeight: 400, color: '#515151ff', marginBottom: '8px' }}>
                              {selectedData.penilai}
                            </div>
                          )}
                        </div>
                      )}
              <table className="min-w-[340px] w-full text-xs bg-white overflow-hidden rounded">
                        <thead>
                          <tr className="bg-blue-100 text-blue-900">
                            <th className="px-4 py-2 font-semibold w-10">ASPEK</th>
                            <th className="px-4 py-2 font-semibold w-100">DESKRIPSI</th>
                            <th className="px-4 py-2 font-semibold w-10">BOBOT</th>
                            <th className="px-4 py-2 font-semibold w-10">SKOR</th>
                            <th className="px-4 py-2 font-semibold w-10">CAPAIAN</th>
                            <th className="px-4 py-2 font-semibold w-10">PENJELASAN</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedSections.map(section => {
                            // Ambil penjelasan (Level 3)
                            const penjelasanRow = inputData.find(row =>
                              Number(row.Tahun) === selectedYear &&
                              String(row.Section) === section.romanNumeral &&
                              Number(row.Level) === 3
                            );
                            const penjelasan = penjelasanRow?.Penjelasan ?? '-';
                            // Ambil deskripsi (Level 1, mapped from Type='header')
                            const deskripsiRow = inputData.find(row =>
                              Number(row.Tahun) === selectedYear &&
                              String(row.Section) === section.romanNumeral &&
                              Number(row.Level) === 1
                            );
                            const deskripsi = deskripsiRow?.Deskripsi ?? '-';
                            return (
                              <tr key={section.romanNumeral} className="hover:bg-blue-50 transition">
                                <td className="px-4 py-1.5 text-center align-middle">{section.romanNumeral}</td>
                                <td className="px-4 py-1.5 align-middle max-w-[220px] whitespace-pre-line text-left">{deskripsi}</td>
                                <td className="px-4 py-1.5 text-center align-middle">{section.bobot !== undefined ? formatNum(section.bobot) : '-'}</td>
                                <td className="px-4 py-1.5 text-center align-middle">{section.skor !== undefined ? formatNum(section.skor) : '-'}</td>
                                <td className="px-4 py-1.5 text-center align-middle">{section.capaian !== undefined ? formatNum(section.capaian) : '-'}</td>
                                <td className="px-4 py-1.5 align-middle max-w-[220px] whitespace-pre-line text-center">{penjelasan}</td>
                              </tr>
                            );
                          })}
                            {/* Baris Total: ambil dari inputData Tahun=selectedYear, Level=4 */}
                            {(() => {
                              const totalRow = inputData.find(row => Number(row.Tahun) === selectedYear && Number(row.Level) === 4);
                              return (
                                <tr className="bg-gray-100 font-semibold">
                                  <td className="px-4 py-1.5 text-center align-middle"></td>
                                  <td className="px-4 py-1.5 align-middle max-w-[220px] whitespace-pre-line text-left">Total</td>
                                  <td className="px-4 py-1.5 text-center align-middle">{totalRow ? formatNum(totalRow.Bobot) : '-'}</td>
                                  <td className="px-4 py-1.5 text-center align-middle">{totalRow ? formatNum(totalRow.Skor) : '-'}</td>
                                  <td className="px-4 py-1.5 text-center align-middle"></td>
                                  <td className="px-4 py-1.5 align-middle max-w-[220px] whitespace-pre-line text-center">{totalRow ? totalRow.Penjelasan ?? '-' : ''}</td>
                                </tr>
                              );
                            })()}
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

export const GCGChart: React.FC<GCGChartProps> = ({ data, rawData = [], onBarClick, barWidth: propBarWidth, barGap: propBarGap, chartMode = 'aspek', setChartMode }) => {
  const [hovered, setHovered] = React.useState<{year:number, section:string}|null>(null);
  const [hoveredBar, setHoveredBar] = React.useState<number|null>(null);
  const [selectedYear, setSelectedYear] = React.useState<number|null>(null);
  const [selectedSection, setSelectedSection] = React.useState<{year: number, section: string} | null>(null);
  const [yearFilter, setYearFilter] = React.useState<{start: number, end: number} | null>(null);
  const navigate = useNavigate();

  // Pastikan chartMode bertipe string agar perbandingan tidak error
  const chartModeStr = String(chartMode);

  // Ambil semua tahun unik dari data
  const allYears = React.useMemo(() => {
    const years = data.map(d => d.year).sort((a, b) => a - b);
    return years;
  }, [data]);

  // Default filter: 9 tahun terakhir
  React.useEffect(() => {
    if (!yearFilter && allYears.length > 0) {
      const last9 = allYears.slice(-9);
      setYearFilter({ start: last9[0], end: last9[last9.length - 1] });
    }
  }, [allYears, yearFilter]);

  // Data yang sudah difilter tahun
  const filteredData = React.useMemo(() => {
    if (!yearFilter) return data;
    return data.filter(d => d.year >= yearFilter.start && d.year <= yearFilter.end);
  }, [data, yearFilter]);

  // Listen for custom event from PageA back button
  React.useEffect(() => {
    const handleBack = () => setSelectedYear(null);
    window.addEventListener('gcgBackToAspek', handleBack);
    return () => window.removeEventListener('gcgBackToAspek', handleBack);
  }, []);
  
  // Default bar width & gap, can be overridden by props
  let barWidth = propBarWidth ?? 20;
  let barGap = propBarGap ?? 4;
  // Tambahkan variabel yearGap untuk jarak antar tahun
  let yearGap = 4; // default jarak antar tahun

  // Jika rentang tahun 1-5, buat bar lebih lebar
  const numberOfYears = yearFilter ? yearFilter.end - yearFilter.start + 1 : 0;
  if (chartMode === 'aspek' && numberOfYears > 0 && numberOfYears <= 5) {
    // Semakin sedikit tahun, semakin lebar barnya
    if (numberOfYears <= 2) {
      barWidth = 45;
      barGap = 10;
      yearGap = 30;
    } else { // 3 to 5 years
      barWidth = 35;
      barGap = 8;
      yearGap = 24;
    }
  }

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
    return <YearlyScoreChart data={filteredData} allYears={allYears} yearFilter={yearFilter} setYearFilter={setYearFilter} chartMode={chartMode} setChartMode={setChartMode} rawData={rawData} />;
  }

  // X axis: skala tetap 0 - 100
  const minScore = 0;
  const maxScore = 100;
  // Chart width: fill screen horizontally, min 600px
  const chartWidth = Math.max(window.innerWidth - 70, 600); // 180px for sidebar, min 600px
  const barAreaHeight = Math.max(data.length * 50, 300); // 100px per bar, min 400px

  // Cek apakah tahun punya Level 2
  const hasLevel2 = (yearData: ProcessedGCGData) => yearData.hasLevel2Data;

  // Batang tahun hanya bisa diklik jika ada Level 2, atau jika tidak ada Level 2 aspek tidak bisa diklik
  const handleBarClick = (e: React.MouseEvent, yearData: ProcessedGCGData) => {
    e.stopPropagation();
    setSelectedYear(yearData.year);
    setSelectedSection(null);
  };

  const handleSectionClick = (e: React.MouseEvent, year: number, section: string) => {
    e.stopPropagation();
    setSelectedYear(year);
    setSelectedSection({ year, section });
  };

  const handleSectionLinkClick = (e: React.MouseEvent, yearData: ProcessedGCGData, section: string) => {
    e.stopPropagation();
    if (hasLevel2(yearData)) {
      navigate(`/page-b?year=${yearData.year}&section=${section}`);
    }
  };

  // Lebar area chart (harus sama dengan maxWidth di style)
  // chartAreaWidth dinamis sesuai jumlah tahun
  let chartAreaWidth = 1000;
  if (allYears.length > 15) chartAreaWidth = 1500;
  else if (allYears.length > 10) chartAreaWidth = 1250;

  return (
    <Card className="w-full min-h-fit">
      <CardContent className="p-4 min-h-fit">
        <div className="w-full min-h-fit">
          {/* Filter tahun dan switch selalu tampil di atas kedua grafik */}
          <div className="flex flex-row items-center justify-center gap-2 mb-7">
            {setChartMode && (
              <div className="flex items-center space-x-2 mr-4">
                <Label htmlFor="chart-mode" className="text-sm">Capaian Aspek</Label>
                <Switch
                  id="chart-mode"
                  checked={chartModeStr === 'tahun'}
                  onCheckedChange={(checked) => setChartMode(checked ? 'tahun' : 'aspek')}
                  className="h-5 w-9"
                />
                <Label htmlFor="chart-mode" className="text-sm">Skor Tahunan</Label>
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
            <div className="relative w-full" style={{ maxWidth: (chartMode as string) === 'tahun' ? chartAreaWidth : 1100, minWidth: 320, margin: -10, padding: 0 }}>
              {/* Grid lines (horizontal) dihapus */}

              {/* Y-axis labels (capaian, 100 di atas, 0 di bawah), posisi sejajar bar, ada tanda % */}
              {(() => {
                const rows: ProcessedGCGData[][] = [];
                let currentRow: ProcessedGCGData[] = [];
                let currentAspectCount = 0;
                const maxAspectsPerRow = 54;

                for (const yearData of filteredData) {
                  const yearAspectCount = yearData.sections.length;
                  if (currentRow.length > 0 && currentAspectCount + yearAspectCount > maxAspectsPerRow) {
                    rows.push(currentRow);
                    currentRow = [];
                    currentAspectCount = 0;
                  }
                  currentRow.push(yearData);
                  currentAspectCount += yearAspectCount;
                }
                if (currentRow.length > 0) {
                  rows.push(currentRow);
                }

                return (
                  <div className="flex flex-col items-center w-full gap-12" style={{ paddingTop: `${CHART_VERTICAL_PADDING}px` }}>
                    {rows.map((row, rowIdx) => {
                      const allCapaianInRow = row.flatMap(yearData => yearData.sections.map(s => s.capaian));
                      const minCapaian = Math.min(0, ...allCapaianInRow);
                      const maxCapaian = Math.max(100, ...allCapaianInRow);

                      let yMin = Math.floor(minCapaian / 20) * 20;
                      let yMax = Math.ceil(maxCapaian / 20) * 20;

                      if (yMin > minCapaian) yMin -= 20;
                      if (yMax < maxCapaian) yMax += 20;
                      
                      if (yMin === yMax) {
                        yMin -= 20;
                        yMax += 20;
                      }

                      const yAxisLabels = [];
                      const tickCount = 6;
                      let tickSize = Math.ceil((yMax - yMin) / (tickCount - 1) / 10) * 10;
                      if (tickSize === 0) tickSize = 10;

                      for (let i = yMin; i <= yMax; i += tickSize) {
                        yAxisLabels.push(Math.round(i));
                      }
                      if (!yAxisLabels.includes(yMax) && yMax % tickSize !== 0) {
                        yAxisLabels.push(yMax)
                      }

                      const chartHeight = 200;
                      const getY = (value: number) => {
                        const totalRange = yMax - yMin;
                        if (totalRange === 0) return chartHeight / 2;
                        return chartHeight - ((value - yMin) / totalRange) * chartHeight;
                      };
                      const zeroY = getY(0);

                      return (
                      <div key={rowIdx} className="relative w-full" style={{ paddingLeft: '160px' }}>
                        {/* Y-Axis positioned absolute to this container */}
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: -70,
                          width: '40px',
                          height: `${chartHeight + 40}px`,
                          zIndex: 2,
                          pointerEvents: 'none',
                        }}>
                          <div style={{
                            position: 'absolute',
                            left: -145,
                            top: '62%',
                            transform: 'translateY(-50%) rotate(-90deg)',
                            transformOrigin: 'left center',
                            color: '#64748b',
                            fontSize: 13,
                            fontWeight: 500,
                            letterSpacing: 0.5,
                            whiteSpace: 'nowrap',
                          }}>
                            Capaian(%)
                          </div>
                          {yAxisLabels.map((val) => {
                            const top = CHART_VERTICAL_PADDING + getY(val) - 8;
                            return (
                              <div key={val} style={{ position: 'absolute', left: '-145px', top: `${top}px`, height: '16px', width: '40px', display: 'flex', alignItems: 'center' }}>
                                <span className="w-10 text-right pr-1 font-medium text-xs text-muted-foreground">{val}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Chart content */}
                        <div className="flex flex-col items-center w-full">
                          <div className="flex flex-row items-baseline justify-start gap-5" style={{ marginLeft: '-100px', minHeight: '320px' }}>
                            {row.map((yearData, yearIdx) => {
                              const yearWidth = barWidth * yearData.sections.length + barGap * (yearData.sections.length - 1);
                              const hoverBoxWidth = yearWidth + 26;
                              const hoverBoxLeft = -13;

                              // Tambahkan yearGap pada posisi X setiap tahun
                              const yearOffset = yearIdx * yearGap;

                              return (
                              <div
                                key={yearData.year}
                                className="flex flex-col items-center h-full cursor-pointer group"
                                style={{ minWidth: `${yearWidth}px`, position: 'relative', marginLeft: yearIdx > 0 ? `${yearGap}px` : undefined }}
                                onClick={(e) => handleBarClick(e, yearData)}
                              >
                                <div
                                  className="rounded-lg"
                                  style={{
                                    position: 'absolute',
                                    left: hoverBoxLeft,
                                    top: -10,
                                    width: `${hoverBoxWidth}px`,
                                    height: '340px',
                                    background: 'transparent',
                                    border: hoveredBar === yearData.year ? '2px solid #ffffffff' : '2px solid transparent',
                                    boxSizing: 'border-box',
                                    boxShadow: hoveredBar === yearData.year ? '0 0 16px 4px rgba(202, 202, 202, 0.18)' : 'none',
                                    zIndex: 1,
                                    pointerEvents: 'none',
                                    transition: 'background 0.2s, border 0.2s, box-shadow 0.2s',
                                  }}
                                />
                                <div
                                  className="relative w-full h-[240px] transition group-hover:scale-[1.03]"
                                  style={{ gap: `${barGap}px`, zIndex: 2, top: CHART_VERTICAL_PADDING }}
                                  onMouseEnter={() => setHoveredBar(yearData.year)}
                                  onMouseLeave={() => setHoveredBar(null)}
                                >
                                  {[...yearData.sections].reverse().map((section, sectionIdx) => {
                                    const sectionColor = section.color;
                                    const capaian = section.capaian;
                                    const isNeg = capaian < 0;
                                    
                                    const barTopY = getY(capaian);
                                    const barHeight = Math.abs(barTopY - zeroY);
                                    const barY = capaian >= 0 ? barTopY : zeroY;

                                    const capaianLabel = String(Math.round(section.capaian));
                                    const barX = (yearData.sections.length - 1 - sectionIdx) * (barWidth + barGap);
                                    
                                    return (
                                      <div
                                        key={section.name}
                                        style={{
                                          position: 'absolute',
                                          left: barX,
                                          width: `${barWidth}px`,
                                          height: `${chartHeight}px`,
                                          cursor: 'pointer',
                                          transition: 'transform 0.2s ease-out',
                                          transform: hovered?.year === yearData.year && hovered?.section === section.romanNumeral ? 'scaleY(1.02)' : 'scaleY(1)',
                                          transformOrigin: 'bottom',
                                        }}
                                        onClick={(e) => handleSectionClick(e, yearData.year, section.romanNumeral)}
                                        onMouseEnter={() => setHovered({ year: yearData.year, section: section.romanNumeral })}
                                        onMouseLeave={() => setHovered(null)}
                                      >
                                        <div
                                          className={`rounded ${isNeg ? 'bg-red-500' : ''}`}
                                          style={{
                                            position: 'absolute',
                                            left: 0,
                                            width: '100%',
                                            height: `${Math.max(2, barHeight)}px`,
                                            backgroundColor: sectionColor,
                                            opacity: 0.9,
                                            top: `${barY}px`,
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
                                            top: `${chartHeight + 5}px`,
                                            width: '100%',
                                            textAlign: 'center',
                                            fontSize: 10,
                                            color: '#6b6b6bff',
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
                                <div
                                  className={`flex flex-col items-center gap-0.5 w-full${rowIdx > 0 ? ' mb-4' : ''}`}
                                  style={{ zIndex: 3, position: 'relative', background: 'transparent', ...(rowIdx > 0 ? { marginTop: 18 } : {}), marginTop: '8px' }}
                                  onMouseEnter={() => setHoveredBar(yearData.year)}
                                  onMouseLeave={() => setHoveredBar(null)}
                                >
                                  <div style={{ position: 'absolute', top: `${chartHeight - 200}px`, left: 0, width: '100%' }}>
                                    <div className="flex flex-col items-center text-[11px] text-muted-foreground w-full" style={{ paddingBottom: '5px', gap: '4px' }}>
                                      <span className="block text-xs font-medium text-center group-hover:underline group-hover:text-blue-700 transition" style={{ color: '#222' }}>{yearData.year}</span>
                                      <span
                                        style={{
                                          display: 'block',
                                          maxWidth: `${yearWidth}px`,
                                          width: '100%',
                                          wordBreak: 'break-word',
                                          whiteSpace: 'pre-line',
                                          textAlign: 'center',
                                          overflowWrap: 'break-word',
                                          lineHeight: 1.2,
                                          margin: '0 auto',
                                        }}
                                      >
                                        {yearData.jenisPenilaian ?? '-'}
                                      </span>
                                      <span>Skor: {typeof yearData.totalScore === 'number' ? yearData.totalScore.toFixed(2) : '-'}</span>
                                      <span>{yearData.penjelasan ?? '-'}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )})}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Area deskripsi aspek split 3 kolom: kiri, tengah, kanan (tabel kosong) */}
          <div className="mt-16 pl-11 pr-11 w-full rounded-lg mb-[-10px]">
            <div className="flex flex-row w-full gap-0">
              {/* Kiri: semua DonutChart aspek I-VI, 2/5 width */}
              <div className="basis-[40%] flex flex-col gap-2 items-end pr-0 bg-blue-50/10">
                {/* Judul rata-rata capaian tahun */}
                <div className="w-full text-left text-base font-semibold text-gray-600 mb-2 pl-2">
                  Rata-Rata Capaian Tahun {yearFilter?.start === yearFilter?.end ? yearFilter?.start : `${yearFilter?.start} - ${yearFilter?.end}`}
                </div>
                {/* DonutChart: 2 kolom dinamis */}
                <div className="grid grid-cols-2 w-full gap-0.3 items-center justify-center">
                  {(() => {
                    const allRomanNumerals = [...new Set(filteredData.flatMap(d => d.sections.map(s => s.romanNumeral)))].sort((a, b) => romanNumerals.indexOf(a) - romanNumerals.indexOf(b));
                    return allRomanNumerals.map((roman) => {
                      let sum = 0, count = 0;
                      filteredData.forEach(yearData => {
                        const section = yearData.sections.find(s => s.romanNumeral === roman);
                        if (section && typeof section.capaian === 'number') {
                          sum += section.capaian;
                          count++;
                        }
                      });
                      const avg = count > 0 ? sum / count : 0;
                      const color = filteredData[0]?.sections.find(s => s.romanNumeral === roman)?.color || '#ccc';
                      return (
                        <div key={roman} className="flex flex-row items-center min-h-[40px] p-2 gap-2 w-full bg-white">
                          <div className="flex-shrink-0 flex items-center justify-center">
                            <DonutChart value={avg} color={color} size={35} />
                          </div>
                          <div className="flex flex-col justify-center pl-1">
                            <div className="flex items-center mb-0.5">
                              <span className="font-semibold text-sm" style={{ color: '#4b4c4dff' }}>Aspek {roman}</span>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
              {/* Tengah+Kanan: tabel aspek tahun terpilih, 3/5 width */}
              <div className="basis-[60%] flex flex-col items-center justify-start min-h-[240px] bg-blue-50/10">
                {selectedYear ? (
                  (() => {
                    const selectedData = data.find(d => d.year === selectedYear);
                    if (!selectedData) return <span className="text-muted-foreground">Data tidak ditemukan</span>;
                    // Use raw data passed from parent component
                    const inputData = rawData;
                    // Sort so Aspek I is always at the top, then II, III, IV, V, VI
                    const sortedSections = [...selectedData.sections].sort((a, b) => romanNumerals.indexOf(a.romanNumeral) - romanNumerals.indexOf(b.romanNumeral));
                    // Pastikan formatNum tersedia di scope ini
                    const formatNum = (num: any) => {
                      if (num === undefined || num === null) return '-';
                      const n = typeof num === 'number' ? num : (typeof num === 'string' && !isNaN(Number(num)) ? Number(num) : null);
                      if (n === null) return num;
                      if (Number.isInteger(n)) return n.toString();
                      return n.toFixed(3).replace(/\.0+$|([1-9])0+$/g, '$1').replace(/\.$/, '');
                    };
                    return (
                      <div className="overflow-x-auto w-full flex flex-col items-center justify-center mb-2">
                        <Card className="w-full">
                            <CardContent className="p-2">
                              {selectedYear && (
                                <div className="mb-1 text-sm font-semibold text-gray-600 text-center">
                                  <span className="font-semibold text-gray-600">
                                    {selectedData.jenisPenilaian ? `${selectedData.jenisPenilaian} ` : ''}GCG Tahun Buku {selectedYear}
                                  </span>
                                  {selectedData.penilai && String(selectedData.penilai).trim() && String(selectedData.penilai).toLowerCase() !== 'nan' && (
                                    <div style={{ fontSize: '0.82em', fontWeight: 400, color: '#515151ff', marginBottom: '8px' }}>
                                      {selectedData.penilai}
                                    </div>
                                  )}
                                </div>
                              )}
                            <table className="min-w-[340px] w-full text-xs bg-white overflow-hidden rounded">
                              <thead>
                                <tr className="bg-blue-100 text-blue-900">
                                  <th className="px-4 py-2 font-semibold w-10">ASPEK</th>
                                  <th className="px-4 py-2 font-semibold w-100">DESKRIPSI</th>
                                  <th className="px-4 py-2 font-semibold w-10">BOBOT</th>
                                  <th className="px-4 py-2 font-semibold w-10">SKOR</th>
                                  <th className="px-4 py-2 font-semibold w-10">CAPAIAN</th>
                                  <th className="px-4 py-2 font-semibold w-10">PENJELASAN</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(Array.isArray(sortedSections) ? sortedSections : []).map(section => {
                                  // Cari penjelasan dari inputData (Level 3)
                                  const penjelasanRow = inputData.find(row =>
                                    Number(row.Tahun) === selectedYear &&
                                    String(row.Section) === section.romanNumeral &&
                                    Number(row.Level) === 3
                                  );
                                  const penjelasan = penjelasanRow?.Penjelasan ?? '-';
                                  // Cari deskripsi dari inputData (Level 1, mapped from Type='header')
                                  const deskripsiRow = inputData.find(row =>
                                    Number(row.Tahun) === selectedYear &&
                                    String(row.Section) === section.romanNumeral &&
                                    Number(row.Level) === 1
                                  );
                                  const deskripsi = deskripsiRow?.Deskripsi ?? '-';
                                  return (
                                    <tr 
                                  key={section.romanNumeral} 
                                  className={`hover:bg-blue-50 transition ${
                                    selectedSection &&
                                    selectedSection.year === selectedYear &&
                                    selectedSection.section === section.romanNumeral
                                      ? 'bg-blue-200'
                                      : ''
                                  }`}>
                                      <td className="px-4 py-1.5 text-center align-middle">{section.romanNumeral}</td>
                                      <td className="px-4 py-1.5 align-middle max-w-[220px] whitespace-pre-line text-left">{deskripsi}</td>
                                      <td className="px-4 py-1.5 text-center align-middle">{typeof formatNum === 'function' ? formatNum(section.bobot) : (section.bobot ?? '-')}</td>
                                      <td className="px-4 py-1.5 text-center align-middle">{typeof formatNum === 'function' ? formatNum(section.skor) : (section.skor ?? '-')}</td>
                                      <td className="px-4 py-1.5 text-center align-middle">{typeof formatNum === 'function' ? formatNum(section.capaian) : (section.capaian ?? '-')}</td>
                                      <td className="px-4 py-1.5 align-middle max-w-[220px] whitespace-pre-line text-center">{penjelasan}</td>
                                    </tr>
                                  );
                                })}
                                {/* Baris Total: ambil dari inputData Tahun=selectedYear, Level=4 */}
                                {(() => {
                                  const totalRow = inputData.find(row => Number(row.Tahun) === selectedYear && Number(row.Level) === 4);
                                  return (
                                    <tr className="bg-gray-100 font-semibold">
                                      <td className="px-4 py-1.5 text-center align-middle"></td>
                                      <td className="px-4 py-1.5 align-middle max-w-[220px] whitespace-pre-line text-left">Total</td>
                                      <td className="px-4 py-1.5 text-center align-middle">{totalRow ? formatNum(totalRow.Bobot) : '-'}</td>
                                      <td className="px-4 py-1.5 text-center align-middle">{totalRow ? formatNum(totalRow.Skor) : '-'}</td>
                                      <td className="px-4 py-1.5 text-center align-middle"></td>
                                      <td className="px-4 py-1.5 align-middle max-w-[220px] whitespace-pre-line text-center">{totalRow ? totalRow.Penjelasan ?? '-' : ''}</td>
                                    </tr>
                                  );
                                })()}
                              </tbody>
                            </table>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })()
                ) : (
                  <span className="text-muted-foreground" style={{ display: 'block', marginTop: '60px' }}>Klik tahun untuk melihat tabel aspek</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};