import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface ModernDatePickerProps {
  value?: Date;
  onChange?: (date: Date | null) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  variant?: 'default' | 'gradient-crou';
  className?: string;
  // Range selection
  rangeMode?: boolean;
  rangeStart?: Date;
  rangeEnd?: Date;
  onRangeChange?: (start: Date | null, end: Date | null) => void;
}

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export function ModernDatePicker({
  value,
  onChange,
  label,
  placeholder = 'Sélectionner une date',
  error,
  disabled = false,
  minDate,
  maxDate,
  variant = 'default',
  className,
  rangeMode = false,
  rangeStart,
  rangeEnd,
  onRangeChange,
}: ModernDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value || new Date());
  const [tempRangeStart, setTempRangeStart] = useState<Date | null>(rangeStart || null);

  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const displayValue = useMemo(() => {
    if (rangeMode && rangeStart && rangeEnd) {
      return `${formatDate(rangeStart)} - ${formatDate(rangeEnd)}`;
    }
    return formatDate(value);
  }, [value, rangeMode, rangeStart, rangeEnd]);

  // Générer le calendrier du mois
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Jours vides au début
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [viewDate]);

  const isDateDisabled = (date: Date | null) => {
    if (!date) return true;
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const isDateSelected = (date: Date | null) => {
    if (!date) return false;
    if (rangeMode) {
      if (!rangeStart && !rangeEnd) return false;
      const dateTime = date.getTime();
      if (rangeStart && rangeEnd) {
        return dateTime >= rangeStart.getTime() && dateTime <= rangeEnd.getTime();
      }
      if (rangeStart) {
        return dateTime === rangeStart.getTime();
      }
      return false;
    }
    return value ? date.toDateString() === value.toDateString() : false;
  };

  const isDateInRange = (date: Date | null) => {
    if (!date || !rangeMode || !rangeStart || !rangeEnd) return false;
    const dateTime = date.getTime();
    return dateTime > rangeStart.getTime() && dateTime < rangeEnd.getTime();
  };

  const handleDateClick = (date: Date | null) => {
    if (!date || isDateDisabled(date)) return;

    if (rangeMode) {
      if (!tempRangeStart) {
        setTempRangeStart(date);
        onRangeChange?.(date, null);
      } else {
        const start = tempRangeStart < date ? tempRangeStart : date;
        const end = tempRangeStart < date ? date : tempRangeStart;
        onRangeChange?.(start, end);
        setTempRangeStart(null);
        setIsOpen(false);
      }
    } else {
      onChange?.(date);
      setIsOpen(false);
    }
  };

  const goToPreviousMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setViewDate(today);
    if (!rangeMode) {
      onChange?.(today);
      setIsOpen(false);
    }
  };

  return (
    <div className={cn('relative', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Input Field */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full px-4 py-3 rounded-lg border text-left flex items-center justify-between transition-all',
          'focus:outline-none focus:ring-2',
          variant === 'default' && [
            'border-gray-300 bg-white',
            'focus:border-primary-500 focus:ring-primary-100',
            !disabled && 'hover:border-gray-400'
          ],
          variant === 'gradient-crou' && [
            'border-transparent bg-gradient-to-r from-primary-50 to-accent-50',
            'focus:ring-primary-200'
          ],
          error && 'border-red-500 focus:border-red-500 focus:ring-red-100',
          disabled && 'opacity-50 cursor-not-allowed bg-gray-100'
        )}
      >
        <span className={cn(
          'text-sm',
          displayValue ? 'text-gray-900' : 'text-gray-500'
        )}>
          {displayValue || placeholder}
        </span>
        <CalendarIcon className="w-5 h-5 text-gray-400" strokeWidth={2} />
      </button>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-80">
          {/* Header avec navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" strokeWidth={2} />
            </button>

            <div className="font-semibold text-gray-900">
              {MONTHS_FR[viewDate.getMonth()]} {viewDate.getFullYear()}
            </div>

            <button
              type="button"
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" strokeWidth={2} />
            </button>
          </div>

          {/* Jours de la semaine */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS_FR.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-gray-500 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grille des jours */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) => {
              const isSelected = isDateSelected(date);
              const isDisabled = isDateDisabled(date);
              const isInRange = isDateInRange(date);
              const isToday = date && date.toDateString() === new Date().toDateString();

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDateClick(date)}
                  disabled={isDisabled}
                  className={cn(
                    'aspect-square p-2 text-sm rounded-lg transition-all',
                    'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-200',
                    !date && 'invisible',
                    isDisabled && 'opacity-30 cursor-not-allowed hover:bg-transparent',
                    isSelected && 'bg-gradient-crou text-white font-semibold hover:opacity-90',
                    isInRange && !isSelected && 'bg-primary-50',
                    isToday && !isSelected && 'border-2 border-primary-500 font-medium',
                    !isSelected && !isInRange && !isToday && 'text-gray-700'
                  )}
                >
                  {date?.getDate()}
                </button>
              );
            })}
          </div>

          {/* Footer avec bouton Aujourd'hui */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
            <button
              type="button"
              onClick={goToToday}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Aujourd'hui
            </button>
            {rangeMode && tempRangeStart && (
              <button
                type="button"
                onClick={() => {
                  setTempRangeStart(null);
                  onRangeChange?.(null, null);
                }}
                className="text-sm text-gray-600 hover:text-gray-700"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>
      )}

      {/* Overlay pour fermer au clic extérieur */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export default ModernDatePicker;
