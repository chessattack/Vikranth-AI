import React, { useState } from 'react';
import { ModelInfo, ModelCategory } from '../types';
import { MODELS_LIST, CATEGORIES } from '../data/models';
import {
  Check,
  ChevronRight,
  Sparkles,
  Zap,
  Cpu,
  Video,
  Mic,
  Compass,
  Search,
  Sliders,
  X,
} from 'lucide-react';

interface ModelSelectorProps {
  selectedModel: ModelInfo;
  onSelectModel: (model: ModelInfo) => void;
  effort: string;
  onChangeEffort: (effort: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ModelSelectorModal: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onSelectModel,
  effort,
  onChangeEffort,
  isOpen,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEffortMenu, setShowEffortMenu] = useState(false);

  if (!isOpen) return null;

  const filteredModels = MODELS_LIST.filter((model) => {
    const matchesCategory =
      activeCategory === 'all' || model.category === activeCategory;
    const matchesSearch =
      model.premiumName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.feel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.badge.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: ModelCategory) => {
    switch (category) {
      case 'reasoning':
        return <Cpu className="w-4 h-4 text-amber-600" />;
      case 'fast':
        return <Zap className="w-4 h-4 text-emerald-600" />;
      default:
        return <Cpu className="w-4 h-4 text-amber-600" />;
    }
  };

  const effortLevels = ['Low', 'Medium', 'High', 'Deep Thinking'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex justify-between items-center bg-[#FAF9F6]">
          <div>
            <h3 className="font-bold text-lg text-stone-900 flex items-center space-x-2">
              <span>Select Model</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-200 text-stone-700">
                15 Specialized Models
              </span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Choose the optimal model for your reasoning, coding, and creative tasks.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Effort Bar */}
        <div className="p-3 border-b border-stone-100 bg-white flex flex-wrap gap-2 items-center justify-between">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search model by name (e.g. Titan, Vela, Lumina, Prism)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
          </div>

          {/* Effort Picker (matching Claude screenshot: "Effort: Medium >") */}
          <div className="relative">
            <button
              onClick={() => setShowEffortMenu(!showEffortMenu)}
              className="flex items-center space-x-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl border border-stone-200 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5 text-stone-500" />
              <span>Effort: <strong className="text-stone-900">{effort}</strong></span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {showEffortMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-stone-200 py-1 z-50">
                {effortLevels.map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => {
                      onChangeEffort(lvl);
                      setShowEffortMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex justify-between items-center hover:bg-stone-50 transition-colors ${
                      effort === lvl ? 'font-bold text-amber-700 bg-amber-50/50' : 'text-stone-700'
                    }`}
                  >
                    <span>{lvl}</span>
                    {effort === lvl && <Check className="w-3.5 h-3.5 text-amber-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="px-4 py-2 border-b border-stone-100 bg-[#FCFBF8] flex space-x-1.5 overflow-x-auto text-xs no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition-all ${
                activeCategory === cat.id
                  ? 'bg-stone-800 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-200/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Models List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 divide-y divide-stone-100 space-y-1">
          {filteredModels.map((model) => {
            const isSelected = selectedModel.id === model.id;
            return (
              <div
                key={model.id}
                onClick={() => {
                  onSelectModel(model);
                  onClose();
                }}
                className={`p-3.5 rounded-xl cursor-pointer transition-all flex items-start justify-between group ${
                  isSelected
                    ? 'bg-[#FAF0EB] border border-[#F2DACF]'
                    : 'hover:bg-stone-50 border border-transparent'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5 p-2 rounded-xl bg-white border border-stone-200 shadow-2xs group-hover:border-stone-300">
                    {getCategoryIcon(model.category)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-stone-900 text-base">
                        {model.premiumName}
                      </span>
                      <span className="text-[11px] font-semibold text-stone-500 italic">
                        "{model.feel}"
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          model.category === 'reasoning'
                            ? 'bg-amber-100 text-amber-900'
                            : model.category === 'fast'
                            ? 'bg-emerald-100 text-emerald-900'
                            : model.category === 'vision'
                            ? 'bg-purple-100 text-purple-900'
                            : model.category === 'video'
                            ? 'bg-blue-100 text-blue-900'
                            : 'bg-stone-100 text-stone-800'
                        }`}
                      >
                        {model.badge}
                      </span>
                    </div>

                    <p className="text-xs text-stone-600 mt-1 max-w-lg leading-relaxed">
                      {model.description}
                    </p>

                    <div className="flex items-center space-x-3 mt-1.5 text-[11px] text-stone-400">
                      <span>Engine: {model.originalName}</span>
                      {model.effortSupported && <span>• Extended Thinking Supported</span>}
                    </div>
                  </div>
                </div>

                <div className="mt-1">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-[#D45B38] text-white flex items-center justify-center">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-stone-200 group-hover:border-stone-400" />
                  )}
                </div>
              </div>
            );
          })}

          {filteredModels.length === 0 && (
            <div className="p-8 text-center text-stone-400 text-sm">
              No models match your search or filter.
            </div>
          )}
        </div>

        {/* Footer info (matching Claude disclaimer) */}
        <div className="p-3 bg-[#FAF9F6] border-t border-stone-200 text-[11px] text-stone-500 flex justify-between items-center">
          <span>
            Selected: <strong className="text-stone-800">{selectedModel.premiumName}</strong> ({selectedModel.feel})
          </span>
          <span className="text-stone-400">
            {selectedModel.badge}
          </span>
        </div>
      </div>
    </div>
  );
};
