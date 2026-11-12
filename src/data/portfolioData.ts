/**
 * Portfolio Data for Olabode Olaniyi David (NIERO.EXE)
 * Sourced directly from official resume and public GitHub profile (nierowheezy).
 */

export interface Project {
  id: string;
  name: string;
  tagline: string;
  category: 'GIS & Mapping' | 'Civic-Tech' | 'Fintech & Assets' | 'Security & Crypto' | 'Open Source & DevTools' | 'Media & Broadcasting' | 'Enterprise Systems';
  description: string;
  longDescription: string;
  technologies: string[];
  features: string[];
  landmarkType: 'globe' | 'kiosk' | 'terminal' | 'vault' | 'switch' | 'monolith' | 'tower' | 'gateway' | 'badge';
  coordinates: { x: number; z: number };
  color: string;
  githubUrl: string;
  liveUrl?: string;
  status: 'Production' | 'Active' | 'Completed' | 'Open Source';
  year: string;
}

export interface Experience {
  role: string;
  company: string;
  period: string;
  type: string;
  location: string;
  highlights: string[];
}

export interface SkillCategory {
  category: string;
  skills: string[];
}

export interface DeveloperProfile {
  name: string;
  handle: string;
  title: string;
  tagline: string;
  email: string;
  phone: string;
  location: string;
  github: string;
  linkedin: string;
  resumePdfUrl: string;
  summary: string;
  stats: {
    yearsExperience: string;
    projectsCompleted: string;
    technologiesMastered: string;
    clientSatisfaction: string;
  };
  education: {
    degree: string;
    school: string;
    location: string;
    year: string;
  }[];
}

export const DEVELOPER_PROFILE: DeveloperProfile = {
  name: 'Olabode Olaniyi David',
  handle: 'NIERO.EXE',
  title: 'Full Stack Software Engineer',
  tagline: 'Building scalable web applications, real-time architectures, and interactive digital worlds.',
  email: 'olaniyiolabode99@gmail.com',
  phone: '+2348159432789',
  location: 'Lagos, Nigeria',
  github: 'https://github.com/nierowheezy',
  linkedin: 'https://www.linkedin.com/in/olabode-olaniyi-david',
  resumePdfUrl: '/assets/resume/Olaniyi_Olabode_David_dbf0b21e.pdf',
  summary:
    'Full Stack Software Engineer with 5+ years of experience designing, developing, and optimizing scalable web applications and enterprise solutions across fintech, media, SaaS, and design-tech industries. Skilled in building end-to-end systems with modern frameworks and cloud platforms, with a proven track record of improving performance, reducing operational costs, and driving user engagement.',
  stats: {
    yearsExperience: '5+ Years',
    projectsCompleted: '30+',
    technologiesMastered: '24+',
    clientSatisfaction: '99%',
  },
  education: [
    {
      degree: 'Masters in Information Technology',
      school: 'National Open University',
      location: 'Lagos, Nigeria',
      year: 'Aug 2023',
    },
    {
      degree: 'Bachelor of Science in Systems Engineering',
      school: 'University of Lagos',
      location: 'Lagos, Nigeria',
      year: 'Nov 2018',
    },
  ],
};

export const PROJECTS: Project[] = [
  {
    id: 'postcode-atlas',
    name: 'Nigerian Postcode Atlas',
    tagline: 'Geospatial postal directory & regional coordinate atlas',
    category: 'GIS & Mapping',
    description:
      'A comprehensive geographical intelligence platform providing instant indexing, search, and validation of Nigerian postal codes, administrative zones, and LGA boundaries.',
    longDescription:
      'The Nigerian Postcode Atlas was engineered to resolve critical address validation bottlenecks for logistics, fintech checkout, and government administrative systems across Nigeria. It features sub-millisecond fuzzy search, hierarchical regional grouping from state to postal zone, and interactive boundary visualization.',
    technologies: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'GIS / GeoJSON', 'Tailwind CSS'],
    features: [
      'Sub-millisecond fuzzy search across all 36 states, 774 LGAs, and postal districts',
      'Geospatial coordinate mapping with interactive territory polygons',
      'Lightweight REST API for logistics e-commerce checkout integration',
      'Offline-first client caching for low-bandwidth mobile devices',
    ],
    landmarkType: 'globe',
    coordinates: { x: 38, z: -25 },
    color: '#E87545',
    githubUrl: 'https://github.com/nierowheezy',
    liveUrl: 'https://github.com/nierowheezy/nigerian-postcode-atlas',
    status: 'Production',
    year: '2023 - Present',
  },
  {
    id: 'know-your-rights',
    name: 'KnowYourRights NG',
    tagline: 'Civic legal accessibility kiosk & constitutional guide',
    category: 'Civic-Tech',
    description:
      'An interactive digital human rights and legal information terminal making constitutional protections, police engagement protocols, and citizen rights searchable in plain language.',
    longDescription:
      'KnowYourRights NG democratizes legal literacy for everyday citizens in Nigeria. Built with accessibility and clarity at its core, it breaks down complex statutory jargon into digestible question-and-answer scenarios, emergency contact channels, and localized guidance during civil encounters.',
    technologies: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'PWA', 'IndexedDB'],
    features: [
      'Contextual Q&A on citizen rights during checkpoints, bail, and encounters',
      'Emergency SOS directory for legal aid hotlines across Nigerian states',
      'Completely offline-functional PWA with localized caching',
      'Plain-language legal search with zero lawyer jargon',
    ],
    landmarkType: 'kiosk',
    coordinates: { x: -35, z: -30 },
    color: '#8BAE9B',
    githubUrl: 'https://github.com/nierowheezy',
    liveUrl: 'https://github.com/nierowheezy/know-your-rights-ng',
    status: 'Active',
    year: '2023',
  },
  {
    id: 'mova',
    name: 'Mova',
    tagline: 'Next-generation fintech ledger & asset transfer terminal',
    category: 'Fintech & Assets',
    description:
      'High-throughput financial technology terminal facilitating multi-currency transaction processing, automated ledger reconciliation, and cross-border settlement.',
    longDescription:
      'Mova is built on robust distributed transaction principles, ensuring atomic operations across fiat and multi-currency ledgers. It incorporates real-time WebSocket feeds, automated double-entry bookkeeping, and bank-grade webhook event handlers.',
    technologies: ['Node.js', 'Express', 'PostgreSQL', 'Redis', 'Docker', 'AWS RDS', 'SignalR / WebSockets'],
    features: [
      'Double-entry atomic ledger with millisecond settlement verification',
      'Real-time WebSocket streaming of balance changes and FX rates',
      'Robust idempotency keys preventing duplicate financial charges',
      'Multi-tenant enterprise access control with role-based auditing',
    ],
    landmarkType: 'terminal',
    coordinates: { x: -32, z: 35 },
    color: '#E87545',
    githubUrl: 'https://github.com/nierowheezy',
    liveUrl: 'https://github.com/nierowheezy/mova',
    status: 'Production',
    year: '2022 - 2024',
  },
  {
    id: 'proofmark',
    name: 'Proofmark',
    tagline: 'Cryptographic document authenticity & verification vault',
    category: 'Security & Crypto',
    description:
      'A tamper-evident digital verification scanner and certification vault designed to eliminate credential fraud and validate original documentation in real time.',
    longDescription:
      'Proofmark provides enterprise institutions, universities, and certification bodies with a zero-knowledge, tamper-proof verification mechanism. Utilizing cryptographic hashing and verifiable QR proofs, any document can be authenticated without exposing private underlying payload data.',
    technologies: ['TypeScript', 'React', 'Node.js', 'Cryptography (SHA-256 / Ed25519)', 'Docker', 'PostgreSQL'],
    features: [
      'Instant tamper-evident QR code scanning and cryptographic signature validation',
      'Zero-knowledge proof validation preserving document privacy',
      'Immutable audit logging of issuance and verification events',
      'Self-hosted multi-tenant deployment architecture',
    ],
    landmarkType: 'vault',
    coordinates: { x: 34, z: 32 },
    color: '#8BAE9B',
    githubUrl: 'https://github.com/nierowheezy',
    liveUrl: 'https://github.com/nierowheezy/proofmark',
    status: 'Active',
    year: '2023',
  },
  {
    id: 'use-dark-switch',
    name: 'use-dark-switch',
    tagline: 'Production-ready React Hook for system-aware dark mode',
    category: 'Open Source & DevTools',
    description:
      'An open-source React hook built for effortless dark mode management with system preference synchronization, cross-tab state syncing, and SSR compatibility.',
    longDescription:
      'use-dark-switch solves common dark theme flicker and hydration mismatches. It provides customizable DOM class names, automatic listener for system color-scheme changes, persistent localStorage synchronization across browser tabs, and zero-runtime dependency footprint.',
    technologies: ['React', 'TypeScript', 'Hooks API', 'LocalStorage', 'SSR', 'Jest'],
    features: [
      'Zero hydration flicker for Next.js, Remix, and Vite applications',
      'Automatic sync with OS prefers-color-scheme media queries',
      'Cross-tab BroadcastChannel / storage event synchronization',
      'Lightweight bundle under 1.2kB minified + gzipped',
    ],
    landmarkType: 'switch',
    coordinates: { x: -22, z: -48 },
    color: '#8BAE9B',
    githubUrl: 'https://github.com/Nierowheezy/use-dark-switch',
    liveUrl: 'https://github.com/Nierowheezy/use-dark-switch',
    status: 'Open Source',
    year: '2023',
  },
  {
    id: 'sql-cheatsheet',
    name: 'SQL Comprehensive Cheatsheet',
    tagline: 'Complete reference for basic to advanced SQL & query optimization',
    category: 'Open Source & DevTools',
    description:
      'A widely referenced developer guide and handbook covering core commands, Common Table Expressions (CTEs), window functions, query execution plans, and performance tuning.',
    longDescription:
      'Curated from years of enterprise database administration and engineering across PostgreSQL, MySQL, and SQL Server. Contains practical examples of analytical queries, indexing strategies, dead-lock prevention, and database partitioning.',
    technologies: ['PostgreSQL', 'MySQL', 'SQL Server', 'Database Architecture', 'Query Tuning', 'Markdown'],
    features: [
      'Comprehensive breakdown of CTEs, recursive queries, and subqueries',
      'Window functions reference (ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD)',
      'Index design guidelines (B-Tree, Hash, GIN, GiST) and EXPLAIN ANALYZE tips',
      'Transaction isolation levels and ACID compliance best practices',
    ],
    landmarkType: 'monolith',
    coordinates: { x: 22, z: -48 },
    color: '#E87545',
    githubUrl: 'https://github.com/Nierowheezy/sql-cheatsheet',
    liveUrl: 'https://github.com/Nierowheezy/sql-cheatsheet',
    status: 'Open Source',
    year: '2023',
  },
  {
    id: 'xfund-system',
    name: 'Xfund Asset & Portfolio Engine',
    tagline: 'Comprehensive portfolio valuation & real-time asset management system',
    category: 'Fintech & Assets',
    description:
      'Enterprise financial platform integrating automated daily portfolio valuations, multi-currency instrument management, and real-time SignalR WebSocket feeds.',
    longDescription:
      'Spearheaded at iTap Solutions, Xfund serves institutional fund managers. It features real-time feedback loops via WebSockets, multi-tenant automated deploy pipelines in Docker, migration from cloud to high-performance self-hosted PostgreSQL, and live Bloomberg and AG-Grid data feeds.',
    technologies: ['C# / .NET', 'SignalR', 'PostgreSQL', 'Docker', 'Redis', 'AG-Grid', 'Bloomberg API'],
    features: [
      'Automated daily valuations across equities, bonds, and money-market assets',
      'SignalR WebSocket push for millisecond live trader notifications',
      'Decoupled microservice architecture with automated incident & license management',
      'Migrated infrastructure to self-hosted PostgreSQL reducing operational costs by 45%',
    ],
    landmarkType: 'terminal',
    coordinates: { x: -48, z: 18 },
    color: '#E87545',
    githubUrl: 'https://github.com/nierowheezy',
    liveUrl: 'https://github.com/nierowheezy',
    status: 'Production',
    year: '2020 - 2023',
  },
  {
    id: 'channels-tv-platform',
    name: 'Channels TV Platform & Push Engine',
    tagline: 'High-traffic media portal, automated newsletter & Webpushr notification engine',
    category: 'Media & Broadcasting',
    description:
      'Scaled broadcasting web platform serving millions of viewers, automated climate newsletters via Make.com and n8n, and push engine reaching 60K+ active subscribers.',
    longDescription:
      'Engineered for Nigeria’s premier television network (Channels Television / IDS Africa). Built blue-green AWS deployment pipelines improving load times by 40%, integrated Webpushr driving an 89.75% user opt-in rate, and built automated climate news distribution reducing manual editorial work by 80%.',
    technologies: ['Next.js', 'TypeScript', 'PHP / WordPress CMS', 'AWS (EC2, S3, RDS)', 'Docker', 'n8n', 'Webpushr'],
    features: [
      'Push notification infrastructure driving 60.2K active users with 89.75% opt-in',
      'Automated climate news curation using AFP Climate Change API and Mailchimp',
      'Optimized live streaming infrastructure with AWS EC2, Wowza, and OBS Studio',
      'Rebuilt IDS Africa web architecture improving SEO performance by 50%',
    ],
    landmarkType: 'tower',
    coordinates: { x: 48, z: 18 },
    color: '#8BAE9B',
    githubUrl: 'https://github.com/nierowheezy',
    liveUrl: 'https://channelstv.com',
    status: 'Production',
    year: '2023 - Present',
  },
  {
    id: 'ids-africa-portal',
    name: 'IDS Africa Selfcare & CRM Portal',
    tagline: 'Customer self-service portal, subscription billing & Paystack gateway',
    category: 'Enterprise Systems',
    description:
      'Full-stack customer account management and payment processing portal enabling automated subscription renewals and marketer CRM workflows.',
    longDescription:
      'Developed and maintained using Node.js MVC architecture and Paystack API integration. Reduced subscription processing latency by 30%, boosted payment completion rates by 25%, and provided marketers with a robust mobile-first CRM for off-site customer support.',
    technologies: ['Node.js', 'Express.js', 'PostgreSQL', 'Redis', 'Paystack API', 'Docker', 'AWS RDS'],
    features: [
      'Automated Paystack webhook verification and billing cycle renewals',
      'Role-based CRM dashboard with real-time customer subscription analytics',
      'Docker containerized deployment with Redis cache layer',
      'Streamlined customer support turnaround time by 20%',
    ],
    landmarkType: 'gateway',
    coordinates: { x: -18, z: 50 },
    color: '#E87545',
    githubUrl: 'https://github.com/nierowheezy',
    liveUrl: 'https://github.com/nierowheezy',
    status: 'Production',
    year: '2023 - 2024',
  },
  {
    id: 'alat-enterprise',
    name: 'ALAT for Business Enterprise Suite',
    tagline: 'Commercial digital banking suite with automated CI/CD pipelines',
    category: 'Enterprise Systems',
    description:
      'Corporate banking web platform for business accounts, bulk transfers, payroll automation, and financial audit reconciliation.',
    longDescription:
      'Contributed as frontend engineer at Wema Bank (Delon Jobs). Enhanced core banking responsiveness, implemented automated CI/CD deployment pipelines cutting error rates by 10%, and facilitated high-security financial transactions for corporate clients.',
    technologies: ['AngularJS / Angular', 'TypeScript', 'Azure DevOps', 'CI/CD Pipelines', 'REST APIs', 'SCSS'],
    features: [
      'Interactive business dashboard improving user navigation efficiency by 15%',
      'Automated multi-stage continuous deployment with Azure DevOps',
      'Strict banking security compliance, session timeout, and anti-CSRF protections',
      'Reusable component library for consistent enterprise UX',
    ],
    landmarkType: 'gateway',
    coordinates: { x: 18, z: 50 },
    color: '#8BAE9B',
    githubUrl: 'https://github.com/nierowheezy',
    liveUrl: 'https://github.com/nierowheezy',
    status: 'Production',
    year: '2021',
  },
  {
    id: 'html-tags-utils',
    name: 'html-tags-utils',
    tagline: 'Lightweight utility for HTML element attributes & SEO metadata',
    category: 'Open Source & DevTools',
    description:
      'An open-source developer utility library extending standard HTML tag helpers with structured metadata, accessibility attributes, and tag manipulation utilities.',
    longDescription:
      'Designed to simplify server-side rendering, metadata extraction, dynamic OpenGraph tag injection, and schema generation in Node.js and TypeScript web applications.',
    technologies: ['TypeScript', 'Node.js', 'HTML5 Spec', 'Metadata Extraction', 'npm package'],
    features: [
      'Comprehensive dictionary of HTML5 tags, self-closing elements, and semantic roles',
      'Metadata attribute sanitization and validation helpers',
      'Zero-dependency package with comprehensive TypeScript definitions',
      'Automated unit testing suite with 100% test coverage',
    ],
    landmarkType: 'monolith',
    coordinates: { x: -48, z: -12 },
    color: '#8BAE9B',
    githubUrl: 'https://github.com/Nierowheezy/html-tags-utils',
    liveUrl: 'https://github.com/Nierowheezy/html-tags-utils',
    status: 'Open Source',
    year: '2023',
  },
  {
    id: 'github-profile-badges',
    name: 'GitHub Profile Badges Catalog',
    tagline: 'Community reference and unlocking guide for GitHub achievement badges',
    category: 'Open Source & DevTools',
    description:
      'An open-source documentation catalog detailing all available GitHub achievement badges, tier levels, and step-by-step instructions for developers to earn them.',
    longDescription:
      'Created to give developers a transparent, comprehensive directory of GitHub badges (e.g. Pull Shark, Quickdraw, Galaxy Brain, YOLO). Categorizes badges from Very Easy to Hard with clear repository actions needed to unlock them.',
    technologies: ['Markdown', 'GitHub API', 'Developer Education', 'Open Source', 'Community Guide'],
    features: [
      'Detailed criteria and walkthroughs for unlocking rare GitHub achievements',
      'Badges categorized by difficulty levels (Very Easy, Medium, Hard, Secret)',
      'Over 100+ community stars and contributions from global developers',
      'Regularly updated as GitHub introduces new profile achievements',
    ],
    landmarkType: 'badge',
    coordinates: { x: 48, z: -12 },
    color: '#E87545',
    githubUrl: 'https://github.com/Nierowheezy/github-profile-badges',
    liveUrl: 'https://github.com/Nierowheezy/github-profile-badges',
    status: 'Open Source',
    year: '2023',
  },
];

export const EXPERIENCES: Experience[] = [
  {
    role: 'Full Stack Software Engineer',
    company: 'Channels Television / Ids Africa',
    period: 'May 2023 – Present',
    type: 'Hybrid',
    location: 'Lagos, Nigeria',
    highlights: [
      'Optimized software solutions for Channels TV web app using WordPress, PHP, AWS (S3, EC2, RDS), MySQL, and Nginx, improving page load times by 40% and managing cost efficiency via blue-green deployments.',
      'Developed and maintained the IDS Africa Selfcare Portal using Node.js, Express.js, GitHub Actions, Linux servers, and Paystack API, improving subscription processing times by 30% and payment success by 25%.',
      'Built a backend CRM Portal with Node.js, PostgreSQL, Docker, Redis, and AWS RDS, boosting marketer workflow efficiency by 20%.',
      'Rebuilt IDS Africa website using Next.js, TypeScript, headless WordPress CMS, and GraphQL, improving SEO performance by 50% and organic traffic by 35%.',
      'Provided cross-departmental technical support and optimized AWS EC2, Wowza, and OBS Studio infrastructure, boosting live stream viewer engagement by 40%.',
      'Integrated Webpushr push notifications driving user engagement with 60.2K active users and an 89.75% opt-in rate.',
      'Developed automated climate newsletter application using Make.com and n8n, integrating AFP Climate Change API and Mailchimp, cutting manual editorial effort by 80%.',
    ],
  },
  {
    role: 'Full Stack Software Engineer',
    company: 'iTap Solutions',
    period: 'May 2020 – May 2023',
    type: 'Remote',
    location: 'Lagos, Nigeria',
    highlights: [
      'Spearheaded development of Xfund, a comprehensive portfolio and asset management system with financial instrument management and automated daily valuations.',
      'Designed and implemented SignalR web sockets for real-time feedback mechanisms, significantly improving UX during long-running operations.',
      'Engineered deployment processes using Docker and multi-tenant deploy scripts across Apache, IIS, and Nginx.',
      'Migrated critical infrastructure from Azure to self-hosted PostgreSQL platform, substantially reducing operational costs while preserving high availability.',
      'Integrated AG-Grid, Telerik, and Bloomberg APIs to enhance reporting and data visualization capabilities.',
      'Built a custom incident management system and software license manager.',
      'Refactored monolithic codebase into decoupled modules and implemented robust anti-SQLi / anti-XSS security defenses.',
    ],
  },
  {
    role: 'Full Stack Software Developer',
    company: 'Desygner',
    period: 'April 2022 – Nov 2022',
    type: 'Remote',
    location: 'Australia',
    highlights: [
      'Enhanced Desygner graphic design web editor by optimizing core features in HTML, CSS, and JavaScript, generating a 30% increase in user engagement over 6 months.',
      'Collaborated with design team to implement UX/UI improvements for video and animation features, boosting adoption by 20%.',
      'Developed custom algorithms for seamless transitions, blend modes, and text effects, boosting tool adoption by 25%.',
      'Integrated third-party libraries and APIs for advanced video processing tools and effects, achieving a 40% improvement in rendering speed.',
      'Designed and implemented real-time live-editing features for team collaboration, increasing customer satisfaction by 30%.',
      'Optimized codebase performance, reducing page load times by 35% during high-traffic peaks.',
    ],
  },
  {
    role: 'Frontend Trainer & Mentor',
    company: 'Wema Bank (Delon Jobs)',
    period: 'Aug 2022 – Sept 2022 & Oct 2021 – Dec 2021',
    type: 'Hybrid / Remote',
    location: 'Lagos, Nigeria',
    highlights: [
      'Delivered comprehensive frontend training on HTML, CSS, JavaScript, React, Redux, and CSS Grid/Flexbox, improving trainees proficiency by 25% through hands-on deployed projects.',
      'Introduced version control with Git and GitHub, enhancing team collaboration and code review workflows.',
      'Taught React API integration with Axios/Fetch and test-driven development (TDD) using Jest and React Testing Library.',
      'Conducted regular code reviews and mentored graduate trainees to achieve successful production deployments.',
    ],
  },
  {
    role: 'Frontend Developer',
    company: 'Wema Bank (Delon Jobs)',
    period: 'June 2021 – Sept 2021',
    type: 'Hybrid',
    location: 'Lagos, Nigeria',
    highlights: [
      'Contributed to the development of the ALAT for Business enterprise application using AngularJS, improving responsiveness and user navigation times by 15%.',
      'Integrated CI/CD pipelines, increasing deployment frequency by 25% and reducing deployment error rates by 10%.',
    ],
  },
  {
    role: 'Graphics & Art Director',
    company: 'Bomay Group & Linson Page',
    period: 'Aug 2018 – Nov 2018',
    type: 'Onsite',
    location: 'Lagos, Nigeria',
    highlights: [
      'Designed brand identity assets, marketing collateral, and digital design templates for enterprise clients, increasing brand recognition by 30%.',
      'Streamlined asset creation pipelines, reducing production turnaround times by 20%.',
    ],
  },
  {
    role: 'Software Engineer Intern',
    company: 'Liberal Consults',
    period: 'May 2017 – Nov 2017',
    type: 'Onsite',
    location: 'Lagos, Nigeria',
    highlights: [
      'Developed workflow automations and internal business forms in SharePoint, increasing operational speed by 25%.',
      'Assisted in infrastructure monitoring and client-facing IT support with 20% faster ticket resolution.',
    ],
  },
];

export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    category: 'Programming Languages',
    skills: ['TypeScript', 'JavaScript (ESNext)', 'Python', 'C#', 'SQL', 'HTML5 / CSS3'],
  },
  {
    category: 'Frontend & 3D WebGL',
    skills: ['React.js', 'Next.js', 'Three.js / WebGL', 'Tailwind CSS', 'Framer Motion', 'Angular', 'Vite', 'Redux / Zustand'],
  },
  {
    category: 'Backend & Real-Time',
    skills: ['Node.js', 'Express.js', '.NET Core', 'REST & GraphQL APIs', 'SignalR', 'WebSockets', 'Microservices', 'Clean Architecture'],
  },
  {
    category: 'Databases & Caching',
    skills: ['PostgreSQL', 'Redis', 'MySQL', 'MongoDB', 'Supabase', 'AWS RDS', 'Firebase'],
  },
  {
    category: 'DevOps & Cloud',
    skills: ['Docker', 'AWS (EC2, S3, RDS)', 'GitHub Actions CI/CD', 'Nginx', 'Linux Server Admin', 'Azure', 'GCP'],
  },
  {
    category: 'Testing & Architecture',
    skills: ['Jest', 'React Testing Library', 'Playwright', 'Domain-Driven Design (DDD)', 'TDD', 'Agile / Scrum', 'Web Performance', 'OWASP Security'],
  },
];

export interface TokenCollectible {
  id: string;
  name: string;
  topic: string;
  coordinates: { x: number; z: number };
}

export const TOKENS: TokenCollectible[] = [
  { id: 'token-ts', name: 'TypeScript Core', topic: 'Strict Type Safety & Enterprise Code Quality', coordinates: { x: 16, z: -14 } },
  { id: 'token-react', name: 'React & Three.js', topic: 'Immersive WebGL & Component Architecture', coordinates: { x: -18, z: -16 } },
  { id: 'token-node', name: 'Node.js & Go', topic: 'High-Concurrency Distributed Backends', coordinates: { x: -16, z: 18 } },
  { id: 'token-pg', name: 'PostgreSQL & Redis', topic: 'ACID Relational Storage & In-Memory Caching', coordinates: { x: 18, z: 16 } },
  { id: 'token-docker', name: 'Docker & AWS', topic: 'Multi-Tenant Container Orchestration & Cloud DevOps', coordinates: { x: 0, z: 42 } },
  { id: 'token-realtime', name: 'WebSockets & SignalR', topic: 'Sub-Millisecond Real-Time Event Feeds', coordinates: { x: -44, z: 0 } },
];
