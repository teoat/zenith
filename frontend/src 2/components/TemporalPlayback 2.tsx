import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
import { AccessibleButton } from './ui/AccessibleButton';

interface TemporalPlaybackProps {
  caseId?: string;
  onTimeChange?: (timestamp: Date) => void;
  className?: string;
}

const TemporalPlayback: React.FC<TemporalPlaybackProps> = ({
  onTimeChange,
  className = ''
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const duration = 100; // Mock duration in seconds
  const [speed, setSpeed] = useState(1);

  // Mock timeline data - in real implementation, this would come from API
  const timelineEvents = [
    { timestamp: 10, label: 'Case Opened', type: 'milestone' },
    { timestamp: 25, label: 'First Evidence Uploaded', type: 'evidence' },
    { timestamp: 45, label: 'Initial Analysis Complete', type: 'analysis' },
    { timestamp: 70, label: 'Suspect Identified', type: 'finding' },
    { timestamp: 90, label: 'Case Closed', type: 'milestone' }
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + speed;
          if (next >= duration) {
            setIsPlaying(false);
            return duration;
          }
          const timestamp = new Date(Date.now() - (duration - next) * 1000);
          onTimeChange?.(timestamp);
          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, speed, duration, onTimeChange]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentTime(0);
    setIsPlaying(false);
    onTimeChange?.(new Date());
  };

  const handleSkip = (direction: 'forward' | 'backward') => {
    const skipAmount = 10; // 10 seconds
    setCurrentTime(prev => {
      const next = direction === 'forward' ? prev + skipAmount : prev - skipAmount;
      return Math.max(0, Math.min(duration, next));
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (currentTime / duration) * 100;

  return (
    <div className={`temporal-playback bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
          Temporal Playback
        </h4>
        <div className="flex items-center gap-2">
          <label htmlFor="speed-select" className="text-sm text-slate-600 dark:text-slate-400">
            Speed:
          </label>
          <select
            id="speed-select"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="text-sm border border-slate-300 dark:border-slate-700 rounded px-2 py-1 bg-white dark:bg-slate-800"
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={4}>4x</option>
          </select>
        </div>
      </div>

      {/* Timeline visualization */}
      <div className="relative mb-4 h-16 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden">
        {/* Timeline events */}
        {timelineEvents.map((event, index) => (
          <div
            key={index}
            className="absolute top-0 h-full w-1 bg-blue-500 opacity-70"
            style={{ left: `${(event.timestamp / duration) * 100}%` }}
            title={`${event.label} (${formatTime(event.timestamp)})`}
          />
        ))}

        {/* Progress bar */}
        <div
          className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-100"
          style={{ width: `${progressPercentage}%` }}
        />

        {/* Current time indicator */}
        <div
          className="absolute top-0 w-1 h-full bg-red-500 z-10"
          style={{ left: `${progressPercentage}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AccessibleButton
            onClick={handleReset}
            variant="secondary"
            size="sm"
            aria-label="Reset to beginning"
          >
            <RotateCcw size={16} />
          </AccessibleButton>

          <AccessibleButton
            onClick={() => handleSkip('backward')}
            variant="secondary"
            size="sm"
            aria-label="Skip backward 10 seconds"
          >
            <SkipBack size={16} />
          </AccessibleButton>

          <AccessibleButton
            onClick={handlePlayPause}
            variant="primary"
            size="sm"
            aria-label={isPlaying ? 'Pause playback' : 'Start playback'}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </AccessibleButton>

          <AccessibleButton
            onClick={() => handleSkip('forward')}
            variant="secondary"
            size="sm"
            aria-label="Skip forward 10 seconds"
          >
            <SkipForward size={16} />
          </AccessibleButton>
        </div>

        <div className="text-sm text-slate-600 dark:text-slate-400 font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Timeline scrubber */}
      <div className="mt-4">
        <input
          type="range"
          min={0}
          max={duration}
          value={currentTime}
          onChange={(e) => setCurrentTime(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
          aria-label="Timeline scrubber"
        />
      </div>

      {/* Current event display */}
      <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        {timelineEvents.find(event => Math.abs(event.timestamp - currentTime) < 2)?.label || 'No event at current time'}
      </div>
    </div>
  );
};

export default TemporalPlayback;
