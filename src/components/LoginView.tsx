import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Delete, Clock as ClockIcon, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { playScanSuccessSound, playScanErrorSound, triggerHaptic } from '../core/hardware/scannerFeedback';
import { toast } from '../store/useToastStore';

export const LoginView: React.FC = () => {
  const { users, loginWithPin, loginAsUser, selectedStaffId, setSelectedStaffId } = useAuthStore();
  const { settings } = useSettingsStore();

  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time clock for POS terminal
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedUser = users.find((u) => u.id === selectedStaffId);

  const handleDigit = useCallback(
    (digit: string) => {
      if (pin.length >= 4) return;
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg(null);
      triggerHaptic();

      // When 4 digits are reached, validate automatically
      if (nextPin.length === 4) {
        setTimeout(() => {
          let res;
          if (selectedStaffId) {
            res = loginAsUser(selectedStaffId, nextPin);
          } else {
            res = loginWithPin(nextPin);
          }

          if (res.success && res.user) {
            playScanSuccessSound();
            triggerHaptic('success');
            toast.success(`Welcome, ${res.user.name}!`, `Logged in as ${res.user.role.toLowerCase()}`);
          } else {
            playScanErrorSound();
            triggerHaptic('error');
            setIsShaking(true);
            setErrorMsg(res.error || 'Incorrect PIN. Please try again.');
            setTimeout(() => {
              setPin('');
              setIsShaking(false);
            }, 600);
          }
        }, 80);
      }
    },
    [pin, selectedStaffId, loginAsUser, loginWithPin]
  );

  const handleBackspace = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
    triggerHaptic();
  }, []);

  const handleClear = useCallback(() => {
    setPin('');
    setErrorMsg(null);
    triggerHaptic();
  }, []);

  // Physical keyboard support (numbers, backspace, escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleBackspace, handleClear]);

  const handleSelectStaff = (userId: string) => {
    if (selectedStaffId === userId) {
      setSelectedStaffId(null);
    } else {
      setSelectedStaffId(userId);
    }
    setPin('');
    setErrorMsg(null);
  };

  const handleQuickDemoLogin = (demoPin: string, staffId?: string) => {
    setPin(demoPin);
    if (staffId) setSelectedStaffId(staffId);
    setTimeout(() => {
      const res = staffId ? loginAsUser(staffId, demoPin) : loginWithPin(demoPin);
      if (res.success && res.user) {
        playScanSuccessSound();
        triggerHaptic('success');
        toast.success(`Welcome, ${res.user.name}!`, `Logged in as ${res.user.role.toLowerCase()}`);
      }
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 select-none overflow-y-auto px-4 py-6">
      {/* Background Decorative Blur Rings */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Terminal Login Card */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col md:flex-row min-h-[580px]">
        {/* Left Side: Store Branding, Staff Profiles & Shift Clock */}
        <div className="md:w-5/12 bg-gradient-to-b from-slate-50 to-slate-100/90 p-6 sm:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200">
          <div>
            {/* Store Emblem & Name */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 p-1.5 flex items-center justify-center shadow-sm shrink-0">
                <img src="/logo.png" alt="POS Logo" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0">
                <h1 className="font-extrabold text-slate-900 text-base sm:text-lg leading-tight truncate">
                  {settings.storeName || 'UNIVERSAL POS'}
                </h1>
                <p className="text-xs font-semibold text-blue-600 truncate">
                  {settings.branchName || 'Main Store'}
                </p>
              </div>
            </div>

            {/* Terminal Live Date & Clock Card */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ClockIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    {currentTime.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400">
                    Terminal Time
                  </div>
                </div>
              </div>
              <div className="text-right font-mono font-bold text-slate-800 text-sm">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>

            {/* Staff Profiles List */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Select Staff (Optional)
                </span>
                {selectedStaffId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStaffId(null);
                      setPin('');
                    }}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700"
                  >
                    Clear selection
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {users.map((staff) => {
                  const isSelected = selectedStaffId === staff.id;
                  return (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => handleSelectStaff(staff.id)}
                      className={`w-full p-2.5 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer active:scale-[0.99] ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {staff.avatar ? (
                          <img
                            src={staff.avatar}
                            alt={staff.name}
                            className={`w-10 h-10 rounded-xl object-cover shrink-0 ring-2 ${
                              isSelected ? 'ring-white/80' : 'ring-slate-100'
                            }`}
                          />
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shrink-0 ${
                              staff.color || 'bg-blue-600'
                            }`}
                          >
                            {staff.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs truncate leading-tight">
                            {staff.name}
                          </h4>
                          <span
                            className={`text-[10px] font-semibold uppercase tracking-wider ${
                              isSelected ? 'text-blue-100' : 'text-slate-400'
                            }`}
                          >
                            {staff.role}
                          </span>
                        </div>
                      </div>

                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-white shrink-0 ml-2" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Demo Switcher Pills */}
          <div className="pt-4 border-t border-slate-200/80 mt-6">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              1-Tap Demo Logins:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('1111', 'staff-courtney')}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-700 transition active:scale-95 cursor-pointer shadow-2xs"
              >
                Courtney (1111)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('2222', 'staff-alexander')}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-700 transition active:scale-95 cursor-pointer shadow-2xs"
              >
                Alex (2222)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('1234', 'staff-manager')}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-700 transition active:scale-95 cursor-pointer shadow-2xs"
              >
                Manager (1234)
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Keypad & 4-Digit PIN Input */}
        <div className="md:w-7/12 p-6 sm:p-8 flex flex-col justify-between items-center bg-white">
          <div className="w-full max-w-xs flex flex-col items-center">
            {/* Header / Instructions */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto mb-2 shadow-2xs">
                <Lock className="w-6 h-6 stroke-[2]" />
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                {selectedUser ? `Welcome, ${selectedUser.name}` : 'Enter Cashier PIN'}
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {selectedUser
                  ? `Enter 4-digit PIN for ${selectedUser.name}`
                  : 'Enter your 4-digit PIN to access register'}
              </p>
            </div>

            {/* 4-Digit PIN Indicator Dots */}
            <div className={`flex items-center gap-4 mb-4 ${isShaking ? 'animate-shake' : ''}`}>
              {[0, 1, 2, 3].map((index) => {
                const isFilled = pin.length > index;
                return (
                  <div
                    key={index}
                    className={`w-4 h-4 rounded-full transition-all duration-150 ${
                      isFilled
                        ? 'bg-blue-600 scale-125 shadow-sm shadow-blue-500/40 border-2 border-blue-600'
                        : 'border-2 border-slate-300 bg-white'
                    }`}
                  />
                );
              })}
            </div>

            {/* Error Message */}
            <div className="h-5 mb-3 flex items-center justify-center">
              {errorMsg && (
                <div className="flex items-center gap-1.5 text-rose-600 text-xs font-bold animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Touch Numpad Grid */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigit(digit)}
                  className="h-14 sm:h-16 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xl font-bold border border-slate-200/90 shadow-2xs flex items-center justify-center transition active:scale-95 active:bg-blue-50 active:text-blue-600 cursor-pointer"
                >
                  {digit}
                </button>
              ))}

              {/* Clear (C) */}
              <button
                type="button"
                onClick={handleClear}
                className="h-14 sm:h-16 rounded-2xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 text-xs font-bold border border-slate-200/90 transition active:scale-95 flex items-center justify-center cursor-pointer"
                title="Clear entered PIN"
              >
                Clear
              </button>

              {/* Zero (0) */}
              <button
                type="button"
                onClick={() => handleDigit('0')}
                className="h-14 sm:h-16 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xl font-bold border border-slate-200/90 shadow-2xs flex items-center justify-center transition active:scale-95 active:bg-blue-50 active:text-blue-600 cursor-pointer"
              >
                0
              </button>

              {/* Backspace (⌫) */}
              <button
                type="button"
                onClick={handleBackspace}
                className="h-14 sm:h-16 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-base font-bold border border-slate-200/90 transition active:scale-95 flex items-center justify-center cursor-pointer"
                title="Backspace"
              >
                <Delete className="w-5 h-5 stroke-[2]" />
              </button>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-6 text-center text-slate-400 text-[11px] font-medium flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Hardware keyboard & barcode badge scanning supported</span>
          </div>
        </div>
      </div>
    </div>
  );
};
