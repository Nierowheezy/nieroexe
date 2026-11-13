import React, { useState } from 'react';
import {
  DEVELOPER_PROFILE,
  PROJECTS,
  EXPERIENCES,
  SKILL_CATEGORIES,
  Project,
} from '../data/portfolioData';
import {
  X,
  User,
  Briefcase,
  Layers,
  Code2,
  FileText,
  Mail,
  Download,
  Github,
  MapPin,
  ExternalLink,
  Phone,
  Copy,
  Check,
  Navigation,
  FileCheck,
} from 'lucide-react';

export type PortfolioTab = 'about' | 'projects' | 'experience' | 'skills' | 'resume' | 'contact';

interface Props {
  isOpen: boolean;
  activeTab: PortfolioTab;
  onTabChange: (tab: PortfolioTab) => void;
  onClose: () => void;
  onSelectProject: (project: Project) => void;
  onTeleport: (x: number, z: number) => void;
}

export const PortfolioModal: React.FC<Props> = ({
  isOpen,
  activeTab,
  onTabChange,
  onClose,
  onSelectProject,
  onTeleport,
}) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

  const copyEmail = () => {
    navigator.clipboard.writeText(DEVELOPER_PROFILE.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessageSent(true);
    setTimeout(() => {
      setMessageSent(false);
      setContactForm({ name: '', email: '', message: '' });
    }, 4000);
  };

  const categories = ['All', 'Open Source & DevTools', 'Fintech & Assets', 'GIS & Mapping', 'Civic-Tech', 'Media & Broadcasting', 'Enterprise Systems'];

  const filteredProjects = selectedCategory === 'All'
    ? PROJECTS
    : PROJECTS.filter(p => p.category === selectedCategory);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#101820]/90 backdrop-blur-md animate-fade-in p-2.5 sm:p-5"
      style={{
        paddingTop: 'max(10px, env(safe-area-inset-top))',
        paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
      }}
    >
      {/* Spacious Modal Dialog with responsive padding */}
      <div
        className="w-full max-w-5xl xl:max-w-6xl max-h-[92dvh] bg-[#17242D] border border-[#24343D] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col text-[#F2F0E9] animate-modal-enter select-text p-3 sm:p-5"
        style={{
          boxShadow: '0 25px 60px rgba(16, 24, 32, 0.98), 0 0 40px rgba(232, 117, 69, 0.12)',
        }}
      >
        {/* Top Header Card */}
        <div
          className="bg-[#24343D]/70 border border-[#24343D] rounded-2xl flex items-center justify-between shrink-0 mb-2.5 sm:mb-3 px-3.5 py-3 sm:px-5 sm:py-4"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#E87545] text-[#101820] font-mono font-bold flex items-center justify-center text-sm sm:text-base shadow shrink-0">
              NE
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-xl font-bold text-[#F2F0E9] tracking-tight truncate">
                  {DEVELOPER_PROFILE.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-[#E87545]/20 text-[#E87545] border border-[#E87545]/30 shrink-0 font-semibold">
                  {DEVELOPER_PROFILE.handle}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#A4B0B5] flex items-center gap-2 mt-0.5 truncate">
                <span className="truncate">{DEVELOPER_PROFILE.title}</span>
                <span>•</span>
                <span className="flex items-center gap-1 shrink-0 text-[#8BAE9B]">
                  <MapPin className="w-3.5 h-3.5" /> {DEVELOPER_PROFILE.location}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-[#17242D] border border-[#24343D] text-[#A4B0B5] hover:text-[#F2F0E9] hover:border-[#E87545] transition-colors shrink-0 ml-3"
            title="Return to 3D World"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Bar Card */}
        <div
          className="bg-[#17242D] border border-[#24343D] rounded-2xl flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 mb-3"
          style={{ padding: '6px 10px' }}
        >
          {[
            { id: 'about', label: 'About', icon: User },
            { id: 'projects', label: 'Projects', icon: Layers, badge: PROJECTS.length },
            { id: 'experience', label: 'Experience', icon: Briefcase },
            { id: 'skills', label: 'Skills', icon: Code2 },
            { id: 'resume', label: 'Resume', icon: FileText, highlight: true },
            { id: 'contact', label: 'Contact', icon: Mail },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id as PortfolioTab)}
                className={`flex items-center gap-2 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 ${
                  isActive
                    ? 'bg-[#E87545] text-[#101820] font-bold shadow'
                    : 'bg-transparent text-[#A4B0B5] hover:text-[#F2F0E9] hover:bg-[#24343D]/50'
                }`}
                style={{ padding: '8px 16px' }}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#101820]' : 'text-[#A4B0B5]'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive ? 'bg-[#101820] text-[#E87545]' : 'bg-[#24343D] text-[#A4B0B5]'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body Container */}
        <div
          className="flex-1 overflow-y-auto space-y-5 sm:space-y-8 rounded-2xl bg-[#101820]/40 border border-[#24343D]/60 p-3.5 sm:p-6"
        >
          {/* TAB 1: ABOUT */}
          {activeTab === 'about' && (
            <div className="space-y-6 sm:space-y-8">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#E87545] font-semibold block mb-1.5">
                  Engineering Profile
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#F2F0E9] mb-3 leading-tight">
                  Architecting Scalable Platforms & High-Performance WebGL Worlds
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-[#A4B0B5] max-w-4xl">
                  {DEVELOPER_PROFILE.summary}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Engineering Experience', value: DEVELOPER_PROFILE.stats.yearsExperience },
                  { label: 'Shipped Systems', value: DEVELOPER_PROFILE.stats.projectsCompleted },
                  { label: 'Mastered Technologies', value: DEVELOPER_PROFILE.stats.technologiesMastered },
                  { label: 'Client Satisfaction', value: DEVELOPER_PROFILE.stats.clientSatisfaction },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="rounded-2xl bg-[#24343D]/50 border border-[#24343D] text-center sm:text-left shadow-sm"
                    style={{ padding: '20px' }}
                  >
                    <div className="text-2xl sm:text-3xl font-bold font-mono text-[#E87545]">{stat.value}</div>
                    <div className="text-xs sm:text-sm text-[#A4B0B5] mt-1 font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Formal Education */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#8BAE9B] font-semibold mb-3 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-[#8BAE9B]" />
                  Formal Education & Degrees
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                  {DEVELOPER_PROFILE.education.map((edu, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl bg-[#24343D]/40 border border-[#24343D] flex flex-col justify-between space-y-3"
                      style={{ padding: '20px' }}
                    >
                      <div>
                        <h4 className="text-base font-bold text-[#F2F0E9]">{edu.degree}</h4>
                        <p className="text-xs sm:text-sm text-[#A4B0B5] mt-1 leading-relaxed">{edu.school}</p>
                      </div>
                      <div className="flex items-center justify-between text-xs font-mono text-[#8BAE9B] pt-3 border-t border-[#24343D]/70">
                        <span>{edu.location}</span>
                        <span>{edu.year}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROJECTS - 2 Spacious Cards per Row */}
          {activeTab === 'projects' && (
            <div className="space-y-6 sm:space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-[#E87545] font-semibold block mb-1">
                    Software Portfolio
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#F2F0E9]">
                    Public Repositories & Enterprise Systems ({filteredProjects.length})
                  </h2>
                  <p className="text-xs sm:text-sm text-[#A4B0B5] mt-1">
                    Represented as physical 3D monuments with floating billboards in the world.
                  </p>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-2 pb-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-xl text-xs font-mono transition-colors ${
                      selectedCategory === cat
                        ? 'bg-[#E87545] text-[#101820] font-bold shadow'
                        : 'bg-[#24343D]/60 text-[#A4B0B5] hover:text-[#F2F0E9] hover:bg-[#24343D]'
                    }`}
                    style={{ padding: '8px 14px' }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Projects Grid: Exactly 2 Spacious Cards per Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                {filteredProjects.map(project => (
                  <div
                    key={project.id}
                    className="rounded-2xl bg-[#24343D]/40 border border-[#24343D] hover:border-[#E87545]/50 transition-all flex flex-col justify-between space-y-4 shadow-sm"
                    style={{ padding: '22px' }}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                        <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-[#E87545]/15 text-[#E87545] border border-[#E87545]/30 font-semibold">
                          {project.category}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-[#8BAE9B]">{project.status}</span>
                          <span className="text-xs font-mono text-[#A4B0B5]">{project.year}</span>
                        </div>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-[#F2F0E9]">{project.name}</h3>
                      <p className="text-xs sm:text-sm text-[#A4B0B5] mt-1.5 leading-relaxed">
                        {project.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {project.technologies.slice(0, 5).map((t, idx) => (
                          <span
                            key={idx}
                            className="rounded-md text-[11px] font-mono bg-[#17242D] border border-[#24343D] text-[#A4B0B5]"
                            style={{ padding: '4px 10px' }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3.5 border-t border-[#24343D] gap-3">
                      <button
                        onClick={() => {
                          onTeleport(project.coordinates.x, project.coordinates.z);
                          onClose();
                        }}
                        className="flex items-center gap-2 text-xs sm:text-sm text-[#8BAE9B] hover:text-[#F2F0E9] font-medium"
                      >
                        <Navigation className="w-4 h-4" />
                        Teleport Here
                      </button>

                      <button
                        onClick={() => {
                          onSelectProject(project);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 text-xs sm:text-sm text-[#E87545] hover:underline font-semibold"
                      >
                        Inspect Object →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: EXPERIENCE */}
          {activeTab === 'experience' && (
            <div className="space-y-6 sm:space-y-8">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#E87545] font-semibold block mb-1">
                  Career Timeline
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#F2F0E9]">Work Experience & Key Contributions</h2>
                <p className="text-xs sm:text-sm text-[#A4B0B5] mt-1">
                  5+ years across fintech, media broadcasting, graphic design SaaS, and engineering mentorship.
                </p>
              </div>

              <div className="space-y-5">
                {EXPERIENCES.map((exp, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl bg-[#24343D]/40 border border-[#24343D] space-y-3.5"
                    style={{ padding: '22px' }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-[#F2F0E9]">{exp.role}</h3>
                        <p className="text-xs sm:text-sm text-[#E87545] font-semibold mt-0.5">{exp.company}</p>
                      </div>
                      <div className="text-xs font-mono text-[#8BAE9B] flex items-center gap-2">
                        <span>{exp.period}</span>
                        <span>•</span>
                        <span>{exp.location}</span>
                      </div>
                    </div>

                    <ul className="space-y-2 pt-2.5 border-t border-[#24343D]/70">
                      {exp.highlights.map((h, hIdx) => (
                        <li
                          key={hIdx}
                          className="text-xs sm:text-sm text-[#A4B0B5] flex items-start gap-2.5 leading-relaxed"
                        >
                          <span className="text-[#8BAE9B] font-bold shrink-0 mt-0.5">•</span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SKILLS - 2 Spacious Cards per Row */}
          {activeTab === 'skills' && (
            <div className="space-y-6 sm:space-y-8">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#E87545] font-semibold block mb-1">
                  Competencies
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#F2F0E9]">Technical Capabilities & Tooling</h2>
                <p className="text-xs sm:text-sm text-[#A4B0B5] mt-1 leading-relaxed">
                  Deep engineering stack from distributed cloud backends to modern 3D WebGL interfaces.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                {SKILL_CATEGORIES.map((cat, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl bg-[#24343D]/40 border border-[#24343D] space-y-3.5 shadow-sm flex flex-col justify-between"
                    style={{ padding: '22px' }}
                  >
                    <div>
                      <div className="flex items-center justify-between border-b border-[#24343D]/70 pb-2.5 mb-3">
                        <h3 className="text-xs sm:text-sm font-mono uppercase tracking-wider text-[#E87545] font-bold">
                          {cat.category}
                        </h3>
                        <span className="text-[11px] font-mono text-[#8BAE9B] px-2 py-0.5 rounded bg-[#17242D] border border-[#24343D]">
                          {cat.skills.length} Skills
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {cat.skills.map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="rounded-xl bg-[#17242D] border border-[#24343D] text-xs font-mono text-[#F2F0E9] hover:border-[#8BAE9B]/60 hover:text-[#8BAE9B] transition-colors"
                            style={{ padding: '6px 12px' }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: RESUME */}
          {activeTab === 'resume' && (
            <div className="space-y-6 sm:space-y-8">
              {/* Header Card with CTA */}
              <div
                className="rounded-2xl bg-[#24343D]/50 border border-[#24343D] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                style={{ padding: '22px' }}
              >
                <div className="space-y-1">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#E87545] font-semibold block">
                    Verified Curriculum Vitae
                  </span>
                  <h2 className="text-lg font-bold text-[#F2F0E9]">
                    Olaniyi_Olabode_David_Resume.pdf
                  </h2>
                  <p className="text-xs sm:text-sm text-[#A4B0B5] leading-relaxed">
                    Full Stack Software Engineer • 5+ Years Experience • Systems Engineering
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <a
                    href={DEVELOPER_PROFILE.resumePdfUrl}
                    download="Olaniyi_Olabode_David_Resume.pdf"
                    className="flex items-center gap-2 rounded-xl bg-[#E87545] text-[#101820] text-xs sm:text-sm font-bold hover:bg-[#E87545]/90 transition-colors shadow shrink-0"
                    style={{ padding: '10px 18px' }}
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </a>

                  <a
                    href={DEVELOPER_PROFILE.resumePdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl bg-[#17242D] border border-[#24343D] text-xs sm:text-sm font-medium text-[#F2F0E9] hover:border-[#8BAE9B] transition-colors shrink-0"
                    style={{ padding: '10px 18px' }}
                  >
                    <ExternalLink className="w-4 h-4 text-[#8BAE9B]" />
                    Open in Tab
                  </a>
                </div>
              </div>

              {/* Highlights Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                  className="rounded-xl bg-[#24343D]/30 border border-[#24343D] space-y-1"
                  style={{ padding: '16px' }}
                >
                  <div className="font-bold text-xs sm:text-sm text-[#F2F0E9]">Architecture & Cloud</div>
                  <div className="text-xs text-[#A4B0B5] leading-relaxed">AWS (EC2, S3, RDS), Docker, Nginx, PostgreSQL, Redis, SignalR WebSockets</div>
                </div>
                <div
                  className="rounded-xl bg-[#24343D]/30 border border-[#24343D] space-y-1"
                  style={{ padding: '16px' }}
                >
                  <div className="font-bold text-xs sm:text-sm text-[#F2F0E9]">Frontend Engineering</div>
                  <div className="text-xs text-[#A4B0B5] leading-relaxed">React, Next.js, TypeScript, Three.js WebGL, Tailwind CSS, Framer Motion</div>
                </div>
                <div
                  className="rounded-xl bg-[#24343D]/30 border border-[#24343D] space-y-1"
                  style={{ padding: '16px' }}
                >
                  <div className="font-bold text-xs sm:text-sm text-[#F2F0E9]">Impact & Metrics</div>
                  <div className="text-xs text-[#A4B0B5] leading-relaxed">+40% faster load times, 60.2K push active users, 45% infrastructure savings</div>
                </div>
              </div>

              {/* PDF Preview Frame */}
              <div className="w-full h-96 sm:h-[480px] rounded-2xl overflow-hidden border border-[#24343D] bg-[#101820] shadow-inner">
                <iframe
                  src={DEVELOPER_PROFILE.resumePdfUrl}
                  className="w-full h-full block"
                  title="Olabode Olaniyi David Resume"
                />
              </div>
            </div>
          )}

          {/* TAB 6: CONTACT - Guaranteed 16-20px padding on every single channel card */}
          {activeTab === 'contact' && (
            <div className="space-y-6 sm:space-y-8">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#E87545] font-semibold block mb-1">
                  Reach Out
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#F2F0E9]">Let's Connect & Collaborate</h2>
                <p className="text-xs sm:text-sm text-[#A4B0B5] mt-1 leading-relaxed">
                  Available for full-time senior software engineering roles, enterprise architecture contracts, and open-source inquiries.
                </p>
              </div>

              {/* Direct Channels Grid: Exactly 2 cards per row with guaranteed padding */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div
                  className="rounded-2xl bg-[#24343D]/50 border border-[#24343D] flex items-center justify-between shadow-sm"
                  style={{ padding: '16px 20px' }}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Mail className="w-5 h-5 text-[#E87545] shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-mono text-[#A4B0B5]">Direct Email</div>
                      <div className="text-xs sm:text-sm font-bold text-[#F2F0E9] truncate mt-0.5">
                        {DEVELOPER_PROFILE.email}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={copyEmail}
                    className="p-2 rounded-xl bg-[#17242D] border border-[#24343D] text-[#A4B0B5] hover:text-[#F2F0E9] transition-colors shrink-0 ml-3"
                    title="Copy Email"
                  >
                    {copiedEmail ? <Check className="w-4 h-4 text-[#8BAE9B]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <a
                  href={DEVELOPER_PROFILE.github}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-[#24343D]/50 border border-[#24343D] hover:border-[#E87545]/40 flex items-center justify-between transition-colors shadow-sm"
                  style={{ padding: '16px 20px' }}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Github className="w-5 h-5 text-[#8BAE9B] shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-mono text-[#A4B0B5]">GitHub Profile</div>
                      <div className="text-xs sm:text-sm font-bold text-[#F2F0E9] truncate mt-0.5">@nierowheezy</div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-[#A4B0B5] shrink-0 ml-3" />
                </a>

                <div
                  className="rounded-2xl bg-[#24343D]/50 border border-[#24343D] flex items-center gap-3.5 shadow-sm"
                  style={{ padding: '16px 20px' }}
                >
                  <Phone className="w-5 h-5 text-[#8BAE9B] shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[11px] font-mono text-[#A4B0B5]">Phone & WhatsApp</div>
                    <div className="text-xs sm:text-sm font-bold text-[#F2F0E9] truncate mt-0.5">{DEVELOPER_PROFILE.phone}</div>
                  </div>
                </div>

                <div
                  className="rounded-2xl bg-[#24343D]/50 border border-[#24343D] flex items-center gap-3.5 shadow-sm"
                  style={{ padding: '16px 20px' }}
                >
                  <MapPin className="w-5 h-5 text-[#E87545] shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[11px] font-mono text-[#A4B0B5]">Current Location</div>
                    <div className="text-xs sm:text-sm font-bold text-[#F2F0E9] truncate mt-0.5">{DEVELOPER_PROFILE.location}</div>
                  </div>
                </div>
              </div>

              {/* Direct Message Form */}
              <form
                onSubmit={handleContactSubmit}
                className="rounded-2xl bg-[#24343D]/30 border border-[#24343D] space-y-4"
                style={{ padding: '22px' }}
              >
                <div className="flex items-center justify-between border-b border-[#24343D]/60 pb-2.5">
                  <h3 className="text-xs sm:text-sm font-mono uppercase tracking-wider text-[#E87545] font-bold">
                    Send a Direct Message
                  </h3>
                  <span className="text-[11px] font-mono text-[#8BAE9B]">Fast Response</span>
                </div>

                {messageSent ? (
                  <div
                    className="rounded-xl bg-[#8BAE9B]/20 border border-[#8BAE9B]/40 text-[#8BAE9B] text-xs sm:text-sm font-medium flex items-center gap-3"
                    style={{ padding: '16px' }}
                  >
                    <Check className="w-5 h-5 shrink-0" />
                    Thank you! Your message has been sent. Olabode will respond to your email promptly.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-mono text-[#A4B0B5] block mb-1.5">Your Name</label>
                        <input
                          type="text"
                          required
                          value={contactForm.name}
                          onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                          className="w-full rounded-xl bg-[#17242D] border border-[#24343D] text-xs sm:text-sm text-[#F2F0E9] focus:outline-none focus:border-[#E87545] transition-colors"
                          style={{ padding: '10px 14px' }}
                          placeholder="Ada Lovelace"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-mono text-[#A4B0B5] block mb-1.5">Your Email</label>
                        <input
                          type="email"
                          required
                          value={contactForm.email}
                          onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                          className="w-full rounded-xl bg-[#17242D] border border-[#24343D] text-xs sm:text-sm text-[#F2F0E9] focus:outline-none focus:border-[#E87545] transition-colors"
                          style={{ padding: '10px 14px' }}
                          placeholder="ada@example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-mono text-[#A4B0B5] block mb-1.5">Message</label>
                      <textarea
                        required
                        rows={3}
                        value={contactForm.message}
                        onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                        className="w-full rounded-xl bg-[#17242D] border border-[#24343D] text-xs sm:text-sm text-[#F2F0E9] focus:outline-none focus:border-[#E87545] transition-colors leading-relaxed"
                        style={{ padding: '12px 14px' }}
                        placeholder="Hi Olabode, I would love to discuss a project..."
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-xl bg-[#E87545] hover:bg-[#E87545]/90 text-[#101820] text-xs sm:text-sm font-bold font-mono tracking-wider transition-colors shadow"
                      style={{ padding: '12px 20px' }}
                    >
                      SEND MESSAGE
                    </button>
                  </>
                )}
              </form>
            </div>
          )}
        </div>

        {/* Footer Card */}
        <div
          className="bg-[#24343D]/50 border border-[#24343D] rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-[#A4B0B5] shrink-0 mt-2.5 sm:mt-3 px-3.5 py-2.5 sm:px-4 sm:py-3"
        >
          <div className="font-mono text-[11px] sm:text-xs text-[#A4B0B5]">NIERO.EXE // World Portfolio</div>
          <button
            onClick={onClose}
            className="rounded-xl bg-[#17242D] hover:bg-[#24343D] border border-[#24343D] text-xs sm:text-sm font-medium text-[#F2F0E9] transition-colors px-3 py-1.5 sm:px-4 sm:py-2"
          >
            Resume Driving
          </button>
        </div>
      </div>
    </div>
  );
};
