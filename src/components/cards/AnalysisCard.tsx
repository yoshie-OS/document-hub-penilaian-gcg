import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface AnalysisCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  percentage: number;
  highlightBorder?: string;
  onClick?: () => void;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  percentage,
  highlightBorder,
  onClick
}) => {

  return (
    <Card
      className={`rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer group bg-gradient-to-br from-white via-gray-50 to-gray-100 border-0 ${highlightBorder ? 'border-b-3' : ''}`}
      style={highlightBorder ? { borderBottomColor: highlightBorder } : {}}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center bg-opacity-20 shadow-inner"
                style={{ backgroundColor: color + '22' }}
              >
                <Icon 
                  className="w-5 h-5 drop-shadow-lg"
                  style={{ color: color }}
                />
              </div>
              <span className="text-sm font-bold" style={{ color }}>{title}</span>
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="inline-block px-2 py-0.5 rounded bg-gray-200 text-xs font-semibold text-gray-700">
                {value}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-xs font-semibold text-green-700">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                {subtitle}
              </span>
            </div>
            <div className="pt-1">
              <div className="border-t border-gray-200 w-12 mb-1"></div>
            </div>
          </div>
          {/* Progress Circle - Keep reasonably large for highlight */}
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-gray-200"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="transition-all duration-500 ease-in-out drop-shadow-lg"
                stroke={color}
                strokeWidth="4"
                strokeDasharray={`${percentage}, 100`}
                fill="none"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                style={{ filter: `drop-shadow(0 0 4px ${color}55)` }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-base font-bold" style={{ color }}>{percentage}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalysisCard; 