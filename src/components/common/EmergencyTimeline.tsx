import React from 'react';
import { EmergencyStatus } from '../../types';
import { Check, X, AlertTriangle, Clock } from 'lucide-react';

interface EmergencyTimelineProps {
  status: EmergencyStatus;
  rejectionReason?: string | null;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const EmergencyTimeline: React.FC<EmergencyTimelineProps> = ({
  status,
  rejectionReason,
  className = '',
  orientation = 'horizontal',
}) => {
  const standardSteps: Array<{ key: EmergencyStatus; label: string }> = [
    { key: 'submitted', label: 'Submitted' },
    { key: 'matching', label: 'Matching' },
    { key: 'awaiting_confirmation', label: 'Awaiting Confirmation' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'ambulance_assigned', label: 'Ambulance Assigned' },
    { key: 'en_route', label: 'En Route' },
    { key: 'arrived', label: 'Arrived' },
    { key: 'admitted', label: 'Admitted' },
  ];

  const isTerminalNegative = status === 'rejected' || status === 'cancelled' || status === 'unavailable';

  // Determine index of current status
  const currentStepIndex = standardSteps.findIndex((s) => s.key === status);

  if (orientation === 'vertical') {
    return (
      <div className={`space-y-4 ${className}`}>
        {isTerminalNegative && (
          <div className="bg-[#242424] border border-[#383838] p-3 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#F5F5F5] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#F5F5F5] uppercase tracking-wider block">
                TERMINAL STATUS: {status.toUpperCase()}
              </span>
              {rejectionReason && <p className="text-[#A0A0A0] mt-1">{rejectionReason}</p>}
            </div>
          </div>
        )}

        <div className="relative pl-6 border-l border-[#383838] space-y-6">
          {standardSteps.map((step, idx) => {
            const isCompleted = currentStepIndex > idx;
            const isCurrent = currentStepIndex === idx;

            return (
              <div key={step.key} className="relative">
                <div
                  className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] border ${
                    isCurrent
                      ? 'bg-[#F5F5F5] text-[#111111] border-[#F5F5F5] ring-4 ring-[#2D2D2D]'
                      : isCompleted
                      ? 'bg-[#2D2D2D] text-[#F5F5F5] border-[#383838]'
                      : 'bg-[#1B1B1B] text-[#707070] border-[#383838]'
                  }`}
                >
                  {isCompleted ? <Check className="w-2.5 h-2.5" /> : idx + 1}
                </div>
                <div className="text-xs">
                  <div
                    className={`font-medium uppercase tracking-wider ${
                      isCurrent
                        ? 'text-[#F5F5F5] font-semibold'
                        : isCompleted
                        ? 'text-[#A0A0A0]'
                        : 'text-[#707070]'
                    }`}
                  >
                    {step.label}
                  </div>
                  {isCurrent && (
                    <span className="text-[10px] text-[#A0A0A0] uppercase block mt-0.5">
                      Active Telemetry Stage
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Horizontal Layout
  return (
    <div className={`space-y-3 ${className}`}>
      {isTerminalNegative && (
        <div className="bg-[#242424] border border-[#383838] p-3 text-xs flex items-center gap-2">
          <X className="w-4 h-4 text-[#F5F5F5] shrink-0" />
          <span className="font-semibold text-[#F5F5F5] uppercase tracking-wider">
            LIFECYCLE STATUS: {status.toUpperCase()}
          </span>
          {rejectionReason && (
            <span className="text-[#A0A0A0] ml-2">({rejectionReason})</span>
          )}
        </div>
      )}

      <div className="overflow-x-auto pb-2">
        <div className="flex items-center min-w-[700px] justify-between">
          {standardSteps.map((step, idx) => {
            const isCompleted = currentStepIndex > idx;
            const isCurrent = currentStepIndex === idx;

            return (
              <React.Fragment key={step.key}>
                <div className="flex flex-col items-center text-center space-y-1.5 flex-1">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border transition-colors ${
                      isCurrent
                        ? 'bg-[#F5F5F5] text-[#111111] border-[#F5F5F5] ring-4 ring-[#2D2D2D]'
                        : isCompleted
                        ? 'bg-[#2D2D2D] text-[#F5F5F5] border-[#383838]'
                        : 'bg-[#1B1B1B] text-[#707070] border-[#383838]'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3 h-3" /> : idx + 1}
                  </div>
                  <span
                    className={`text-[11px] font-medium uppercase tracking-tight ${
                      isCurrent
                        ? 'text-[#F5F5F5] font-semibold'
                        : isCompleted
                        ? 'text-[#A0A0A0]'
                        : 'text-[#707070]'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < standardSteps.length - 1 && (
                  <div
                    className={`h-[1px] flex-1 mx-1 transition-colors ${
                      isCompleted ? 'bg-[#707070]' : 'bg-[#383838]'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
