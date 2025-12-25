// components/ui/WindowControls.tsx
// React import removed
import { X, Minus, Square } from 'lucide-react';
import { useElectron } from '../../lib/electron';

const WindowControls = () => {
  const { minimizeWindow, maximizeWindow, closeWindow } = useElectron();

  return (
    <div className="window-controls">
      <button onClick={minimizeWindow} className="p-2 hover:bg-gray-100" aria-label="Minimize">
        <Minus className="w-4 h-4" />
      </button>
      <button onClick={maximizeWindow} className="p-2 hover:bg-gray-100" aria-label="Maximize">
        <Square className="w-4 h-4" />
      </button>
      <button onClick={closeWindow} className="p-2 hover:bg-red-500 hover:text-white" aria-label="Close">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default WindowControls;