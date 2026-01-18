import React, { useState } from 'react';
import TypingInterface from './components/TypingInterface';
import ResultsScreen from './components/ResultsScreen';
import MultiplayerRace from './components/MultiplayerRace';

interface TypingStats {
  wpm: number;
  accuracy: number;
  timeTaken: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
}

type AppState = 'home' | 'typing' | 'results' | 'multiplayer';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('home');
  const [testText, setTestText] = useState('');
  const [results, setResults] = useState<TypingStats | null>(null);

  // Sample text passages for solo practice
  const sampleTexts = [
    "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet and is commonly used for typing practice.",
    "To be or not to be, that is the question. Whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune.",
    "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness.",
    "The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle.",
    "In the beginning was the Word, and the Word was with God, and the Word was God. He was with God in the beginning.",
    "The future belongs to those who believe in the beauty of their dreams. Never give up on what you really want to do.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts. Keep pushing forward.",
    "The way to get started is to quit talking and begin doing. Action is the foundational key to all success."
  ];

  const startSoloTest = () => {
    const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    setTestText(randomText);
    setAppState('typing');
  };

  const handleTestComplete = (stats: TypingStats) => {
    setResults(stats);
    setAppState('results');
  };

  const handleRestart = () => {
    setResults(null);
    startSoloTest();
  };

  const handleJoinRace = () => {
    setAppState('multiplayer');
  };

  const handleExitMultiplayer = () => {
    setAppState('home');
  };

  const renderHome = () => (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="w-full max-w-2xl mx-auto p-6">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4">
            mon<span className="text-blue-400">KEY</span>mash
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Master touch typing with speed, accuracy, and competition
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Solo Practice */}
          <div className="bg-gray-800 rounded-lg p-8 text-center hover:bg-gray-700 transition-colors cursor-pointer"
               onClick={startSoloTest}>
            <div className="text-4xl mb-4">⌨️</div>
            <h2 className="text-2xl font-bold text-white mb-4">Solo Practice</h2>
            <p className="text-gray-400 mb-6">
              Practice typing at your own pace with instant feedback and detailed statistics.
            </p>
            <div className="btn-primary px-6 py-3 rounded-lg text-white font-semibold inline-block">
              Start Practice
            </div>
          </div>

          {/* Multiplayer Race */}
          <div className="bg-gray-800 rounded-lg p-8 text-center hover:bg-gray-700 transition-colors cursor-pointer"
               onClick={handleJoinRace}>
            <div className="text-4xl mb-4">🏁</div>
            <h2 className="text-2xl font-bold text-white mb-4">Race Mode</h2>
            <p className="text-gray-400 mb-6">
              Compete against other players in real-time typing races. See who's the fastest!
            </p>
            <div className="btn-secondary px-6 py-3 rounded-lg text-white font-semibold inline-block">
              Join Race
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-lg font-semibold text-white mb-2">Real-time Stats</h3>
            <p className="text-sm text-gray-400">
              Track your WPM, accuracy, and progress as you type
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="text-lg font-semibold text-white mb-2">Instant Feedback</h3>
            <p className="text-sm text-gray-400">
              See correct and incorrect characters highlighted in real-time
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl mb-3">🏆</div>
            <h3 className="text-lg font-semibold text-white mb-2">Competitive</h3>
            <p className="text-sm text-gray-400">
              Race against others and climb the leaderboards
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTyping = () => (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="mb-6 text-center">
        <button
          onClick={() => setAppState('home')}
          className="btn-secondary px-4 py-2 rounded-lg text-white font-semibold"
        >
          ← Back to Home
        </button>
      </div>
      <TypingInterface
        text={testText}
        onComplete={handleTestComplete}
        isActive={true}
      />
    </div>
  );

  const renderResults = () => (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="mb-6 text-center">
        <button
          onClick={() => setAppState('home')}
          className="btn-secondary px-4 py-2 rounded-lg text-white font-semibold"
        >
          ← Back to Home
        </button>
      </div>
      {results && (
        <ResultsScreen
          stats={results}
          onRestart={handleRestart}
          onJoinRace={handleJoinRace}
        />
      )}
    </div>
  );

  const renderMultiplayer = () => (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="mb-6 text-center">
        <button
          onClick={handleExitMultiplayer}
          className="btn-secondary px-4 py-2 rounded-lg text-white font-semibold"
        >
          ← Back to Home
        </button>
      </div>
      <MultiplayerRace onExit={handleExitMultiplayer} />
    </div>
  );

  switch (appState) {
    case 'home':
      return renderHome();
    case 'typing':
      return renderTyping();
    case 'results':
      return renderResults();
    case 'multiplayer':
      return renderMultiplayer();
    default:
      return renderHome();
  }
};

export default App;