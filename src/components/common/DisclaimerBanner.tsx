import React from 'react';
import { AlertCircle, Phone } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div className="bg-[#1B1B1B] border-b border-[#383838] text-[#A0A0A0] px-4 sm:px-6 py-2 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-3.5 h-3.5 text-[#F5F5F5] shrink-0" />
          <span>
            <strong className="text-[#F5F5F5] uppercase tracking-wide">Emergency Protocol:</strong>{' '}
            CARE/ROUTE is an assistive coordination prototype. It does not replace 112 / 911 dispatch, provide clinical diagnosis, or guarantee bed reservations.
          </span>
        </div>
        <a
          href="tel:112"
          className="flex items-center space-x-1.5 text-[#F5F5F5] hover:text-[#FFFFFF] text-[11px] font-semibold uppercase tracking-wider shrink-0 underline decoration-[#383838] hover:decoration-[#F5F5F5] transition-colors"
        >
          <Phone className="w-3 h-3" />
          <span>NATIONAL SOS: 112</span>
        </a>
      </div>
    </div>
  );
};
