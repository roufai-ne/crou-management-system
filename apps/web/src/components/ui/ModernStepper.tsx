import React, { useState, ReactNode } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

// Types
export interface Step {
  id: string;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  optional?: boolean;
}

interface ModernStepperProps {
  steps: Step[];
  currentStep: number;
  onStepChange?: (step: number) => void;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'gradient-crou';
  allowSkip?: boolean;
  className?: string;
}

interface StepperContentProps {
  children: ReactNode;
  step: number;
}

interface StepperNavigationProps {
  onNext?: () => void;
  onPrevious?: () => void;
  onComplete?: () => void;
  nextLabel?: string;
  previousLabel?: string;
  completeLabel?: string;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  nextDisabled?: boolean;
  className?: string;
}

// Main Stepper Component
const ModernStepper: React.FC<ModernStepperProps> & {
  Content: React.FC<StepperContentProps>;
  Navigation: React.FC<StepperNavigationProps>;
} = ({
  steps,
  currentStep,
  onStepChange,
  orientation = 'horizontal',
  variant = 'default',
  allowSkip = false,
  className,
}) => {
  const getStepStatus = (index: number): 'completed' | 'current' | 'upcoming' => {
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'current';
    return 'upcoming';
  };

  const getStepColors = (status: 'completed' | 'current' | 'upcoming') => {
    const isGradient = variant === 'gradient-crou';
    
    switch (status) {
      case 'completed':
        return {
          circle: isGradient
            ? 'bg-gradient-to-r from-emerald-600 to-orange-600 text-white'
            : 'bg-emerald-600 text-white',
          label: 'text-emerald-600 font-semibold',
          line: isGradient
            ? 'bg-gradient-to-r from-emerald-600 to-orange-600'
            : 'bg-emerald-600',
        };
      case 'current':
        return {
          circle: isGradient
            ? 'bg-gradient-to-r from-emerald-600 to-orange-600 text-white ring-4 ring-emerald-100'
            : 'bg-emerald-600 text-white ring-4 ring-emerald-100',
          label: 'text-gray-900 font-semibold',
          line: 'bg-gray-300',
        };
      case 'upcoming':
        return {
          circle: 'bg-gray-200 text-gray-500',
          label: 'text-gray-500',
          line: 'bg-gray-300',
        };
    }
  };

  const handleStepClick = (index: number) => {
    if (allowSkip || index < currentStep) {
      onStepChange?.(index);
    }
  };

  if (orientation === 'vertical') {
    return (
      <div className={cn('space-y-4', className)}>
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const colors = getStepColors(status);
          const isClickable = allowSkip || index < currentStep;

          return (
            <div key={step.id} className="relative">
              {/* Vertical Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'absolute left-5 top-12 w-0.5 h-12',
                    colors.line,
                    'transition-colors duration-300'
                  )}
                />
              )}

              {/* Step Row */}
              <div
                className={cn(
                  'flex items-start gap-4',
                  isClickable && 'cursor-pointer hover:opacity-80',
                  'transition-opacity'
                )}
                onClick={() => isClickable && handleStepClick(index)}
              >
                {/* Circle with Icon/Number */}
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full',
                    'transition-all duration-300 flex-shrink-0',
                    colors.circle
                  )}
                >
                  {status === 'completed' ? (
                    <Check className="w-5 h-5" />
                  ) : step.icon ? (
                    <step.icon className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>

                {/* Label and Description */}
                <div className="flex-1 min-w-0 pt-1">
                  <div className={cn('text-sm transition-colors', colors.label)}>
                    {step.label}
                    {step.optional && (
                      <span className="ml-2 text-xs text-gray-400">(Optionnel)</span>
                    )}
                  </div>
                  {step.description && (
                    <p className="text-sm text-gray-500 mt-1">{step.description}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal Orientation
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const colors = getStepColors(status);
          const isClickable = allowSkip || index < currentStep;

          return (
            <React.Fragment key={step.id}>
              {/* Step */}
              <div className="flex flex-col items-center gap-2 flex-1">
                {/* Circle with Icon/Number */}
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full',
                    'transition-all duration-300',
                    colors.circle,
                    isClickable && 'cursor-pointer hover:opacity-80'
                  )}
                  onClick={() => isClickable && handleStepClick(index)}
                >
                  {status === 'completed' ? (
                    <Check className="w-5 h-5" />
                  ) : step.icon ? (
                    <step.icon className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>

                {/* Label */}
                <div className="text-center max-w-[120px]">
                  <div className={cn('text-xs transition-colors', colors.label)}>
                    {step.label}
                  </div>
                  {step.optional && (
                    <span className="text-xs text-gray-400">(Optionnel)</span>
                  )}
                </div>
              </div>

              {/* Connecting Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-2 -mt-8',
                    colors.line,
                    'transition-colors duration-300'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// Stepper Content Component
const StepperContent: React.FC<StepperContentProps> = ({ children, step }) => {
  return (
    <div className="mt-8 mb-6">
      <div className="animate-fade-in">{children}</div>
    </div>
  );
};

// Stepper Navigation Component
const StepperNavigation: React.FC<StepperNavigationProps> = ({
  onNext,
  onPrevious,
  onComplete,
  nextLabel = 'Suivant',
  previousLabel = 'Précédent',
  completeLabel = 'Terminer',
  isFirstStep = false,
  isLastStep = false,
  nextDisabled = false,
  className,
}) => {
  return (
    <div className={cn('flex items-center justify-between pt-6 border-t', className)}>
      {/* Previous Button */}
      <button
        type="button"
        onClick={onPrevious}
        disabled={isFirstStep}
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
          'text-sm font-medium transition-colors',
          isFirstStep
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
        )}
      >
        <ChevronLeft className="w-4 h-4" />
        {previousLabel}
      </button>

      {/* Next/Complete Button */}
      {isLastStep ? (
        <button
          type="button"
          onClick={onComplete}
          className={cn(
            'inline-flex items-center gap-2 px-6 py-2 rounded-lg',
            'text-sm font-semibold text-white',
            'bg-gradient-to-r from-emerald-600 to-orange-600',
            'hover:from-emerald-700 hover:to-orange-700',
            'active:from-emerald-800 active:to-orange-800',
            'transition-all shadow-lg shadow-emerald-500/30'
          )}
        >
          {completeLabel}
          <Check className="w-4 h-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className={cn(
            'inline-flex items-center gap-2 px-6 py-2 rounded-lg',
            'text-sm font-semibold transition-all',
            nextDisabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-lg shadow-emerald-500/30'
          )}
        >
          {nextLabel}
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

// Attach sub-components
ModernStepper.Content = StepperContent;
ModernStepper.Navigation = StepperNavigation;

export default ModernStepper;
