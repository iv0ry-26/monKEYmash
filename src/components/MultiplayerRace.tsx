import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import TypingInterface from './TypingInterface';

interface RaceUser {
  id: string;
  username: string;
  progress: number;
  finished?: boolean;
  rank?: number;
  stats?: {
    wpm: number;
    accuracy: number;
    timeTaken: number;
  };
}

interface LobbyState {
  users: RaceUser[];
  countdown: number;
  status: 'waiting' | 'countdown' | 'racing' | 'finished';
}

interface RaceStart {
  raceText: string;
  startTime: number;
}

interface UserFinished {
  rank: number;
  stats: {
    wpm: number;
    accuracy: number;
    timeTaken: number;
  };
  currentStandings: Array<{
    rank: number;
    username: string;
    wpm: number;
    accuracy: number;
    timeTaken: number;
  }>;
}

interface RaceResults {
  results: Array<{
    rank: number;
    username: string;
    wpm: number;
    accuracy: number;
    timeTaken: number;
  }>;
  finished: boolean;
}

interface MultiplayerRaceProps {
  onExit: () => void;
}

const MultiplayerRace: React.FC<MultiplayerRaceProps> = ({ onExit }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [lobbyState, setLobbyState] = useState<LobbyState>({
    users: [],
    countdown: 0,
    status: 'waiting'
  });
  const [raceText, setRaceText] = useState('');
  const [raceStartTime, setRaceStartTime] = useState<number | null>(null);
  const [raceResults, setRaceResults] = useState<RaceResults | null>(null);
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [currentStandings, setCurrentStandings] = useState<UserFinished['currentStandings']>([]);
  const [wasInLobby, setWasInLobby] = useState(false);

  useEffect(() => {
    // Initialize socket connection with reconnection options
    const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
    const newSocket = io(serverUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
    });
    setSocket(newSocket);

    // Socket event listeners
    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      setIsReconnecting(false);
      setConnectionError(null);
      
      // Rejoin lobby if we were in one before disconnect
      if (wasInLobby && username.trim() && hasJoined) {
        console.log('Reconnecting to lobby...');
        newSocket.emit('joinLobby', { username: username.trim(), reconnect: true });
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // Server disconnected the client, manual reconnect needed
        setConnectionError('Disconnected from server. Please refresh the page.');
      } else {
        // Client-side disconnect or connection lost, will auto-reconnect
        setIsReconnecting(true);
      }
    });

    newSocket.on('reconnect_attempt', () => {
      console.log('Attempting to reconnect...');
      setIsReconnecting(true);
      setConnectionError(null);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected after', attemptNumber, 'attempts');
      setIsReconnecting(false);
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
      setIsReconnecting(true);
      setConnectionError('Connection lost. Attempting to reconnect...');
    });

    newSocket.on('reconnect_failed', () => {
      console.error('Failed to reconnect');
      setIsReconnecting(false);
      setConnectionError('Failed to reconnect. Please refresh the page.');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnectionError('Unable to connect to server. Please check your connection.');
      setIsConnected(false);
    });

    newSocket.on('lobbyState', (data: LobbyState) => {
      setLobbyState(data);
    });

    newSocket.on('raceStart', (data: RaceStart) => {
      setRaceText(data.raceText);
      setRaceStartTime(data.startTime);
      setLobbyState(prev => ({ ...prev, status: 'racing' }));
    });

    newSocket.on('opponentProgress', (data: { userId: string; progress: number }) => {
      setLobbyState(prev => ({
        ...prev,
        users: prev.users.map(user => 
          user.id === data.userId 
            ? { ...user, progress: data.progress }
            : user
        )
      }));
    });

    newSocket.on('userFinished', (data: UserFinished) => {
      setMyRank(data.rank);
      setCurrentStandings(data.currentStandings);
      console.log(`You finished in rank ${data.rank}!`, data.currentStandings);
    });

    newSocket.on('opponentFinished', (data: { userId: string; username: string; rank: number; stats: any }) => {
      setLobbyState(prev => ({
        ...prev,
        users: prev.users.map(user => 
          user.id === data.userId 
            ? { ...user, finished: true, rank: data.rank, stats: data.stats }
            : user
        )
      }));
    });

    newSocket.on('raceResults', (data: RaceResults) => {
      setRaceResults(data);
      setLobbyState(prev => ({ ...prev, status: 'finished' }));
    });

    newSocket.on('raceError', (error: { message: string; code?: string }) => {
      console.error('Race error:', error);
      setConnectionError(error.message || 'An error occurred during the race.');
    });

    newSocket.on('lobbyError', (error: { message: string; code?: string }) => {
      console.error('Lobby error:', error);
      setConnectionError(error.message || 'An error occurred in the lobby.');
    });

    newSocket.on('raceTimeout', (data: { message: string; unfinishedUsers?: string[] }) => {
      console.log('Race timeout:', data);
      if (data.unfinishedUsers && data.unfinishedUsers.length > 0) {
        setConnectionError(`${data.message}. Some players did not finish: ${data.unfinishedUsers.join(', ')}`);
      } else {
        setConnectionError(data.message || 'Race time limit reached.');
      }
    });

    return () => {
      newSocket.close();
    };
  }, [wasInLobby, username, hasJoined]);

  const joinLobby = () => {
    if (socket && username.trim() && isConnected) {
      socket.emit('joinLobby', { username: username.trim() });
      setHasJoined(true);
      setWasInLobby(true);
    }
  };

  const handleProgressUpdate = (progress: number) => {
    if (socket && lobbyState.status === 'racing' && isConnected) {
      try {
        // Validate progress value
        const validatedProgress = Math.max(0, Math.min(100, progress));
        socket.emit('progressUpdate', { progress: validatedProgress });
      } catch (error) {
        console.error('Error sending progress update:', error);
      }
    }
  };

  const handleRaceComplete = (stats: any) => {
    if (socket && raceStartTime && isConnected) {
      try {
        const timeTaken = (Date.now() - raceStartTime) / 1000;
        
        // Validate stats
        if (typeof stats.wpm !== 'number' || typeof stats.accuracy !== 'number' || isNaN(stats.wpm) || isNaN(stats.accuracy)) {
          console.error('Invalid race stats:', stats);
          setConnectionError('Invalid race completion data. Please try again.');
          return;
        }

        socket.emit('raceFinished', {
          finalWPM: Math.max(0, stats.wpm),
          finalAccuracy: Math.max(0, Math.min(100, stats.accuracy)),
          timeTaken: Math.max(0, timeTaken)
        });
      } catch (error) {
        console.error('Error completing race:', error);
        setConnectionError('Failed to submit race results. Please try again.');
      }
    }
  };

  const leaveLobby = () => {
    if (socket) {
      socket.emit('leaveLobby');
      socket.disconnect();
      // Reset state
      setHasJoined(false);
      setWasInLobby(false);
      setRaceText('');
      setRaceStartTime(null);
      setMyRank(null);
      setCurrentStandings([]);
      setLobbyState({ users: [], countdown: 0, status: 'waiting' });
      setConnectionError(null);
    }
    onExit();
  };

  const renderLobby = () => (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-6">
          {lobbyState.status === 'waiting' ? '🏁 Join Multiplayer Race' : '⏱️ Race Starting Soon!'}
        </h2>
        
        {!isConnected && !isReconnecting && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
            <p className="text-red-300">Connecting to server...</p>
          </div>
        )}

        {isReconnecting && (
          <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
            <p className="text-yellow-300">Reconnecting to server...</p>
            <p className="text-sm text-yellow-400 mt-1">Please wait, we'll restore your connection shortly.</p>
          </div>
        )}

        {connectionError && !isReconnecting && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
            <p className="text-red-300">{connectionError}</p>
            {connectionError.includes('refresh') && (
              <button
                onClick={() => window.location.reload()}
                className="mt-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-colors"
              >
                Refresh Page
              </button>
            )}
          </div>
        )}

        {isConnected && !connectionError && (
          <div className="mb-6 p-2 bg-green-900/20 border border-green-700 rounded-lg">
            <p className="text-green-300 text-sm flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              Connected
            </p>
          </div>
        )}

        {lobbyState.status === 'waiting' && !hasJoined && (
          <div className="mb-6">
            <p className="text-gray-300 mb-4">Enter your name to join the race lobby</p>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full max-w-xs px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
              onKeyPress={(e) => e.key === 'Enter' && joinLobby()}
              autoFocus
            />
            <button
              onClick={joinLobby}
              disabled={!username.trim() || !isConnected}
              className="mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-8 py-3 rounded-lg text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Join Race
            </button>
          </div>
        )}

        {hasJoined && lobbyState.status === 'waiting' && (
          <div className="mb-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
            <p className="text-blue-300">Waiting for more players to join...</p>
            <p className="text-sm text-gray-400 mt-2">Race will start when 2 or more players are ready</p>
          </div>
        )}

        {lobbyState.status === 'countdown' && (
          <div className="mb-6">
            <div className="text-8xl font-bold text-blue-400 mb-4 animate-pulse">
              {lobbyState.countdown}
            </div>
            <p className="text-xl text-gray-300">Get your fingers ready! 🚀</p>
          </div>
        )}

        {/* Players List */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            Players in Lobby ({lobbyState.users.length}/6)
          </h3>
          <div className="space-y-2">
            {lobbyState.users.map((user, index) => (
              <div 
                key={user.id} 
                className="flex justify-between items-center p-4 bg-gray-700 rounded-lg hover:bg-gray-650 transition-colors"
              >
                <div className="flex items-center">
                  <span className="text-2xl mr-3">
                    {index === 0 ? '👑' : '👤'}
                  </span>
                  <span className="text-white font-medium">{user.username}</span>
                </div>
                {user.finished && user.rank && (
                  <span className="text-green-400 font-semibold">
                    #{user.rank} - {user.stats?.wpm} WPM
                  </span>
                )}
                {!user.finished && lobbyState.status === 'waiting' && (
                  <span className="text-green-400 text-sm">Ready</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          {hasJoined && lobbyState.status !== 'finished' && (
            <button
              onClick={leaveLobby}
              className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg text-white font-semibold transition-colors"
            >
              Leave Race
            </button>
          )}
          <button
            onClick={onExit}
            className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg text-white font-semibold transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );

  const renderRaceTrack = () => (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <div className="bg-gray-800 rounded-lg p-6 mb-4">
          <h2 className="text-2xl font-bold text-white mb-4 text-center">
            🏁 Race in Progress
          </h2>
          
          {/* Race Track */}
          <div className="race-track space-y-3">
            {lobbyState.users
              .sort((a, b) => (b.progress || 0) - (a.progress || 0))
              .map((user) => {
                const isMe = user.id === socket?.id;
                return (
                  <div key={user.id} className={`p-3 rounded-lg ${isMe ? 'bg-blue-900/30 border-2 border-blue-500' : 'bg-gray-700'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <span className="text-xl mr-2">
                          {user.finished ? '✅' : '🏃'}
                        </span>
                        <span className={`font-semibold ${isMe ? 'text-blue-300' : 'text-white'}`}>
                          {user.username} {isMe ? '(You)' : ''}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-400 text-sm">{Math.round(user.progress)}%</span>
                        {user.finished && user.rank && (
                          <span className="ml-3 text-green-400 font-bold">#{user.rank}</span>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${
                          user.finished ? 'bg-green-500' :
                          isMe ? 'bg-blue-500' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${user.progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Current Standings */}
          {myRank && currentStandings.length > 0 && (
            <div className="mt-6 p-4 bg-green-900/20 border border-green-700 rounded-lg">
              <h3 className="text-lg font-bold text-green-300 mb-2">
                🎉 You finished #{myRank}!
              </h3>
              <p className="text-sm text-gray-300">
                Waiting for other racers to finish...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Typing Interface */}
      {raceText && lobbyState.status === 'racing' && (
        <TypingInterface
          text={raceText}
          onComplete={handleRaceComplete}
          isActive={!myRank && isConnected}
          onProgressUpdate={handleProgressUpdate}
        />
      )}

      {/* Countdown message - race text not ready yet */}
      {lobbyState.status === 'countdown' && (
        <div className="mt-6 p-6 bg-gray-800 rounded-lg text-center">
          <p className="text-gray-300 text-lg">
            Race text will appear when countdown reaches zero!
          </p>
        </div>
      )}

      {/* Leave Race button during race */}
      <div className="mt-6 text-center">
        <button
          onClick={leaveLobby}
          className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg text-white font-semibold transition-colors"
        >
          Leave Race
        </button>
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="w-full max-w-3xl mx-auto p-6">
      <div className="bg-gray-800 rounded-lg p-8">
        <h2 className="text-4xl font-bold text-white mb-2 text-center">
          🏁 Race Complete!
        </h2>
        <p className="text-gray-400 text-center mb-8">
          {myRank === 1 ? '🏆 Congratulations! You won the race!' :
           myRank === 2 ? '🥈 Great job! Second place!' :
           myRank === 3 ? '🥉 Excellent! Third place!' :
           `You finished in ${myRank}${myRank && myRank > 3 ? 'th' : ''} place!`}
        </p>
        
        {raceResults && (
          <div className="space-y-3 mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">Final Standings</h3>
            {raceResults.results.map((result, index) => {
              const isMe = result.username === username;
              return (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg transition-all ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-900/40 to-yellow-800/20 border-2 border-yellow-600' :
                    index === 1 ? 'bg-gradient-to-r from-gray-700/40 to-gray-600/20 border-2 border-gray-500' :
                    index === 2 ? 'bg-gradient-to-r from-orange-900/40 to-orange-800/20 border-2 border-orange-600' :
                    isMe ? 'bg-blue-900/30 border-2 border-blue-500' :
                    'bg-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-3xl font-bold mr-4 w-12">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${result.rank}`}
                      </span>
                      <div>
                        <span className="text-white font-semibold text-lg">
                          {result.username} {isMe ? '(You)' : ''}
                        </span>
                        <div className="text-sm text-gray-400">
                          {result.timeTaken.toFixed(1)}s • {result.accuracy}% accuracy
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        index === 0 ? 'text-yellow-400' :
                        index === 1 ? 'text-gray-300' :
                        index === 2 ? 'text-orange-400' :
                        'text-blue-400'
                      }`}>
                        {result.wpm}
                      </div>
                      <div className="text-xs text-gray-400">WPM</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => {
              setRaceResults(null);
              setRaceText('');
              setRaceStartTime(null);
              setMyRank(null);
              setHasJoined(false);
              setCurrentStandings([]);
              setLobbyState({ users: [], countdown: 0, status: 'waiting' });
            }}
            className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg text-white font-semibold transition-colors"
          >
            🏁 Race Again
          </button>
          
          <button
            onClick={onExit}
            className="bg-gray-600 hover:bg-gray-700 px-8 py-3 rounded-lg text-white font-semibold transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );

  if (raceResults) {
    return renderResults();
  }

  if (lobbyState.status === 'racing') {
    return renderRaceTrack();
  }

  return renderLobby();
};

export default MultiplayerRace;
