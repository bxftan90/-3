import React from 'react';
import { TreeState } from '../types';

interface UIOverlayProps {
  treeState: TreeState;
  setTreeState: (s: TreeState) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({ treeState, setTreeState, onUpload }) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-8 md:p-12 select-none z-10">
      
      {/* Header - Centered Merry Christmas */}
      <div className="text-center space-y-2 animate-fade-in-down mt-4">
        <h1 className="font-serif text-5xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-b from-[#FFFDD0] to-[#C5A059] drop-shadow-lg tracking-wider">
          Merry Christmas
        </h1>
        <p className="font-sans text-[#006B3C] tracking-[0.3em] text-xs md:text-sm uppercase font-bold">
          ARIX SIGNATURE • The Holiday Collection
        </p>
      </div>

      {/* Gesture Hints - Moved to Bottom Right, Scaled Down */}
      <div className="absolute bottom-8 right-8 flex flex-col gap-1 text-right opacity-70 scale-75 origin-bottom-right bg-black/20 p-4 rounded-lg backdrop-blur-sm border border-[#C5A059]/20">
          <div className="text-[#FFFDD0] text-xs font-sans border-r-2 border-[#C5A059] pr-3 mb-1">
              <span className="font-bold text-[#C5A059]">GESTURE CONTROL</span>
          </div>
          <div className="text-[#FFFDD0] text-xs font-sans border-r-2 border-[#C5A059] pr-3">
              <span className="font-bold">Fist</span> ✊ Assemble
          </div>
          <div className="text-[#FFFDD0] text-xs font-sans border-r-2 border-[#C5A059] pr-3">
              <span className="font-bold">Open</span> ✋ Scatter
          </div>
          <div className="text-[#FFFDD0] text-xs font-sans border-r-2 border-[#C5A059] pr-3">
              <span className="font-bold">Pinch</span> 👌 Magnify Photo
          </div>
          <div className="text-[#FFFDD0] text-xs font-sans border-r-2 border-[#C5A059] pr-3">
              <span className="font-bold">Move</span> 👋 Rotate View
          </div>
      </div>

      {/* Controls */}
      <div className="pointer-events-auto flex flex-col md:flex-row gap-4 md:gap-8 items-center mb-12">
        
        {/* Upload Button */}
        <label className="cursor-pointer group relative px-6 py-2 overflow-hidden rounded-sm border border-[#C5A059]/30 bg-[#C5A059]/10 hover:bg-[#C5A059]/20 transition-all">
            <span className="font-serif italic text-lg text-[#FFFDD0]">+ Add Memory</span>
            <input type="file" accept="image/*" multiple onChange={onUpload} className="hidden" />
        </label>

        <div className="flex gap-4">
            <button
            onClick={() => setTreeState(TreeState.EXPLODING)}
            className={`
                group relative px-6 py-2 overflow-hidden rounded-sm transition-all duration-500 ease-out
                border border-[#C5A059]/30 backdrop-blur-sm
                ${treeState === TreeState.EXPLODING ? 'bg-[#C5A059]/10' : 'bg-transparent hover:bg-[#C5A059]/10'}
            `}
            >
            <span className="font-serif italic text-lg text-[#FFFDD0] group-hover:text-white transition-colors">
                Scatter
            </span>
            </button>

            <button
            onClick={() => setTreeState(TreeState.TREE_SHAPE)}
            className={`
                group relative px-6 py-2 overflow-hidden rounded-sm transition-all duration-500 ease-out
                border border-[#C5A059]/30 backdrop-blur-sm
                ${treeState === TreeState.TREE_SHAPE ? 'bg-[#C5A059]/20 shadow-[0_0_30px_-5px_rgba(197,160,89,0.3)]' : 'bg-transparent hover:bg-[#C5A059]/10'}
            `}
            >
            <span className="font-serif italic text-lg text-[#FFFDD0] group-hover:text-white transition-colors">
                Assemble
            </span>
            </button>
        </div>
      </div>
    </div>
  );
};