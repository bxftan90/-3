import React from 'react';
import { TreeState } from '../types';

interface UIOverlayProps {
  treeState: TreeState;
  setTreeState: (s: TreeState) => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({ treeState, setTreeState }) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-12 select-none z-10">
      
      {/* Header */}
      <div className="text-center space-y-2 animate-fade-in-down">
        <h1 className="font-serif text-4xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-[#FFFDD0] to-[#C5A059] drop-shadow-lg tracking-wider">
          ARIX SIGNATURE
        </h1>
        <p className="font-sans text-[#006B3C] tracking-[0.3em] text-sm md:text-base uppercase font-bold">
          The Holiday Collection
        </p>
      </div>

      {/* Controls */}
      <div className="pointer-events-auto flex gap-8">
        <button
          onClick={() => setTreeState(TreeState.EXPLODING)}
          className={`
            group relative px-8 py-3 overflow-hidden rounded-sm transition-all duration-500 ease-out
            border border-[#C5A059]/30 backdrop-blur-sm
            ${treeState === TreeState.EXPLODING ? 'bg-[#C5A059]/10' : 'bg-transparent hover:bg-[#C5A059]/10'}
          `}
        >
           <span className="font-serif italic text-xl text-[#FFFDD0] group-hover:text-white transition-colors">
            Scatter
           </span>
           <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#C5A059] to-transparent opacity-50" />
        </button>

        <button
          onClick={() => setTreeState(TreeState.TREE_SHAPE)}
          className={`
            group relative px-8 py-3 overflow-hidden rounded-sm transition-all duration-500 ease-out
            border border-[#C5A059]/30 backdrop-blur-sm
            ${treeState === TreeState.TREE_SHAPE ? 'bg-[#C5A059]/20 shadow-[0_0_30px_-5px_rgba(197,160,89,0.3)]' : 'bg-transparent hover:bg-[#C5A059]/10'}
          `}
        >
           <span className="font-serif italic text-xl text-[#FFFDD0] group-hover:text-white transition-colors">
            Assemble
           </span>
           <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#C5A059] to-transparent opacity-50" />
        </button>
      </div>

      {/* Footer */}
      <div className="text-[#004225] font-sans text-xs opacity-60 tracking-widest">
        INTERACTIVE 3D EXPERIENCE
      </div>
    </div>
  );
};
