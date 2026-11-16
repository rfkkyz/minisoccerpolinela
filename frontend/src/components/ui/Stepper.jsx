import React from 'react';
import { Check } from 'lucide-react';

export function Stepper({
  steps = [
    { id: 1, label: 'Data Diri' },
    { id: 2, label: 'Jadwal & Lapangan' },
    { id: 3, label: 'Pembayaran' },
    { id: 4, label: 'Konfirmasi' }
  ],
  currentStep = 1,
  onStepClick = null,
  className = ''
}) {
  return (
    <div className={`w-full py-3 select-none ${className}`}>
      <div className="flex items-center justify-between relative max-w-2xl mx-auto px-4">
        {/* Dynamic connecting line behind steps */}
        <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 z-0" />
        
        {/* Colored progress line */}
        <div 
          className="absolute left-8 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-[#12A150] to-[#0A803E] z-0 transition-all duration-300 ease-out"
          style={{
            width: `${Math.max(0, Math.min(100, ((currentStep - 1) / (steps.length - 1)) * 100))}%`
          }}
        />

        {steps.map((step, idx) => {
          const stepNum = step.id || idx + 1;
          const isCompleted = currentStep > stepNum;
          const isCurrent = currentStep === stepNum;
          const isClickable = onStepClick && stepNum < currentStep;

          return (
            <div
              key={stepNum}
              onClick={() => isClickable && onStepClick(stepNum)}
              className={`relative z-10 flex flex-col items-center group ${
                isClickable ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              {/* 36px Circle */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-sans text-xs font-bold transition-all duration-200 ${
                  isCompleted
                    ? 'bg-gradient-to-br from-[#12A150] to-[#0A803E] text-white shadow-sm ring-2 ring-emerald-200'
                    : isCurrent
                    ? 'bg-gradient-to-br from-[#12A150] to-[#0A803E] text-white ring-4 ring-emerald-400/25 scale-110 shadow-md font-extrabold'
                    : 'bg-white text-slate-400 border-2 border-slate-200'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : stepNum}
              </div>

              {/* Step Label */}
              <span
                className={`mt-2 font-sans text-[11px] sm:text-xs font-semibold tracking-wide text-center max-w-[90px] sm:max-w-none transition-colors ${
                  isCurrent
                    ? 'text-[var(--ink)] font-bold'
                    : isCompleted
                    ? 'text-[#0B7A3B]'
                    : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Stepper;

