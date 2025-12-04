"use client";

import React, { useRef, useEffect, useState } from "react";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
import { X, ArrowLeft, ArrowRight } from "@untitledui/icons";

interface OnScreenKeyboardProps {
  onChange: (input: string) => void;
  onClose: () => void;
  inputName: string;
  layout?: "default" | "number";
  value: string;
  maxLength?: number;
}

export default function OnScreenKeyboard({
  onChange,
  onClose,
  inputName,
  layout = "default",
  value,
  maxLength
}: OnScreenKeyboardProps) {
  const keyboard = useRef(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [caretPosition, setCaretPosition] = useState(value.length);

  // Sync keyboard when value changes externally
  useEffect(() => {
    if (keyboard.current) {
      // @ts-expect-error keyboard ref type is generic
      keyboard.current.setInput(value);
      // @ts-expect-error keyboard ref type is generic
      keyboard.current.setCaretPosition(caretPosition);
    }
  }, [value, caretPosition]);

  // Keep input focused and cursor visible
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(caretPosition, caretPosition);
    }
  }, [caretPosition]);

  // Initialize on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      // Scroll the button that opened this keyboard into view
      const activeElement = document.activeElement;
      if (activeElement && activeElement.tagName === 'BUTTON') { 
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      // Focus our input and set cursor to end
      if (inputRef.current) {
        const len = value.length;
        inputRef.current.focus();
        inputRef.current.setSelectionRange(len, len);
        setCaretPosition(len);
        
        // Sync with keyboard
        if (keyboard.current) {
          // @ts-expect-error keyboard ref type is generic
          keyboard.current.setCaretPosition(len);
        }
      }
    }, 150);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChangeInput = (input: string) => {
    if (maxLength && input.length > maxLength) {
      // If max length reached, don't update but keep cursor position
      if (inputRef.current) {
        inputRef.current.setSelectionRange(caretPosition, caretPosition);
      }
      return;
    }
    
    onChange(input);
    
    // Update caret position based on keyboard's internal state
    if (keyboard.current) {
      // @ts-expect-error keyboard ref type is generic
      const newCaret = keyboard.current.caretPosition;
      if (newCaret !== null && newCaret !== undefined) {
        setCaretPosition(newCaret);
        if (inputRef.current) {
          inputRef.current.setSelectionRange(newCaret, newCaret);
        }
      } else {
        // Fallback: set to end of string
        const newPos = input.length;
        setCaretPosition(newPos);
        if (inputRef.current) {
          inputRef.current.setSelectionRange(newPos, newPos);
        }
      }
    }
  };

  const handleShift = () => {
    // @ts-expect-error keyboard ref type is generic
    const currentLayout = keyboard.current.options.layoutName;
    const shiftToggle = currentLayout === "default" ? "shift" : "default";
    // @ts-expect-error keyboard ref type is generic
    keyboard.current.setOptions({
      layoutName: shiftToggle,
    });
  };

  const handleArrow = (direction: 'left' | 'right') => {
    if (!inputRef.current) return;
    
    let newPos = caretPosition;
    if (direction === 'left') {
      newPos = Math.max(0, caretPosition - 1);
    } else {
      newPos = Math.min(value.length, caretPosition + 1);
    }
    
    setCaretPosition(newPos);
    inputRef.current.setSelectionRange(newPos, newPos);
    inputRef.current.focus();
    
    // Update keyboard internal caret
    if (keyboard.current) {
      // @ts-expect-error keyboard ref type is generic
      keyboard.current.setCaretPosition(newPos);
    }
  };

  // Handle physical keyboard input or direct input changes
  const handlePhysicalInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const newPos = e.target.selectionStart || val.length;
    
    if (maxLength && val.length > maxLength) {
      // Prevent exceeding max length
      e.target.value = value;
      e.target.setSelectionRange(caretPosition, caretPosition);
      return;
    }
    
    onChange(val);
    setCaretPosition(newPos);
    
    // Sync with virtual keyboard
    if (keyboard.current) {
      // @ts-expect-error keyboard ref type is generic
      keyboard.current.setInput(val);
      // @ts-expect-error keyboard ref type is generic
      keyboard.current.setCaretPosition(newPos);
    }
  };

  // Handle selection changes (when user clicks or drags in input)
  const handleSelectionChange = () => {
    if (inputRef.current) {
      const pos = inputRef.current.selectionStart || 0;
      setCaretPosition(pos);
      if (keyboard.current) {
        // @ts-expect-error keyboard ref type is generic
        keyboard.current.setCaretPosition(pos);
      }
    }
  };

  // Custom display mapping
  const display = {
    "{bksp}": "⌫",
    "{enter}": "Done",
    "{shift}": "⇧",
    "{space}": "Space",
    "{lock}": "Caps",
    "{tab}": "Tab",
  };

  // Custom layout - Compact
  const customLayout = {
    default: [
      "1 2 3 4 5 6 7 8 9 0 {bksp}",
      "q w e r t y u i o p",
      "a s d f g h j k l {enter}",
      "{shift} z x c v b n m {shift}",
      "{space}",
    ],
    shift: [
      "! @ # $ % ^ & * ( ) {bksp}",
      "Q W E R T Y U I O P",
      "A S D F G H J K L {enter}",
      "{shift} Z X C V B N M {shift}",
      "{space}",
    ],
    number: [
      "1 2 3",
      "4 5 6",
      "7 8 9",
      "{bksp} 0 {enter}"
    ]
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] bg-neutral-900/95 border-t border-neutral-800 shadow-2xl pb-safe backdrop-blur-md">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-800/80 border-b border-neutral-700">
        <div className="flex items-center gap-4 overflow-hidden flex-1">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-sm font-semibold text-neutral-400 uppercase tracking-wide whitespace-nowrap">
              Editing
            </span>
            <span className="text-sm font-semibold text-neutral-300">
              {inputName}
            </span>
            <div className="flex-1 relative">
              {/* Real input for cursor handling */}
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={handlePhysicalInput}
                onSelect={handleSelectionChange}
                onKeyUp={handleSelectionChange}
                className="w-full px-4 py-2.5 bg-neutral-950 rounded-lg border border-neutral-800 text-base text-white font-medium shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono tracking-wide caret-emerald-500"
                placeholder=""
                maxLength={maxLength}
                autoFocus
              />
            </div>
          </div>
          
          {/* Navigation Arrows */}
          <div className="flex items-center gap-1 bg-neutral-800 rounded-md p-0.5 border border-neutral-700">
            <button 
              type="button"
              onClick={() => handleArrow('left')}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded transition-colors touch-manipulation active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-neutral-700" />
            <button 
              type="button"
              onClick={() => handleArrow('right')}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded transition-colors touch-manipulation active:scale-95"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="ml-3 px-4 py-2 text-red-400 hover:text-red-300 bg-neutral-800 hover:bg-red-500/20 border border-red-500/50 hover:border-red-500 rounded-md transition-all touch-manipulation active:scale-95 flex items-center gap-2"
        >
          <X className="w-5 h-5" />
          <span className="text-sm font-medium">Close</span>
        </button>
      </div>

      {/* Keyboard Area */}
      <div 
        className="p-1 simple-keyboard-dark-theme w-full max-w-5xl mx-auto" 
        onMouseDown={(e) => {
          // Prevent focus loss when clicking keyboard buttons
          e.preventDefault();
          // Keep input focused
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }}
      >
        <Keyboard
          keyboardRef={(r) => (keyboard.current = r)}
          layoutName={layout === "default" ? "default" : "number"}
          layout={customLayout}
          display={display}
          onChange={onChangeInput}
          onKeyPress={(button) => {
            if (button === "{shift}" || button === "{lock}") handleShift();
            if (button === "{enter}") onClose();
          }}
          theme="hg-theme-default hg-layout-default myTheme"
          inputName={inputName}
          value={value}
          maxLength={maxLength}
          disableCaretPositioning={false}
          preventMouseDownDefault={true}
        />
      </div>
      <style jsx global>{`
        .simple-keyboard.myTheme {
          background-color: transparent;
          color: white;
        }
        .simple-keyboard.myTheme .hg-button {
          background-color: #262626; /* neutral-800 */
          color: white;
          border-bottom: 1px solid #171717; /* neutral-900 */
          border-radius: 6px;
          height: 40px; /* Compact height */
          font-weight: 500;
          font-size: 16px;
          margin: 2px;
          box-shadow: 0 1px 0 rgba(0,0,0,0.5);
          transition: all 0.1s ease;
        }
        .simple-keyboard.myTheme .hg-button:active {
          background-color: #059669; /* emerald-600 */
          transform: translateY(1px);
          box-shadow: none;
        }
        .simple-keyboard.myTheme .hg-button.hg-standardBtn {
           background: #262626;
        }
        .simple-keyboard.myTheme .hg-button.hg-functionBtn {
           background-color: #1e1e1e; /* neutral-900 */
           font-size: 13px;
           color: #a3a3a3;
        }
        .simple-keyboard.myTheme .hg-button-bksp {
           font-size: 18px;
           flex-grow: 1.5;
           background-color: #1e1e1e;
        }
        .simple-keyboard.myTheme .hg-button-enter {
           background-color: #059669 !important; /* emerald-600 */
           color: white;
           font-weight: 600;
           flex-grow: 1.5;
           border-bottom-color: #047857;
        }
        .simple-keyboard.myTheme .hg-button-space {
           max-width: 400px;
           margin: 0 auto;
        }
        /* Compact row spacing */
        .simple-keyboard.myTheme .hg-row {
           margin-bottom: 1px;
        }
        .hg-theme-default .hg-row .hg-button-container {
           margin-right: 0;
        }
      `}</style>
    </div>
  );
}
