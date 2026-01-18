import React, { useState, useEffect, useRef, useCallback } from 'react';

interface TypingInterfaceProps {
  text: string;
  onComplete: (stats: TypingStats) => void;
  isActive: boolean;
  onProgressUpdate?: (progress: number) => void;
}

interface TypingStats {
  wpm: number;
  accuracy: number;
  timeTaken: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
}

interface CharacterState {
  char: string;
  typed: string;
  isCorrect: boolean;
  isCurrent: boolean;
}

const TypingInterface: React.FC<TypingInterfaceProps> = ({
  text,
  onComplete,
  isActive,
  onProgressUpdate
}) => {
  const [typedText, setTypedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [stats, setStats] = useState<TypingStats>({
    wpm: 0,
    accuracy: 0,
    timeTaken: 0,
    correctChars: 0,
    incorrectChars: 0,
    totalChars: 0
  });
  const [characters, setCharacters] = useState<CharacterState[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize characters array
  useEffect(() => {
    const chars = text.split('').map((char, index) => ({
      char,
      typed: '',
      isCorrect: false,
      isCurrent: index === 0
    }));
    setCharacters(chars);
    setCurrentIndex(0);
    setTypedText('');
    setStartTime(null);
  }, [text]);

  // Focus input when active
  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  // Calculate stats
  const calculateStats = useCallback((typed: string, currentIdx: number, start: number) => {
    const timeElapsed = (Date.now() - start) / 1000 / 60; // minutes
    const wordsTyped = typed.trim().split(/\s+/).length;
    const wpm = timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0;
    
    const correctChars = typed.split('').filter((char, idx) => char === text[idx]).length;
    const totalChars = typed.length;
    const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100;
    
    return {
      wpm,
      accuracy,
      timeTaken: (Date.now() - start) / 1000,
      correctChars,
      incorrectChars: totalChars - correctChars,
      totalChars
    };
  }, [text]);

  // Update stats periodically
  useEffect(() => {
    if (!startTime || !isActive) return;

    const interval = setInterval(() => {
      const newStats = calculateStats(typedText, currentIndex, startTime);
      setStats(newStats);
      
      // Send progress update
      if (onProgressUpdate) {
        const progress = (currentIndex / text.length) * 100;
        onProgressUpdate(progress);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [startTime, typedText, currentIndex, isActive, calculateStats, onProgressUpdate, text.length]);

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isActive) return;

    e.preventDefault();
    
    const key = e.key;
    
    // Start timer on first keystroke
    if (!startTime) {
      setStartTime(Date.now());
    }

    if (key === 'Backspace') {
      if (currentIndex > 0) {
        const newIndex = currentIndex - 1;
        const newTypedText = typedText.slice(0, -1);
        
        setTypedText(newTypedText);
        setCurrentIndex(newIndex);
        
        // Update character states
        setCharacters(prev => prev.map((char, idx) => ({
          ...char,
          isCurrent: idx === newIndex,
          typed: idx < newIndex ? newTypedText[idx] || '' : '',
          isCorrect: idx < newIndex ? (newTypedText[idx] === char.char) : false
        })));
      }
      return;
    }

    // Ignore special keys
    if (key.length > 1) return;

    // Check if we've reached the end
    if (currentIndex >= text.length) {
      if (startTime) {
        const finalStats = calculateStats(typedText, currentIndex, startTime);
        onComplete(finalStats);
      }
      return;
    }

    const newTypedText = typedText + key;
    const newIndex = currentIndex + 1;
    setTypedText(newTypedText);
    setCurrentIndex(newIndex);

    // Update character states
    setCharacters(prev => prev.map((char, idx) => ({
      ...char,
      isCurrent: idx === newIndex,
      typed: idx < newIndex ? newTypedText[idx] : '',
      isCorrect: idx < newIndex ? (newTypedText[idx] === char.char) : false
    })));

    // Check if completed
    if (newIndex >= text.length && startTime) {
      const finalStats = calculateStats(newTypedText, newIndex, startTime);
      onComplete(finalStats);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Stats Display */}
      <div className="flex justify-between items-center mb-6 p-4 bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.wpm}</div>
          <div className="text-sm text-gray-400">WPM</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{stats.accuracy}%</div>
          <div className="text-sm text-gray-400">Accuracy</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {Math.round(stats.timeTaken)}s
          </div>
          <div className="text-sm text-gray-400">Time</div>
        </div>
      </div>

      {/* Typing Area */}
      <div className="relative">
        <div className="typing-text bg-gray-900 p-6 rounded-lg border-2 border-gray-700 min-h-[200px] leading-relaxed">
          {characters.map((char, index) => (
            <span
              key={index}
              className={`character ${
                char.isCurrent ? 'current' : 
                char.isCorrect ? 'correct' : 
                char.typed && !char.isCorrect ? 'incorrect' : ''
              }`}
            >
              {char.char}
            </span>
          ))}
        </div>
        
        {/* Hidden input for capturing keystrokes */}
        <input
          ref={inputRef}
          type="text"
          className="absolute inset-0 opacity-0 cursor-pointer"
          onKeyDown={handleKeyPress}
          value=""
          readOnly
          tabIndex={0}
        />
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="progress-bar bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentIndex / text.length) * 100}%` }}
          />
        </div>
        <div className="text-center mt-2 text-sm text-gray-400">
          {currentIndex} / {text.length} characters
        </div>
      </div>

      {/* Instructions */}
      {!isActive && (
        <div className="text-center mt-6 p-4 bg-gray-800 rounded-lg">
          <p className="text-gray-300">
            Click on the text area and start typing to begin the test.
          </p>
        </div>
      )}
    </div>
  );
};

export default TypingInterface;
