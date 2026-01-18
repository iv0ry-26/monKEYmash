import React from 'react';

interface TypingStats {
  wpm: number;
  accuracy: number;
  timeTaken: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
}

interface ResultsScreenProps {
  stats: TypingStats;
  onRestart: () => void;
  onJoinRace?: () => void;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({
  stats,
  onRestart,
  onJoinRace
}) => {
  const getWPMColor = (wpm: number) => {
    if (wpm >= 80) return 'text-green-400';
    if (wpm >= 60) return 'text-yellow-400';
    if (wpm >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 95) return 'text-green-400';
    if (accuracy >= 90) return 'text-yellow-400';
    if (accuracy >= 80) return 'text-orange-400';
    return 'text-red-400';
  };

  const getPerformanceMessage = (wpm: number, accuracy: number) => {
    if (wpm >= 80 && accuracy >= 95) {
      return "Excellent! You're typing like a pro! 🚀";
    } else if (wpm >= 60 && accuracy >= 90) {
      return "Great job! Keep practicing to improve further! 💪";
    } else if (wpm >= 40 && accuracy >= 80) {
      return "Good progress! Focus on accuracy and speed! 📈";
    } else {
      return "Keep practicing! Every keystroke makes you better! 🎯";
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="bg-gray-900 rounded-lg p-8 text-center">
        {/* Header */}
        <h2 className="text-3xl font-bold text-white mb-2">Test Complete!</h2>
        <p className="text-gray-400 mb-8">{getPerformanceMessage(stats.wpm, stats.accuracy)}</p>

        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className={`text-4xl font-bold mb-2 ${getWPMColor(stats.wpm)}`}>
              {stats.wpm}
            </div>
            <div className="text-gray-400">Words Per Minute</div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className={`text-4xl font-bold mb-2 ${getAccuracyColor(stats.accuracy)}`}>
              {stats.accuracy}%
            </div>
            <div className="text-gray-400">Accuracy</div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {Math.round(stats.timeTaken)}s
            </div>
            <div className="text-sm text-gray-400">Time Taken</div>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-400 mb-1">
              {stats.correctChars}
            </div>
            <div className="text-sm text-gray-400">Correct</div>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-400 mb-1">
              {stats.incorrectChars}
            </div>
            <div className="text-sm text-gray-400">Incorrect</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
  <button
    onClick={onRestart}
    style={{
      backgroundColor: "#f5f5f5",       // light gray key color
      color: "#333",                    // dark text
      fontWeight: "600",
      padding: "12px 32px",
      borderRadius: "6px",              // rounded like a key
      border: "2px solid #ccc",         // subtle border
      boxShadow: "0 4px #999",          // bottom shadow for raised effect
      fontFamily: "monospace",          // typewriter/keyboard vibe
      cursor: "pointer",
      transition: "all 0.2s ease-in-out"
    }}
    onMouseDown={(e) => e.currentTarget.style.boxShadow = "0 2px #666"}
    onMouseUp={(e) => e.currentTarget.style.boxShadow = "0 4px #999"}
  >
    Try Again
  </button>
</div>

          
          {onJoinRace && (
            <button
              onClick={onJoinRace}
              className="btn-secondary px-8 py-3 rounded-lg text-white font-semibold"
            >
              Join Race
            </button>
          )}
        </div>

        {/* Tips */}
        <div className="mt-8 p-4 bg-blue-900/20 rounded-lg border border-blue-700/30">
          <h3 className="text-lg font-semibold text-blue-300 mb-2">Tips for Improvement</h3>
          <div className="text-sm text-gray-300 space-y-1">
            {stats.accuracy < 90 && (
              <p>• Focus on accuracy over speed - slow down to type correctly</p>
            )}
            {stats.wpm < 60 && (
              <p>• Practice regularly with proper finger placement</p>
            )}
            <p>• Use all fingers and avoid looking at the keyboard</p>
            <p>• Take breaks to prevent fatigue and maintain consistency</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;

