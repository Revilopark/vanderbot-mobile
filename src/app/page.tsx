"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  FolderOpen,
  MessageSquare,
  Plus,
  FileText,
  Search,
  Bell,
  Shield,
  ChevronRight,
  Clock,
  Sparkles,
  Brain,
  Zap,
  BarChart3,
  Lock,
  User,
  LogIn,
} from "lucide-react";
import { AuthProvider, useAuth, IAMAwarenessPanel } from "../lib/iam-components";

// ─── Types ─────────────────────────────────────────────────────────

type Screen = "home" | "projects" | "chat" | "create" | "files";
type Visibility = "private" | "team" | "cohort" | "public";

interface Project {
  id: string;
  title: string;
  phase: string;
  visibility: Visibility;
  lastActive: string;
  progress: number;
  decisions: number;
  artifacts: number;
}

interface Artifact {
  id: string;
  title: string;
  type: string;
  status: string;
  visibility: Visibility;
  updatedAt: string;
}

// ─── Mock Data ─────────────────────────────────────────────────────

const projects: Project[] = [
  {
    id: "1",
    title: "Sustainable Fashion Marketplace",
    phase: "Validation",
    visibility: "private",
    lastActive: "2h ago",
    progress: 34,
    decisions: 3,
    artifacts: 5,
  },
  {
    id: "2",
    title: "AI Tutoring Platform",
    phase: "Research",
    visibility: "team",
    lastActive: "1d ago",
    progress: 12,
    decisions: 1,
    artifacts: 2,
  },
];

const artifacts: Artifact[] = [
  {
    id: "1",
    title: "Venture Canvas v1",
    type: "Canvas",
    status: "draft",
    visibility: "private",
    updatedAt: "2h ago",
  },
  {
    id: "2",
    title: "Market Research Memo",
    type: "Memo",
    status: "approved",
    visibility: "team",
    updatedAt: "1d ago",
  },
];

// ─── Components ────────────────────────────────────────────────────

function VisibilityBadge({ visibility }: { visibility: Visibility }) {
  const colors = {
    private: "bg-status-danger/20 text-status-danger border-status-danger/30",
    team: "bg-accent/20 text-accent border-accent/30",
    cohort: "bg-status-warning/20 text-status-warning border-status-warning/30",
    public: "bg-status-success/20 text-status-success border-status-success/30",
  };

  return (
    <span className={`text-2xs px-1.5 py-0.5 rounded border ${colors[visibility]} font-medium uppercase tracking-wider`}>
      {visibility}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-text-muted/20 text-text-muted",
    approved: "bg-status-success/20 text-status-success",
    "needs-review": "bg-status-warning/20 text-status-warning",
    published: "bg-accent/20 text-accent",
  };

  return (
    <span className={`text-2xs px-1.5 py-0.5 rounded ${colors[status] || colors.draft} font-medium capitalize`}>
      {status.replace("-", " ")}
    </span>
  );
}

// ─── Home Screen ───────────────────────────────────────────────────

function HomeScreen() {
  const [showIAM, setShowIAM] = useState(false);
  const auth = useAuth();

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-background-tertiary/50 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-text-primary">Vanderbot</h1>
            <p className="text-2xs text-text-muted">AI Practicum OS</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-lg hover:bg-surface-hover">
            <Bell className="w-4 h-4 text-text-secondary" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-status-danger rounded-full" />
          </button>
          {auth.isAuthenticated ? (
            <button
              onClick={() => setShowIAM(!showIAM)}
              className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center"
            >
              <User className="w-4 h-4 text-accent" />
            </button>
          ) : (
            <button
              onClick={() => setShowIAM(!showIAM)}
              className="p-2 rounded-lg hover:bg-surface-hover"
            >
              <Shield className="w-4 h-4 text-accent" />
            </button>
          )}
        </div>
      </div>

      {/* Active Project Badge */}
      <div className="px-4 py-2 bg-background-secondary border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs text-text-secondary">Active:</span>
          <span className="text-xs font-medium text-text-primary truncate">
            {auth.isAuthenticated ? "Sustainable Fashion Marketplace" : "No active project"}
          </span>
          {auth.isAuthenticated && <VisibilityBadge visibility="private" />}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {!auth.isAuthenticated ? (
          <div className="mx-4 mt-8 p-6 rounded-xl bg-surface border border-border text-center">
            <Shield className="w-12 h-12 text-text-muted mx-auto mb-3" />
            <h3 className="text-base font-semibold text-text-primary mb-2">
              Welcome to Vanderbot
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              Sign in to access your projects, collaborate with AI, and build your venture.
            </p>
            <button
              onClick={() => setShowIAM(true)}
              className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-xl transition-colors inline-flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          </div>
        ) : (
          <>
            {/* Resume Card */}
            <div className="mx-4 mt-4 p-4 rounded-xl bg-surface border border-border">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-text-primary">Resume where you left off</h3>
                  <p className="text-xs text-text-secondary mt-1">
                    Last time we were working on the venture canvas for Sustainable Fashion Marketplace
                  </p>
                  <button className="mt-3 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-lg transition-colors">
                    Continue Building
                  </button>
                </div>
              </div>
            </div>

            {/* Mode Chips */}
            <div className="px-4 mt-4">
              <h2 className="text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider">
                Work Modes
              </h2>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                  { icon: MessageSquare, label: "Chat", active: false },
                  { icon: Brain, label: "Research", active: false },
                  { icon: Sparkles, label: "Create", active: true },
                  { icon: BarChart3, label: "Venture", active: false },
                  { icon: Zap, label: "Critic", active: false },
                ].map((mode) => (
                  <button
                    key={mode.label}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border whitespace-nowrap transition-colors ${
                      mode.active
                        ? "bg-accent/20 border-accent/50 text-accent"
                        : "bg-surface border-border text-text-secondary hover:border-border-strong"
                    }`}
                  >
                    <mode.icon className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">{mode.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Projects */}
            <div className="px-4 mt-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Active Projects
                </h2>
                <button className="text-2xs text-accent">View All</button>
              </div>
              <div className="space-y-2">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="p-3 rounded-xl bg-surface border border-border hover:border-border-strong transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-text-primary truncate">
                          {project.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-2xs text-text-muted">{project.phase}</span>
                          <span className="text-2xs text-text-muted">•</span>
                          <span className="text-2xs text-text-muted">{project.lastActive}</span>
                        </div>
                      </div>
                      <VisibilityBadge visibility={project.visibility} />
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-2xs text-text-muted mb-1">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-background-tertiary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-2xs text-text-muted">
                        {project.decisions} decisions
                      </span>
                      <span className="text-2xs text-text-muted">
                        {project.artifacts} artifacts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Open Decisions */}
            <div className="px-4 mt-4">
              <h2 className="text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider">
                Open Decisions
              </h2>
              <div className="p-3 rounded-xl bg-surface border border-border">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-status-warning" />
                  <span className="text-sm text-text-primary">Target market: Gen Z vs Millennials?</span>
                </div>
                <p className="text-xs text-text-secondary mt-1 ml-4">
                  Affects: Venture Canvas, Customer Interviews, Financial Model
                </p>
              </div>
            </div>

            {/* Recent Artifacts */}
            <div className="px-4 mt-4 pb-4">
              <h2 className="text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider">
                Recent Artifacts
              </h2>
              <div className="space-y-2">
                {artifacts.map((artifact) => (
                  <div
                    key={artifact.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border"
                  >
                    <div className="w-9 h-9 rounded-lg bg-background-tertiary flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-text-primary truncate">
                        {artifact.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-2xs text-text-muted">{artifact.type}</span>
                        <StatusBadge status={artifact.status} />
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* IAM Bottom Sheet */}
      <AnimatePresence>
        {showIAM && <IAMAwarenessPanel onClose={() => setShowIAM(false)} />}
      </AnimatePresence>
    </div>
  );
}

// ─── Projects Screen ───────────────────────────────────────────────

function ProjectsScreen() {
  const auth = useAuth();

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 bg-background-tertiary/50 border-b border-border-subtle">
        <h1 className="text-lg font-semibold text-text-primary">Projects</h1>
        <p className="text-xs text-text-secondary mt-0.5">Manage your ventures and initiatives</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {!auth.isAuthenticated ? (
          <div className="p-6 rounded-xl bg-surface border border-border text-center">
            <Shield className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="text-sm text-text-secondary">Sign in to view your projects</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="p-4 rounded-xl bg-surface border border-border"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-text-primary">{project.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-text-muted">{project.phase}</span>
                        <VisibilityBadge visibility={project.visibility} />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary mt-2">
                    Last active {project.lastActive}
                  </p>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="h-2 bg-background-tertiary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1">
                      <Brain className="w-3.5 h-3.5 text-text-muted" />
                      <span className="text-xs text-text-muted">{project.decisions} decisions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-text-muted" />
                      <span className="text-xs text-text-muted">{project.artifacts} artifacts</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 p-4 rounded-xl border border-dashed border-border text-text-muted hover:border-accent hover:text-accent transition-colors flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">New Project</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Chat Screen ───────────────────────────────────────────────────

function ChatScreen() {
  const auth = useAuth();
  const [messages] = useState([
    {
      id: "1",
      role: "user" as const,
      content: "Help me refine the customer segment for my sustainable fashion marketplace",
    },
    {
      id: "2",
      role: "assistant" as const,
      content: "Based on your project memory, you're targeting Gen Z with sustainable fashion. I've analyzed your research files and found 3 key insights...",
      sources: ["Market Research Memo", "Customer Interview Notes"],
      memoryUsed: true,
    },
  ]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 bg-background-tertiary/50 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-accent" />
          <div>
            <h1 className="text-sm font-semibold text-text-primary">Chat</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xs text-text-muted">Project:</span>
              <span className="text-2xs text-accent">
                {auth.isAuthenticated ? "Sustainable Fashion" : "No project"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {!auth.isAuthenticated ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <Shield className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="text-sm text-text-secondary">Sign in to start chatting with Vanderbot</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-accent text-white"
                      : "bg-surface border border-border"
                  }`}
                >
                  <p className={`text-sm ${msg.role === "user" ? "text-white" : "text-text-primary"}`}>
                    {msg.content}
                  </p>
                  {msg.role === "assistant" && msg.memoryUsed && (
                    <div className="mt-2 pt-2 border-t border-border-subtle">
                      <div className="flex items-center gap-1">
                        <Brain className="w-3 h-3 text-accent" />
                        <span className="text-2xs text-accent">Using project memory + {msg.sources?.length} files</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 py-3 bg-background-tertiary/50 border-t border-border-subtle">
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-surface-hover flex-shrink-0">
                <Plus className="w-5 h-5 text-text-secondary" />
              </button>
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="What are we building?"
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                />
              </div>
              <button className="p-2.5 bg-accent hover:bg-accent-hover rounded-xl flex-shrink-0 transition-colors">
                <Zap className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Create Screen ─────────────────────────────────────────────────

function CreateScreen() {
  const auth = useAuth();
  const artifactTypes = [
    { icon: FileText, label: "Doc", desc: "Document" },
    { icon: BarChart3, label: "Deck", desc: "Presentation" },
    { icon: Sparkles, label: "Page", desc: "Web page" },
    { icon: Brain, label: "Memo", desc: "Research memo" },
    { icon: Zap, label: "Brief", desc: "Project brief" },
    { icon: Lock, label: "Data Room", desc: "Secure docs" },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 bg-background-tertiary/50 border-b border-border-subtle">
        <h1 className="text-lg font-semibold text-text-primary">Create</h1>
        <p className="text-xs text-text-secondary mt-0.5">Generate artifacts from your project</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {!auth.isAuthenticated ? (
          <div className="p-6 rounded-xl bg-surface border border-border text-center">
            <Shield className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="text-sm text-text-secondary">Sign in to create artifacts</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {artifactTypes.map((type) => (
                <button
                  key={type.label}
                  className="p-4 rounded-xl bg-surface border border-border hover:border-accent transition-colors text-left"
                >
                  <type.icon className="w-6 h-6 text-accent mb-2" />
                  <h3 className="text-sm font-medium text-text-primary">{type.label}</h3>
                  <p className="text-2xs text-text-secondary mt-0.5">{type.desc}</p>
                </button>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-surface border border-border">
              <h3 className="text-sm font-medium text-text-primary mb-2">Quick Create</h3>
              <p className="text-xs text-text-secondary">
                Describe what you want to build and Vanderbot will suggest the best artifact type
              </p>
              <button className="mt-3 w-full py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-xl transition-colors">
                Start from Description
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Files Screen ──────────────────────────────────────────────────

function FilesScreen() {
  const auth = useAuth();
  const files = [
    { name: "Market Research.pdf", size: "2.4 MB", type: "PDF", date: "2h ago" },
    { name: "Customer Interviews.docx", size: "1.1 MB", type: "DOCX", date: "1d ago" },
    { name: "Competitive Analysis.xlsx", size: "890 KB", type: "XLSX", date: "2d ago" },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 bg-background-tertiary/50 border-b border-border-subtle">
        <h1 className="text-lg font-semibold text-text-primary">Files</h1>
        <p className="text-xs text-text-secondary mt-0.5">Project knowledge base</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {!auth.isAuthenticated ? (
          <div className="p-6 rounded-xl bg-surface border border-border text-center">
            <Shield className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="text-sm text-text-secondary">Sign in to access your files</p>
          </div>
        ) : (
          <>
            <button className="w-full p-4 rounded-xl border border-dashed border-border text-text-muted hover:border-accent hover:text-accent transition-colors flex items-center justify-center gap-2 mb-4">
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Upload File</span>
            </button>
            <div className="space-y-2">
              {files.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-text-primary truncate">{file.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-2xs text-text-muted">{file.type}</span>
                      <span className="text-2xs text-text-muted">{file.size}</span>
                      <span className="text-2xs text-text-muted">{file.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Bottom Navigation ─────────────────────────────────────────────

function BottomNav({ active, onChange }: { active: Screen; onChange: (s: Screen) => void }) {
  const items: { screen: Screen; icon: typeof Home; label: string }[] = [
    { screen: "home", icon: Home, label: "Home" },
    { screen: "projects", icon: FolderOpen, label: "Projects" },
    { screen: "chat", icon: MessageSquare, label: "Chat" },
    { screen: "create", icon: Plus, label: "Create" },
    { screen: "files", icon: FileText, label: "Files" },
  ];

  return (
    <nav className="flex items-center justify-around px-2 py-2 bg-background-tertiary/90 backdrop-blur-lg border-t border-border-subtle safe-area-bottom">
      {items.map((item) => (
        <button
          key={item.screen}
          onClick={() => onChange(item.screen)}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
            active === item.screen
              ? "text-accent"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          <item.icon className="w-5 h-5" />
          <span className="text-2xs font-medium">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ─── Main App ──────────────────────────────────────────────────────

function AppContent() {
  const [activeScreen, setActiveScreen] = useState<Screen>("home");

  const screens: Record<Screen, React.ReactNode> = {
    home: <HomeScreen />,
    projects: <ProjectsScreen />,
    chat: <ChatScreen />,
    create: <CreateScreen />,
    files: <FilesScreen />,
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeScreen}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {screens[activeScreen]}
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav active={activeScreen} onChange={setActiveScreen} />
    </div>
  );
}

export default function VanderbotApp() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
