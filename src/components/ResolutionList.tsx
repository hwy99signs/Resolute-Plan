// Legacy web component - Resolution type not used in React Native app
// import type { Resolve } from '../types';
import { ResolutionCard } from './ResolutionCard';

interface ResolutionListProps {
  resolutions: Resolution[];
  onSelect: (resolution: Resolution) => void;
  onDelete: (id: string) => void;
}

export function ResolutionList({ resolutions, onSelect, onDelete }: ResolutionListProps) {
  return (
    <div className="space-y-3">
      {resolutions.map(resolution => (
        <ResolutionCard
          key={resolution.id}
          resolution={resolution}
          onClick={() => onSelect(resolution)}
          onDelete={() => onDelete(resolution.id)}
        />
      ))}
    </div>
  );
}
