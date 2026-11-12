import React from 'react';
import { Project } from '../data/portfolioData';
import { ExternalLink, Github, Navigation, X, CheckCircle, Layers } from 'lucide-react';

interface Props {
  project: Project | null;
  onClose: () => void;
  onTeleport: (x: number, z: number) => void;
}

export const ProjectModal: React.FC<Props> = ({ project, onClose, onTeleport }) => {
  if (!project) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#101820]/85 backdrop-blur-md animate-fade-in"
      style={{ padding: '16px' }}
    >
      <div
        className="w-full max-w-2xl bg-[#17242D] border border-[#24343D] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#F2F0E9] animate-modal-enter select-text"
        style={{
          padding: '20px',
          boxShadow: '0 25px 60px rgba(16, 24, 32, 0.98), 0 0 35px rgba(232, 117, 69, 0.15)',
        }}
      >
        {/* Header Banner Card */}
        <div
          className="bg-[#24343D]/70 border border-[#24343D] rounded-2xl flex items-start justify-between relative shrink-0 mb-3"
          style={{ padding: '16px 20px' }}
        >
          <div className="pr-6 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-medium tracking-wide bg-[#E87545]/20 text-[#E87545] border border-[#E87545]/40 font-semibold">
                {project.category}
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-medium tracking-wide bg-[#8BAE9B]/15 text-[#8BAE9B] border border-[#8BAE9B]/30 font-semibold">
                {project.status}
              </span>
              <span className="text-xs font-mono text-[#A4B0B5]">{project.year}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F2F0E9] truncate">
              {project.name}
            </h2>
            <p className="text-xs sm:text-sm text-[#A4B0B5] mt-1">{project.tagline}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#17242D] border border-[#24343D] text-[#A4B0B5] hover:text-[#F2F0E9] hover:border-[#E87545] transition-colors shrink-0"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body with Guaranteed Padding */}
        <div
          className="overflow-y-auto space-y-6 flex-1 rounded-2xl bg-[#101820]/40 border border-[#24343D]/60"
          style={{ padding: '22px' }}
        >
          {/* Main Description */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#E87545] font-semibold mb-2">
              Overview
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-[#F2F0E9]/90">{project.longDescription}</p>
          </div>

          {/* Key Architectural Features */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#E87545] font-semibold mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#8BAE9B]" />
              Engineering Highlights
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              {project.features.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 rounded-xl bg-[#24343D]/50 border border-[#24343D]/80 text-xs leading-relaxed text-[#F2F0E9]"
                  style={{ padding: '12px 14px' }}
                >
                  <CheckCircle className="w-4 h-4 text-[#8BAE9B] shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tech Stack */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#E87545] font-semibold mb-2.5">
              Technologies & Infrastructure
            </h3>
            <div className="flex flex-wrap gap-2">
              {project.technologies.map((tech, idx) => (
                <span
                  key={idx}
                  className="rounded-xl bg-[#24343D] border border-[#24343D] text-xs font-mono text-[#F2F0E9] hover:border-[#8BAE9B]/50 transition-colors"
                  style={{ padding: '6px 12px' }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className="bg-[#24343D]/50 border border-[#24343D] rounded-2xl flex flex-wrap items-center justify-between gap-3 shrink-0 mt-3"
          style={{ padding: '12px 18px' }}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onTeleport(project.coordinates.x, project.coordinates.z);
                onClose();
              }}
              className="flex items-center gap-2 rounded-xl bg-[#24343D] hover:bg-[#24343D]/80 border border-[#E87545]/40 text-xs font-medium text-[#E87545] transition-colors"
              style={{ padding: '8px 14px' }}
            >
              <Navigation className="w-4 h-4" />
              Drive Buggy Here
            </button>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl bg-[#17242D] hover:bg-[#24343D] border border-[#24343D] text-xs font-medium text-[#F2F0E9] transition-colors"
              style={{ padding: '8px 14px' }}
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>

            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-xl bg-[#E87545] hover:bg-[#E87545]/90 text-xs font-bold text-[#101820] transition-colors shadow"
                style={{ padding: '8px 16px' }}
              >
                <ExternalLink className="w-4 h-4" />
                Live Project
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
