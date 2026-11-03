import React, { useEffect, useMemo, useState } from "react";
import { api } from "./api.js";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  Bell,
  Bookmark,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  CircleHelp,
  Compass,
  GraduationCap,
  LogOut,
  Menu,
  Pencil,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Users,
  X,
  XCircle,
} from "lucide-react";

const storyProfiles = [
  { name: "Maya Chen", avatar: "MC", color: "blue" },
  { name: "Sam Rivera", avatar: "SR", color: "green" },
  { name: "Casey Park", avatar: "CP", color: "purple" },
];

function normalize(value) {
  return value.trim().toLowerCase();
}

function matchReason(profile, project) {
  const skills = profile.skills.filter((skill) =>
    project.roles.some((role) => normalize(role) === normalize(skill)),
  );
  const interests = profile.interests.filter((interest) =>
    project.tags.some((tag) => normalize(tag) === normalize(interest)),
  );
  const availableHours = Number(profile.hoursPerWeek || 0);
  const expectedHours = project.hoursPerWeek ? Number(project.hoursPerWeek) : null;
  const hoursFit = expectedHours !== null && availableHours >= expectedHours;
  return {
    skills,
    interests,
    hoursFit,
    availableHours,
    expectedHours,
    score:
      skills.length * 2 +
      interests.length +
      (expectedHours === null ? 0 : hoursFit ? 1 : -1),
  };
}

function teammateReason(profile, project) {
  const skills = profile.skills.filter((skill) =>
    project.roles.some((role) => normalize(role) === normalize(skill)),
  );
  const availableHours = Number(profile.hoursPerWeek || 0);
  const expectedHours = project.hoursPerWeek ? Number(project.hoursPerWeek) : null;
  const hoursFit = expectedHours !== null && availableHours >= expectedHours;
  const skillCoverage = skills.length / Math.max(1, project.roles.length);
  return {
    skills,
    hoursFit,
    availableHours,
    expectedHours,
    score: skills.length * 2 + (hoursFit ? 1 : 0),
    percent: Math.min(
      100,
      Math.round(Math.min(1, skillCoverage) * 75 + (hoursFit ? 25 : 0)),
    ),
  };
}

function initials(name = "") {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();
}

function Avatar({ person, size = "normal" }) {
  return (
    <div className={`avatar avatar-${person?.color || "coral"} avatar-${size}`}>
      {person?.avatar || initials(person?.name)}
    </div>
  );
}

function Tag({ children, muted = false }) {
  return <span className={`tag${muted ? " tag-muted" : ""}`}>{children}</span>;
}

function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const closeOnEscape = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className={`modal${wide ? " modal-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-heading">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X size={19} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function AuthScreen({ onLogin, onRegister }) {
  const [mode, setMode] = useState("register");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    university: "",
  });
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "register") {
        if (form.password.length < 8)
          throw new Error("Use at least 8 characters for your password.");
        await onRegister({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          university: form.university.trim(),
        });
      } else {
        await onLogin({ email: form.email.trim(), password: form.password });
      }
    } catch (caught) {
      setError(caught.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-story">
        <a className="brand auth-brand" href="#home">
          <span className="brand-mark">
            <Sparkles size={18} />
          </span>
          sidequest<span className="brand-period">.</span>
        </a>
        <div className="story-copy">
          <span className="eyebrow">
            <span className="eyebrow-dot" /> A little more making, together
          </span>
          <h1>
            Good ideas
            <br />
            need <span>good people.</span>
          </h1>
          <p>
            Find your next collaborator, get a project moving, and make
            something that matters to you.
          </p>
          <div className="story-people">
            <div className="avatar-stack">
              {storyProfiles.map((person) => (
                <Avatar key={person.name} person={person} size="small" />
              ))}
            </div>
            <span>
              Made for curious students
              <br />
              at every kind of university.
            </span>
          </div>
        </div>
        <div className="story-decoration">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit-center">
            <Sparkles size={27} />
          </div>
          <span className="float-note note-one">your next idea ↗</span>
          <span className="float-note note-two">find your people</span>
        </div>
        <div className="story-foot">A place to start something good.</div>
      </section>
      <section className="auth-panel">
        <div className="auth-form-wrap">
          <div className="auth-mobile-brand">
            <a className="brand" href="#home">
              <span className="brand-mark">
                <Sparkles size={18} />
              </span>
              sidequest<span className="brand-period">.</span>
            </a>
          </div>
          <div className="auth-tabs">
            <button
              className={mode === "login" ? "active" : ""}
              onClick={() => {
                setMode("login");
                setError("");
              }}
            >
              Log in
            </button>
            <button
              className={mode === "register" ? "active" : ""}
              onClick={() => {
                setMode("register");
                setError("");
              }}
            >
              Create account
            </button>
          </div>
          <h2>
            {mode === "login" ? "Welcome back." : "Make yourself at home."}
          </h2>
          <p className="auth-subtitle">
            {mode === "login"
              ? "Pick up where your next big idea left off."
              : "Your next favorite team starts here."}
          </p>
          <form onSubmit={submit} className="form-stack">
            {mode === "register" && (
              <>
                <label>
                  Your name
                  <input
                    required
                    autoComplete="name"
                    placeholder="Alex Morgan"
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                  />
                </label>
                <label>
                  University
                  <input
                    required
                    autoComplete="organization"
                    placeholder="Your university"
                    value={form.university}
                    onChange={(event) =>
                      setForm({ ...form, university: event.target.value })
                    }
                  />
                </label>
              </>
            )}
            <label>
              University email
              <input
                required
                type="email"
                autoComplete="email"
                placeholder="you@university.edu"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
              />
            </label>
            <label>
              Password
              <input
                required
                minLength={mode === "register" ? 8 : undefined}
                type="password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
              />
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button
              className="button button-primary auth-submit"
              disabled={busy}
            >
              {busy
                ? "One moment…"
                : mode === "login"
                  ? "Log in"
                  : "Create my account"}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="auth-privacy">
            By continuing, you agree to keep this a kind and collaborative
            space.
          </p>
        </div>
        <div className="auth-bottom">
          <span>Built for the things you want to make.</span>
          <span>© Sidequest 2026</span>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [applications, setApplications] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [startupError, setStartupError] = useState("");
  const [activePage, setActivePage] = useState("discover");
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("All projects");
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState("");
  const [mobileNav, setMobileNav] = useState(false);

  function setWorkspace(workspace) {
    setCurrentUser(workspace.user);
    setUsers(workspace.users);
    setProjects(workspace.projects);
    setApplications(workspace.applications);
  }

  useEffect(() => {
    let active = true;
    api("/workspace")
      .then((workspace) => {
        if (active) setWorkspace(workspace);
      })
      .catch((error) => {
        if (active && error.status !== 401) setStartupError(error.message);
      })
      .finally(() => {
        if (active) setAuthReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const userApplications = applications.filter(
    (application) => application.applicantId === currentUser?.id,
  );
  const ownedProjects = projects.filter(
    (project) => project.ownerId === currentUser?.id,
  );
  const categories = [
    "All projects",
    "Design",
    "Technology",
    "Climate",
    "Community",
  ];

  const recommendedProjects = useMemo(
    () =>
      projects
        .filter(
          (project) =>
            project.ownerId !== currentUser?.id &&
            (project.status || "recruiting") === "recruiting",
        )
        .map((project) => ({
          project,
          match: matchReason(
            currentUser || { skills: [], interests: [] },
            project,
          ),
        }))
        .sort((a, b) => b.match.score - a.match.score),
    [projects, currentUser],
  );

  const filteredProjects = useMemo(() => {
    const query = normalize(search);
    return projects.filter((project) => {
      const owner = users.find((person) => person.id === project.ownerId);
      const searchMatch =
        !query ||
        [
          project.title,
          project.description,
          ...project.tags,
          ...project.roles,
          owner?.name,
        ].some((value) => normalize(value || "").includes(query));
      const categoryMatch =
        tagFilter === "All projects" ||
        project.tags.some(
          (tag) =>
            normalize(tag).includes(normalize(tagFilter)) ||
            (normalize(tagFilter) === "technology" &&
              ["react", "typescript", "open source"].includes(
                normalize(tag),
              )) ||
            (normalize(tagFilter) === "design" &&
              ["design", "accessibility"].includes(normalize(tag))),
        );
      return searchMatch && categoryMatch;
    });
  }, [projects, users, search, tagFilter]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 2800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  async function signIn(credentials) {
    setWorkspace(
      await api("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
    );
    setActivePage("discover");
  }

  async function register(credentials) {
    setWorkspace(
      await api("/auth/register", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
    );
    setActivePage("profile");
  }

  async function signOut() {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    setCurrentUser(null);
    setUsers([]);
    setProjects([]);
    setApplications([]);
    setActivePage("discover");
  }

  async function saveProfile(updated) {
    try {
      setWorkspace(
        await api("/profile", {
          method: "PATCH",
          body: JSON.stringify(updated),
        }),
      );
      setModal(null);
      setNotice("Your profile is up to date.");
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function createProject(project) {
    try {
      setWorkspace(
        await api("/projects", {
          method: "POST",
          body: JSON.stringify(project),
        }),
      );
      setModal(null);
      setNotice("Your project is live. Let’s find your people.");
      setActivePage("my projects");
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function editProject(projectId, updatedProject) {
    try {
      setWorkspace(
        await api(`/projects/${projectId}`, {
          method: "PATCH",
          body: JSON.stringify(updatedProject),
        }),
      );
      setModal(null);
      setNotice("Your project details are updated.");
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function changeProjectStatus(projectId, status) {
    try {
      setWorkspace(
        await api(`/projects/${projectId}`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }),
      );
      setNotice(`Project status changed to ${status}.`);
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function applyToProject(project, role, message) {
    try {
      setWorkspace(
        await api(`/projects/${project.id}/applications`, {
          method: "POST",
          body: JSON.stringify({ role, message }),
        }),
      );
      setModal(null);
      setNotice("Application sent. Fingers crossed.");
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function updateApplication(applicationId, status) {
    try {
      setWorkspace(
        await api(`/applications/${applicationId}`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }),
      );
      setNotice(
        status === "accepted"
          ? "Application accepted. Your team just got better."
          : "Application declined.",
      );
    } catch (error) {
      setNotice(error.message);
    }
  }

  function navigate(page) {
    setActivePage(page);
    setMobileNav(false);
  }

  if (!authReady)
    return (
      <div className="boot-screen">
        <span className="brand-mark">
          <Sparkles size={18} />
        </span>
        <p>Getting Sidequest ready…</p>
      </div>
    );
  if (startupError)
    return (
      <div className="boot-screen">
        <span className="brand-mark">
          <CircleHelp size={18} />
        </span>
        <h1>Can’t connect to Sidequest.</h1>
        <p>{startupError}</p>
        <button
          className="button button-dark"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </div>
    );
  if (!currentUser)
    return <AuthScreen onLogin={signIn} onRegister={register} />;

  const navItems = [
    { key: "discover", label: "Discover", icon: Compass },
    {
      key: "my applications",
      label: "My applications",
      icon: ArrowDownRight,
      count: userApplications.filter(
        (application) => application.status === "pending",
      ).length,
    },
    { key: "my projects", label: "My projects", icon: BriefcaseBusiness },
    { key: "profile", label: "My profile", icon: GraduationCap },
  ];

  return (
    <div className="app-shell">
      <aside className={`sidebar${mobileNav ? " sidebar-open" : ""}`}>
        <a
          className="brand sidebar-brand"
          href="#home"
          onClick={(event) => {
            event.preventDefault();
            navigate("discover");
          }}
        >
          <span className="brand-mark">
            <Sparkles size={17} />
          </span>
          sidequest<span className="brand-period">.</span>
        </a>
        <div className="workspace-switch">
          <div className="workspace-icon">
            <GraduationCap size={17} />
          </div>
          <div className="workspace-text">
            <strong>{currentUser.university || "Your university"}</strong>
            <span>Student workspace</span>
          </div>
          <ChevronDown size={15} />
        </div>
        <div className="nav-caption">YOUR SPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navItems.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              className={`nav-item${activePage === key ? " nav-active" : ""}`}
              onClick={() => navigate(key)}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {count > 0 && <span className="nav-count">{count}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="side-tip">
            <span className="tip-icon">
              <Sparkles size={15} />
            </span>
            <strong>Good things start small.</strong>
            <p>One conversation can turn an idea into a whole team.</p>
            <button onClick={() => setModal({ type: "create" })}>
              Start a project <ArrowRight size={14} />
            </button>
          </div>
          <button
            className="nav-item help-link"
            onClick={() =>
              setNotice("Need a hand? Your campus community is here for you.")
            }
          >
            <CircleHelp size={17} />
            <span>Help & support</span>
          </button>
          <button className="account-switch" onClick={signOut}>
            <Avatar person={currentUser} size="small" />
            <span className="account-name">
              <strong>{currentUser.name}</strong>
              <small>{currentUser.university || "Student account"}</small>
            </span>
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            onClick={() => setMobileNav(!mobileNav)}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <div className="breadcrumbs">
            Workspace <ChevronRight size={14} />{" "}
            <span>
              {activePage === "discover"
                ? "Discover"
                : activePage === "profile"
                  ? "My profile"
                  : activePage === "my projects"
                    ? "My projects"
                    : "My applications"}
            </span>
          </div>
          <div className="topbar-actions">
            <label className="top-search">
              <Search size={16} />
              <input
                placeholder="Search projects, skills…"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setActivePage("discover");
                }}
              />
              <kbd>⌘ K</kbd>
            </label>
            <button
              className="icon-button notification-button"
              aria-label="Notifications"
              onClick={() => navigate("my applications")}
            >
              <Bell size={18} />
              {userApplications.some((item) => item.status !== "pending") && (
                <i />
              )}
            </button>
            <button
              className="top-avatar-button"
              onClick={() => navigate("profile")}
              aria-label="View profile"
            >
              <Avatar person={currentUser} size="small" />
            </button>
          </div>
        </header>

        <div className="page-content">
          {activePage === "discover" && (
            <DiscoverPage
              currentUser={currentUser}
              projects={filteredProjects}
              allProjects={projects}
              users={users}
              applications={applications}
              recommendations={recommendedProjects}
              tagFilter={tagFilter}
              categories={categories}
              onFilter={setTagFilter}
              onOpen={(project) => setModal({ type: "project", project })}
              onCreate={() => setModal({ type: "create" })}
              onProfile={() => setModal({ type: "profile" })}
            />
          )}
          {activePage === "my applications" && (
            <ApplicationsPage
              applications={userApplications}
              projects={projects}
              users={users}
              onOpen={(project) => setModal({ type: "project", project })}
            />
          )}
          {activePage === "my projects" && (
            <MyProjectsPage
              projects={ownedProjects}
              applications={applications}
              users={users}
              onCreate={() => setModal({ type: "create" })}
              onEdit={(project) => setModal({ type: "edit-project", project })}
              onStatusChange={changeProjectStatus}
              onReview={(project) => setModal({ type: "manage", project })}
              onOpen={(project) => setModal({ type: "project", project })}
            />
          )}
          {activePage === "profile" && (
            <ProfilePage
              user={currentUser}
              projects={projects}
              users={users}
              onEdit={() => setModal({ type: "profile" })}
              onNavigate={navigate}
            />
          )}
        </div>
      </main>

      {mobileNav && (
        <button
          className="mobile-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileNav(false)}
        />
      )}
      {modal?.type === "project" && (
        <ProjectModal
          project={modal.project}
          currentUser={currentUser}
          users={users}
          applications={applications}
          onClose={() => setModal(null)}
          onApply={applyToProject}
        />
      )}
      {modal?.type === "create" && (
        <CreateProjectModal
          onClose={() => setModal(null)}
          onCreate={createProject}
        />
      )}
      {modal?.type === "edit-project" && (
        <CreateProjectModal
          key={modal.project.id}
          project={modal.project}
          onClose={() => setModal(null)}
          onEditProject={editProject}
        />
      )}
      {modal?.type === "profile" && (
        <ProfileModal
          user={currentUser}
          onClose={() => setModal(null)}
          onSave={saveProfile}
        />
      )}
      {modal?.type === "manage" && (
        <ManageProjectModal
          project={modal.project}
          applications={applications}
          users={users}
          onClose={() => setModal(null)}
          onUpdate={updateApplication}
        />
      )}
      {notice && (
        <div className="toast">
          <CheckCircle2 size={17} />
          {notice}
          <button onClick={() => setNotice("")} aria-label="Dismiss">
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow page-eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

function DiscoverPage({
  currentUser,
  projects,
  allProjects,
  users,
  applications,
  recommendations,
  tagFilter,
  categories,
  onFilter,
  onOpen,
  onCreate,
  onProfile,
}) {
  const profileIncomplete =
    !currentUser.skills.length || !currentUser.interests.length || !currentUser.hoursPerWeek;
  const suggestions = recommendations
    .filter(({ match }) => match.skills.length > 0 || match.score > 0)
    .slice(0, 3);
  const applicantCount = applications.filter(
    (application) =>
      application.applicantId === currentUser.id &&
      application.status === "pending",
  ).length;

  return (
    <>
      <section className="welcome-band">
        <div className="welcome-copy">
          <div className="eyebrow">
            <span className="eyebrow-dot" /> YOUR CAMPUS, YOUR NEXT THING
          </div>
          <h1>
            Make room for
            <br />
            <em>what’s next,</em> {currentUser.name.split(" ")[0]}.
          </h1>
          <p>
            There are good ideas out there. Let’s find the people to make them
            happen.
          </p>
          <div className="welcome-actions">
            <button className="button button-dark" onClick={onCreate}>
              <Plus size={17} /> Start a project
            </button>
            <span>
              <span className="online-dot" /> {allProjects.length} projects
              looking for teammates
            </span>
          </div>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="art-ring ring-a" />
          <div className="art-ring ring-b" />
          <div className="art-sun" />
          <div className="art-paper">
            <span>
              IDEA
              <br />→ TEAM
              <br />→ THING
            </span>
            <ArrowDownRight size={23} />
          </div>
          <span className="art-sticker">
            make it
            <br />
            together <Sparkles size={14} />
          </span>
          <span className="art-orbit-dot" />
        </div>
      </section>
      {profileIncomplete && (
        <section className="profile-prompt">
          <div className="prompt-icon">
            <Settings2 size={18} />
          </div>
          <div>
            <strong>Your profile is the start of a great match.</strong>
            <p>
              Add your skills and interests to get better project and teammate recommendations, including hours that fit your schedule.
            </p>
          </div>
          <button className="text-button" onClick={onProfile}>
            Finish profile <ArrowRight size={15} />
          </button>
        </section>
      )}
      <section className="section-head">
        <div>
          <div className="eyebrow">A GOOD PLACE TO START</div>
          <h2>
            Picked for you <Sparkles className="heading-sparkle" size={17} />
          </h2>
        </div>
        <span className="section-count">
          {suggestions.length} thoughtful matches
        </span>
      </section>
      {suggestions.length ? (
        <div className="recommendation-row">
          {suggestions.map(({ project, match }) => (
            <RecommendationCard
              key={project.id}
              project={project}
              match={match}
              owner={users.find((user) => user.id === project.ownerId)}
              application={applications.find(
                (item) =>
                  item.projectId === project.id &&
                  item.applicantId === currentUser.id,
              )}
              onOpen={() => onOpen(project)}
            />
          ))}
        </div>
      ) : (
        <div className="empty-recommendations">
          Add skills and interests to see projects that fit you here.
        </div>
      )}
      <section className="browse-section">
        <div className="browse-heading">
          <div>
            <div className="eyebrow">THE CAMPUS IDEA BOARD</div>
            <h2>Find your next project</h2>
          </div>
          <button className="button button-outline" onClick={onCreate}>
            <Plus size={16} /> Post an idea
          </button>
        </div>
        <div className="filter-tabs">
          {categories.map((category) => (
            <button
              key={category}
              className={tagFilter === category ? "filter-active" : ""}
              onClick={() => onFilter(category)}
            >
              {category}
            </button>
          ))}
          <span className="filter-result">{projects.length} projects</span>
        </div>
        {projects.length ? (
          <div className="project-grid">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                owner={users.find((user) => user.id === project.ownerId)}
                application={applications.find(
                  (item) =>
                    item.projectId === project.id &&
                    item.applicantId === currentUser.id,
                )}
                onOpen={() => onOpen(project)}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <Search size={22} />
            </div>
            <h3>No projects found just yet.</h3>
            <p>
              Try a different search or category, or be the one to start
              something.
            </p>
            <button className="button button-outline" onClick={onCreate}>
              <Plus size={16} /> Post an idea
            </button>
          </div>
        )}
      </section>
      <div className="discover-footer">
        <span>
          {applicantCount
            ? `You have ${applicantCount} application${applicantCount === 1 ? "" : "s"} waiting on a reply.`
            : "A project is more fun with the right people."}
        </span>
        <span>
          Made for your campus <Sparkles size={13} />
        </span>
      </div>
    </>
  );
}

function RecommendationCard({ project, match, owner, application, onOpen }) {
  const reasons = [
    ...match.skills.map((skill) => `your ${skill} skill`),
    ...match.interests.map(
      (interest) => `your interest in ${interest.toLowerCase()}`,
    ),
    match.hoursFit
      ? `${match.availableHours} hours per week meets the ${match.expectedHours}-hour commitment`
      : match.expectedHours === null
        ? "the project has not set a weekly hour expectation yet"
        : `the project expects ${match.expectedHours} hours per week and your profile lists ${match.availableHours}`,
  ];
  return (
    <button
      className={`recommendation-card recommend-${project.tone}`}
      onClick={onOpen}
    >
      <div className="rec-top">
        <span className="rec-label">
          <Sparkles size={13} /> GOOD FIT
        </span>
        <ArrowUpRightIcon />
      </div>
      <h3>{project.title}</h3>
      <p className="rec-description">{project.description}</p>
      <div className="rec-reason">
        <span className="reason-check">
          <Check size={12} />
        </span>
        <span>Because of {reasons.join(" and ")}.</span>
      </div>
      <div className="rec-foot">
        <div className="rec-owner">
          <Avatar person={owner} size="tiny" />
          <span>{owner?.name.split(" ")[0]}’s project</span>
        </div>
        <span className="rec-roles">
          {application
            ? "Applied"
            : project.roles.length
              ? `${project.roles.length} roles`
              : "New project"}
        </span>
      </div>
    </button>
  );
}

function ArrowUpRightIcon() {
  return <ArrowRight className="card-arrow" size={17} />;
}

function ProjectCard({ project, owner, application, onOpen }) {
  return (
    <article className="project-card">
      <button
        className={`project-card-art art-${project.tone}`}
        onClick={onOpen}
        aria-label={`View ${project.title}`}
      >
        <span className="art-label">
          SIDEQUEST / {project.tags[0]?.toUpperCase()}
        </span>
        <strong>
          {project.title.split(" ").map((word, index) => (
            <span key={index}>
              {word}
              {index < project.title.split(" ").length - 1 && " "}
            </span>
          ))}
        </strong>
        <span className="project-art-arrow">
          <ArrowDownRight size={19} />
        </span>
        <span className="art-grid-lines" />
      </button>
      <div className="project-card-body">
        <div className="project-card-meta">
          <span>
            <Avatar person={owner} size="tiny" />
            {owner?.name || "Student"}
          </span>
          <span>
            {project.createdAt
              ? new Date(`${project.createdAt}T12:00:00`).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric" },
                )
              : "New"}
          </span>
        </div>
        <button className="project-title-button" onClick={onOpen}>
          {project.title}
        </button>
        <span
          className={`project-status-chip status-${(project.status || "recruiting").replace(" ", "-")}`}
        >
          {project.status || "recruiting"}
        </span>
        <p className="project-description">{project.description}</p>
        <div className="tag-row">
          {project.tags.slice(0, 3).map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
        <div className="project-hours">
          <Clock3 size={13} />
          <span>
            {project.hoursPerWeek
              ? `${project.hoursPerWeek} hours/week per teammate`
              : "Weekly commitment not set"}
          </span>
        </div>
        <div className="project-card-foot">
          <div className="roles-preview">
            <Users size={14} />
            <span>
              {project.roles.length
                ? project.roles.slice(0, 2).join(" · ")
                : "Open to collaborators"}
            </span>
          </div>
          <button
            className={`small-apply${application ? " applied" : ""}`}
            onClick={onOpen}
          >
            {application ? "Applied" : "View project"}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

function ApplicationsPage({ applications, projects, users, onOpen }) {
  const [filter, setFilter] = useState("All");
  const visible = applications.filter(
    (application) =>
      filter === "All" || application.status === filter.toLowerCase(),
  );
  return (
    <>
      <PageHeading
        eyebrow="KEEP THE BALL ROLLING"
        title="My applications"
        description="Every new team starts with a first hello."
      />
      <div className="status-summary">
        <div>
          <span>IN THE MIX</span>
          <strong>
            {applications
              .filter((item) => item.status === "pending")
              .length.toString()
              .padStart(2, "0")}
          </strong>
          <small>Waiting for a reply</small>
        </div>
        <div>
          <span>FOUND A TEAM</span>
          <strong>
            {applications
              .filter((item) => item.status === "accepted")
              .length.toString()
              .padStart(2, "0")}
          </strong>
          <small>Ready to get making</small>
        </div>
        <div>
          <span>NEW CONNECTIONS</span>
          <strong>
            {new Set(applications.map((item) => item.projectId)).size
              .toString()
              .padStart(2, "0")}
          </strong>
          <small>Projects you reached out to</small>
        </div>
      </div>
      <div className="list-toolbar">
        <h2>Application history</h2>
        <div className="filter-tabs compact">
          {["All", "Pending", "Accepted", "Declined"].map((status) => (
            <button
              key={status}
              className={filter === status ? "filter-active" : ""}
              onClick={() => setFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>
      {visible.length ? (
        <div className="application-list">
          {visible.map((application) => {
            const project = projects.find(
              (item) => item.id === application.projectId,
            );
            const owner = users.find((item) => item.id === project?.ownerId);
            return (
              <article className="application-row" key={application.id}>
                <div
                  className={`application-project-mark mark-${project?.tone || "peach"}`}
                >
                  <BriefcaseBusiness size={19} />
                </div>
                <div className="application-main">
                  <button
                    className="application-project-name"
                    onClick={() => project && onOpen(project)}
                  >
                    {project?.title || "Project no longer available"}
                    <ArrowRight size={14} />
                  </button>
                  <span className="application-subline">
                    {owner?.name || "Project creator"} <span>·</span> Applied
                    for <strong>{application.role}</strong>
                  </span>
                  <p>“{application.message}”</p>
                </div>
                <div className="application-status-side">
                  <span className={`status-pill status-${application.status}`}>
                    {application.status === "accepted" && <Check size={12} />}
                    {application.status}
                  </span>
                  <span className="application-date">
                    {new Date(
                      `${application.createdAt}T12:00:00`,
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <ArrowDownRight size={22} />
          </div>
          <h3>
            No applications{" "}
            {filter === "All" ? "yet" : `that are ${filter.toLowerCase()}`}.
          </h3>
          <p>Your next team could be one good introduction away.</p>
        </div>
      )}
    </>
  );
}

function MyProjectsPage({
  projects,
  applications,
  users,
  onCreate,
  onEdit,
  onStatusChange,
  onReview,
  onOpen,
}) {
  return (
    <>
      <PageHeading
        eyebrow="THE IDEAS YOU’RE MAKING REAL"
        title="My projects"
        description="Build your team one thoughtful introduction at a time."
        action={
          <button className="button button-dark" onClick={onCreate}>
            <Plus size={17} /> New project
          </button>
        }
      />
      {projects.length ? (
        <div className="owned-project-list">
          {projects.map((project) => {
            const projectStatus = project.status || "recruiting";
            const incoming = applications.filter(
              (application) =>
                application.projectId === project.id &&
                application.status === "pending",
            );
            const accepted = applications.filter(
              (application) =>
                application.projectId === project.id &&
                application.status === "accepted",
            );
            const members = [
              ...new Set([
                ...project.members,
                ...accepted.map((application) => application.applicantId),
              ]),
            ]
              .map((id) => users.find((user) => user.id === id))
              .filter(Boolean);
            const suggestions = users
              .filter(
                (user) =>
                  user.id !== project.ownerId &&
                  !members.some((member) => member.id === user.id),
              )
              .map((user) => ({ user, match: teammateReason(user, project) }))
              .filter(({ match }) => match.skills.length > 0)
              .sort((a, b) => b.match.score - a.match.score)
              .slice(0, 3);
            return (
              <article className="owned-project" key={project.id}>
                <div className={`owned-project-banner art-${project.tone}`}>
                  <span className="art-label">
                    YOUR PROJECT / {project.tags[0]?.toUpperCase()}
                  </span>
                  <h2>{project.title}</h2>
                  <div className="owned-banner-actions">
                    <span
                      className={`project-status-chip status-${projectStatus.replace(" ", "-")}`}
                    >
                      {projectStatus}
                    </span>
                    <button
                      className="button button-light"
                      onClick={() => onEdit(project)}
                    >
                      <Pencil size={14} /> Edit post
                    </button>
                    <button
                      className="button button-light"
                      onClick={() => onReview(project)}
                    >
                      <Users size={16} /> Manage team
                    </button>
                    <button
                      className="icon-button"
                      onClick={() => onOpen(project)}
                      aria-label="View project"
                    >
                      <ArrowRight size={17} />
                    </button>
                  </div>
                </div>
                <div className="owned-project-content">
                  <div className="owned-project-stats">
                    <span>
                      <strong>{members.length + 1}</strong> on the team
                    </span>
                    <span>
                      <strong>{incoming.length}</strong> waiting to join
                    </span>
                    <label className="owned-status-control">
                      <span>Status</span>
                      <select
                        value={projectStatus}
                        onChange={(event) =>
                          onStatusChange(project.id, event.target.value)
                        }
                      >
                        <option value="recruiting">Recruiting</option>
                        <option value="in progress">In progress</option>
                        <option value="completed">Completed</option>
                        <option value="paused">Paused</option>
                      </select>
                    </label>
                    <button
                      className="text-button"
                      onClick={() => onReview(project)}
                    >
                      Review applications <ArrowRight size={15} />
                    </button>
                  </div>
                  <div className="team-line">
                    <span className="team-line-label">YOUR TEAM</span>
                    <div className="team-avatars">
                      <Avatar
                        person={users.find(
                          (user) => user.id === project.ownerId,
                        )}
                        size="small"
                      />
                      {members.map((member) => (
                        <Avatar key={member.id} person={member} size="small" />
                      ))}
                    </div>
                    <span className="team-names">
                      {[
                        users.find((user) => user.id === project.ownerId)?.name,
                        ...members.map((member) => member.name),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                  {suggestions.length > 0 && (
                    <div className="teammate-suggestions">
                      <div className="suggestion-heading">
                        <div>
                          <span className="team-line-label">
                            POTENTIAL TEAMMATES
                          </span>
                          <p>Students whose skills fit this project.</p>
                        </div>
                        <Sparkles size={16} />
                      </div>
                      <div className="teammate-row">
                        {suggestions.map(({ user, match }) => (
                          <div className="teammate-card" key={user.id}>
                            <Avatar person={user} size="small" />
                            <div className="teammate-info">
                              <strong>{user.name}</strong>
                              <span>{user.university}</span>
                              <small>
                                <Check size={12} /> {match.skills.join(", ")}{" "}
                                match
                              </small>
                            </div>
                            <span className="match-score">
                              {match.percent}% · {user.hoursPerWeek ? `${match.availableHours} h/wk` : "hours not set"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="create-first">
          <div className="create-first-graphic">
            <Sparkles size={27} />
          </div>
          <span className="eyebrow">GOT A LITTLE SPARK?</span>
          <h2>
            Every good project
            <br />
            starts somewhere.
          </h2>
          <p>
            Share the idea you can’t stop thinking about. Your future teammates
            are already here.
          </p>
          <button className="button button-dark" onClick={onCreate}>
            <Plus size={17} /> Post your first idea
          </button>
        </div>
      )}
    </>
  );
}

function ProfilePage({ user, projects, users, onEdit, onNavigate }) {
  const owned = projects.filter((project) => project.ownerId === user.id);
  return (
    <>
      <PageHeading
        eyebrow="A LITTLE ABOUT YOU"
        title="My profile"
        description="The things you care about are how the right people find you."
        action={
          <button className="button button-outline" onClick={onEdit}>
            <Settings2 size={16} /> Edit profile
          </button>
        }
      />
      <div className="profile-layout">
        <section className="profile-card">
          <div className="profile-cover">
            <div className="cover-stamp">
              <Sparkles size={20} />
            </div>
          </div>
          <div className="profile-identity">
            <Avatar person={user} size="large" />
            <div>
              <h2>{user.name}</h2>
              <p>
                <GraduationCap size={15} />
                {user.university || "University not added"}
              </p>
            </div>
            <span className="profile-status">
              <span className="online-dot" /> Open to projects
            </span>
          </div>
          <div className="profile-detail">
            <div className="eyebrow">A FEW WORDS</div>
            <p>
              {user.bio ||
                "No bio yet. Add a few words to help future teammates get to know you."}
            </p>
          </div>
          <div className="profile-detail">
            <div className="eyebrow">TIME I CAN BRING</div>
            <div className="profile-hours">
              <Clock3 size={16} />
              <strong>{user.hoursPerWeek || "Not set"}</strong>
              <span>{user.hoursPerWeek ? "hours per week" : "Add your weekly availability"}</span>
            </div>
          </div>
          <div className="profile-detail">
            <div className="eyebrow">THINGS I CAN BRING</div>
            <div className="tag-row profile-tags">
              {user.skills.length ? (
                user.skills.map((skill) => <Tag key={skill}>{skill}</Tag>)
              ) : (
                <button className="inline-add" onClick={onEdit}>
                  <Plus size={13} /> Add your skills
                </button>
              )}
            </div>
          </div>
          <div className="profile-detail">
            <div className="eyebrow">THINGS I CARE ABOUT</div>
            <div className="tag-row profile-tags interest-tags">
              {user.interests.length ? (
                user.interests.map((interest) => (
                  <Tag key={interest}>{interest}</Tag>
                ))
              ) : (
                <button className="inline-add" onClick={onEdit}>
                  <Plus size={13} /> Add your interests
                </button>
              )}
            </div>
          </div>
        </section>
        <aside className="profile-side">
          <div className="profile-side-panel">
            <div className="eyebrow">YOUR FOOTPRINT</div>
            <div className="footprint-stat">
              <strong>{owned.length}</strong>
              <span>ideas started</span>
            </div>
            <div className="footprint-stat">
              <strong>
                {projects.reduce(
                  (sum, project) =>
                    sum +
                    (project.ownerId === user.id ? project.members.length : 0),
                  0,
                )}
              </strong>
              <span>teammates found</span>
            </div>
            <button
              className="profile-side-link"
              onClick={() => onNavigate("my projects")}
            >
              See your projects <ArrowRight size={15} />
            </button>
          </div>
          <div className="profile-note">
            <Sparkles size={17} />
            <p>A good team starts with knowing what each person brings.</p>
            <button onClick={onEdit}>
              Keep your profile fresh <ArrowRight size={14} />
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}

function ProjectModal({
  project,
  currentUser,
  users,
  applications,
  onClose,
  onApply,
}) {
  const owner = users.find((user) => user.id === project.ownerId);
  const existing = applications.find(
    (application) =>
      application.projectId === project.id &&
      application.applicantId === currentUser.id,
  );
  const isOwner = project.ownerId === currentUser.id;
  const projectStatus = project.status || "recruiting";
  const [role, setRole] = useState(project.roles[0] || "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const match = matchReason(currentUser, project);
  const team = [...new Set(project.members || [])]
    .map((id) => users.find((user) => user.id === id))
    .filter(Boolean);
  return (
    <Modal title="A little more about the idea" onClose={onClose} wide>
      <div className={`project-modal-cover art-${project.tone}`}>
        <span className="art-label">
          SIDEQUEST / {project.tags[0]?.toUpperCase()}
        </span>
        <h2>{project.title}</h2>
        <span
          className={`project-status-chip status-${projectStatus.replace(" ", "-")}`}
        >
          {projectStatus}
        </span>
        <span className="project-art-arrow">
          <ArrowDownRight size={20} />
        </span>
      </div>
      <div className="project-modal-content">
        <div className="project-modal-primary">
          <div className="project-owner-line">
            <Avatar person={owner} size="small" />
            <div>
              <strong>{owner?.name || "Student creator"}</strong>
              <span>
                {owner?.university || "University student"} · project creator
              </span>
            </div>
          </div>
          <h3>The idea</h3>
          <p className="modal-description">{project.description}</p>
          <h3>Looking for</h3>
          <div className="tag-row">
            {project.roles.length ? (
              project.roles.map((item) => <Tag key={item}>{item}</Tag>)
            ) : (
              <span className="subtle-note">
                Open to all kinds of collaborators
              </span>
            )}
          </div>
          <h3>Time commitment</h3>
          <div className="project-hours project-modal-hours">
            <Clock3 size={15} />
            <span>
              {project.hoursPerWeek
                ? `${project.hoursPerWeek} hours/week per teammate`
                : "Not set by creator"}
            </span>
          </div>
          <h3>Interested in</h3>
          <div className="tag-row">
            {project.tags.map((tag) => (
              <Tag key={tag} muted>
                {tag}
              </Tag>
            ))}
          </div>
          {team.length > 0 && (
            <>
              <h3>Already on the team</h3>
              <div className="modal-team">
                {team.map((member) => (
                  <span key={member.id}>
                    <Avatar person={member} size="tiny" />
                    {member.name}
                  </span>
                ))}
              </div>
            </>
          )}
          {match.score > 0 && !isOwner && (
            <div className="match-explainer">
              <Sparkles size={16} />
              <span>
                <strong>Why this could fit you:</strong>{" "}
                {[
                  ...match.skills.map((skill) => `you have ${skill}`),
                  ...match.interests.map(
                    (interest) => `you care about ${interest.toLowerCase()}`,
                  ),
                  match.hoursFit
                    ? `you can commit ${match.availableHours} hours per week, which meets the ${match.expectedHours}-hour expectation`
                    : match.expectedHours === null
                      ? "the project has not set a weekly hour expectation yet"
                      : `the project expects ${match.expectedHours} hours per week and you list ${match.availableHours}`,
                ].join(" and ")}
                .
              </span>
            </div>
          )}
        </div>
        <div className="project-apply-panel">
          <div className="eyebrow">MAKE THE FIRST MOVE</div>
          {isOwner ? (
            <>
              <div className="already-applied">
                <BriefcaseBusiness size={20} />
                <strong>This one’s yours.</strong>
                <span>
                  Manage your team and incoming applications from My projects.
                </span>
              </div>
            </>
          ) : existing ? (
            <div className="already-applied">
              <CheckCircle2 size={21} />
              <strong>You’re in the mix.</strong>
              <span>
                Your application is{" "}
                <span className={`status-inline status-${existing.status}`}>
                  {existing.status}
                </span>
                .
              </span>
            </div>
          ) : projectStatus !== "recruiting" ? (
            <div className="already-applied">
              <BriefcaseBusiness size={20} />
              <strong>Not accepting applications</strong>
              <span>
                This project is {projectStatus}. Check back if the creator
                reopens recruiting.
              </span>
            </div>
          ) : project.roles.length ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!message.trim()) {
                  setError(
                    "Add a short note so the creator can get to know you.",
                  );
                  return;
                }
                onApply(project, role, message.trim());
              }}
            >
              <label>
                Pick a role
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                >
                  {project.roles.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label>
                A short hello
                <textarea
                  required
                  minLength={8}
                  maxLength={300}
                  placeholder="What would you bring to this project?"
                  value={message}
                  onChange={(event) => {
                    setMessage(event.target.value);
                    setError("");
                  }}
                />
              </label>
              <span className="character-count">{message.length}/300</span>
              {error && <p className="form-error">{error}</p>}
              <button className="button button-dark full-button">
                <ArrowRight size={16} /> Send an application
              </button>
              <small className="apply-note">
                Your profile goes with your application.
              </small>
            </form>
          ) : (
            <p className="subtle-note">
              The creator is still putting their team together. Check back soon.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}

function CreateProjectModal({ project, onClose, onCreate, onEditProject }) {
  const [form, setForm] = useState({
    title: project?.title || "",
    description: project?.description || "",
    tags: project?.tags.join(", ") || "",
    roles: project?.roles.join(", ") || "",
    hoursPerWeek: String(project?.hoursPerWeek || 5),
  });
  const [error, setError] = useState("");
  function submit(event) {
    event.preventDefault();
    const tags = form.tags
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const roles = form.roles
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (!tags.length || !roles.length) {
      setError("Add at least one interest tag and one role or skill.");
      return;
    }
    const updatedProject = {
      title: form.title.trim(),
      description: form.description.trim(),
      tags,
      roles,
      hoursPerWeek: Number(form.hoursPerWeek),
    };
    if (project) onEditProject(project.id, updatedProject);
    else onCreate(updatedProject);
  }
  return (
    <Modal
      title={project ? "Edit your project" : "Put an idea out there"}
      onClose={onClose}
    >
      <p className="modal-intro">
        {project
          ? "Update the details so the right people know what you need."
          : "It doesn’t need to be all figured out. The right people can help with that."}
      </p>
      <form className="form-stack project-create-form" onSubmit={submit}>
        <label>
          Give it a name
          <input
            required
            maxLength={60}
            placeholder="e.g. A better campus map"
            value={form.title}
            onChange={(event) =>
              setForm({ ...form, title: event.target.value })
            }
          />
        </label>
        <label>
          What are you thinking?
          <textarea
            required
            minLength={20}
            maxLength={400}
            placeholder="A sentence or two about the thing you want to make…"
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
          />
        </label>
        <label>
          Interests and themes
          <input
            required
            placeholder="e.g. climate, student life, design"
            value={form.tags}
            onChange={(event) => setForm({ ...form, tags: event.target.value })}
          />
          <small>Separate a few tags with commas.</small>
        </label>
        <label>
          Roles or skills you’re looking for
          <input
            required
            placeholder="e.g. React, research, illustration"
            value={form.roles}
            onChange={(event) =>
              setForm({ ...form, roles: event.target.value })
            }
          />
          <small>
            Separate roles with commas. You can still welcome other
            collaborators.
          </small>
        </label>
        <label>
          Hours expected from each teammate per week
          <input
            required
            type="number"
            min="1"
            max="80"
            step="1"
            value={form.hoursPerWeek}
            onChange={(event) =>
              setForm({ ...form, hoursPerWeek: event.target.value })
            }
          />
          <small>Choose a realistic weekly commitment, from 1 to 80 hours.</small>
        </label>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-form-actions">
          <button
            type="button"
            className="button button-outline"
            onClick={onClose}
          >
            Not yet
          </button>
          <button className="button button-dark">
            {project ? <Check size={16} /> : <Plus size={16} />}
            {project ? "Save changes" : "Share this idea"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ProfileModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({
    name: user.name,
    university: user.university || "",
    bio: user.bio || "",
    skills: user.skills.join(", "),
    interests: user.interests.join(", "),
    hoursPerWeek: user.hoursPerWeek ? String(user.hoursPerWeek) : "",
  });
  const [error, setError] = useState("");
  function submit(event) {
    event.preventDefault();
    const split = (value) => [
      ...new Set(
        value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    ];
    const skills = split(form.skills);
    const interests = split(form.interests);
    const hoursPerWeek = Number(form.hoursPerWeek);
    if (!skills.length || !interests.length || !Number.isInteger(hoursPerWeek) || hoursPerWeek < 1 || hoursPerWeek > 80) {
      setError(
        "Add at least one skill, one interest, and weekly availability from 1 to 80 hours.",
      );
      return;
    }
    onSave({ ...form, skills, interests, hoursPerWeek });
  }
  return (
    <Modal title="Make your profile yours" onClose={onClose}>
      <p className="modal-intro">
        A little about you helps good collaborators find their way to you.
      </p>
      <form className="form-stack" onSubmit={submit}>
        <label>
          Your name
          <input
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </label>
        <label>
          Your university
          <input
            required
            value={form.university}
            onChange={(event) =>
              setForm({ ...form, university: event.target.value })
            }
          />
        </label>
        <label>
          A short bio
          <textarea
            maxLength={220}
            placeholder="What do you like making? What are you curious about?"
            value={form.bio}
            onChange={(event) => setForm({ ...form, bio: event.target.value })}
          />
          <small>{form.bio.length}/220</small>
        </label>
        <label>
          Skills
          <input
            required
            placeholder="e.g. Figma, writing, React"
            value={form.skills}
            onChange={(event) =>
              setForm({ ...form, skills: event.target.value })
            }
          />
          <small>Separate skills with commas.</small>
        </label>
        <label>
          Interests
          <input
            required
            placeholder="e.g. accessibility, climate, music"
            value={form.interests}
            onChange={(event) =>
              setForm({ ...form, interests: event.target.value })
            }
          />
          <small>Separate interests with commas.</small>
        </label>
        <label>
          Hours I can commit each week
          <input
            required
            type="number"
            min="1"
            max="80"
            step="1"
            value={form.hoursPerWeek}
            onChange={(event) =>
              setForm({ ...form, hoursPerWeek: event.target.value })
            }
          />
          <small>Set the maximum you can reliably make time for.</small>
        </label>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-form-actions">
          <button
            type="button"
            className="button button-outline"
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="button button-dark">
            <Check size={16} /> Save profile
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ManageProjectModal({
  project,
  applications,
  users,
  onClose,
  onUpdate,
}) {
  const incoming = applications.filter(
    (application) => application.projectId === project.id,
  );
  const teamIds = new Set([
    ...(project.members || []),
    ...incoming
      .filter((application) => application.status === "accepted")
      .map((application) => application.applicantId),
  ]);
  const team = [...teamIds]
    .map((id) => users.find((user) => user.id === id))
    .filter(Boolean);
  const suggestions = users
    .filter((user) => user.id !== project.ownerId && !teamIds.has(user.id))
    .map((user) => ({ user, match: teammateReason(user, project) }))
    .filter(({ match }) => match.skills.length > 0)
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, 4);
  return (
    <Modal title="Your team, taking shape" onClose={onClose} wide>
      <div className={`manage-banner art-${project.tone}`}>
        <div>
          <span className="art-label">YOUR PROJECT</span>
          <h2>{project.title}</h2>
        </div>
        <div className="team-count">
          <Users size={17} />
          {team.length + 1} on the team
        </div>
      </div>
      <div className="manage-content">
        <section className="manage-section">
          <div className="manage-section-title">
            <div>
              <span className="eyebrow">THE PEOPLE WHO SAID HELLO</span>
              <h3>
                Applications{" "}
                <span>
                  {incoming.filter((item) => item.status === "pending").length}
                </span>
              </h3>
            </div>
            <span className="manage-total">{incoming.length} total</span>
          </div>
          {incoming.length ? (
            <div className="applicant-list">
              {incoming.map((application) => {
                const person = users.find(
                  (user) => user.id === application.applicantId,
                );
                const match = teammateReason(person || { skills: [] }, project);
                return (
                  <article className="applicant-card" key={application.id}>
                    <div className="applicant-head">
                      <Avatar person={person} size="normal" />
                      <div className="applicant-person">
                        <strong>{person?.name || "Student"}</strong>
                        <span>
                          {person?.university || "University student"}
                        </span>
                      </div>
                      <span
                        className={`status-pill status-${application.status}`}
                      >
                        {application.status === "accepted" && (
                          <Check size={12} />
                        )}
                        {application.status}
                      </span>
                    </div>
                    <div className="applicant-role">
                      Applied for <strong>{application.role}</strong>
                      {match.skills.length > 0 && (
                        <span className="applicant-match">
                          <Sparkles size={12} /> {match.skills.join(", ")} match
                        </span>
                      )}
                    </div>
                    <div className="applicant-capacity">
                      <Clock3 size={13} />
                      <span>
                        {person?.hoursPerWeek
                          ? `${person.hoursPerWeek} h/wk available`
                          : "Availability not set"}
                        {" · "}
                        {project.hoursPerWeek
                          ? `${project.hoursPerWeek} h/wk expected`
                          : "Project hours not set"}
                      </span>
                      <strong
                        className={
                          match.expectedHours === null
                            ? "capacity-unset"
                            : match.hoursFit
                              ? "capacity-fit"
                              : "capacity-gap"
                        }
                      >
                        {match.expectedHours === null
                          ? "Hours not set"
                          : match.hoursFit
                            ? "Hours fit"
                            : "Hours gap"}
                      </strong>
                    </div>
                    <p className="applicant-bio">
                      {person?.bio || "This student has not added a bio yet."}
                    </p>
                    <div className="tag-row applicant-skills">
                      {(person?.skills || []).slice(0, 5).map((skill) => (
                        <Tag key={skill}>{skill}</Tag>
                      ))}
                    </div>
                    <blockquote>“{application.message}”</blockquote>
                    {application.status === "pending" && (
                      <div className="applicant-actions">
                        <button
                          className="button button-outline reject-button"
                          onClick={() => onUpdate(application.id, "declined")}
                        >
                          <XCircle size={15} /> Pass for now
                        </button>
                        <button
                          className="button button-dark"
                          onClick={() => onUpdate(application.id, "accepted")}
                        >
                          <CheckCircle2 size={15} /> Invite to the team
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state compact-empty">
              <div className="empty-icon">
                <Users size={21} />
              </div>
              <h3>Your next teammate hasn’t said hello yet.</h3>
              <p>In the meantime, see who else might fit your project.</p>
            </div>
          )}
        </section>
        <aside className="manage-aside">
          <span className="eyebrow">A FEW GOOD FITS</span>
          <h3>Potential teammates</h3>
          <p>Students with skills this project needs.</p>
          {suggestions.length ? (
            suggestions.map(({ user, match }) => (
              <div className="potential-person" key={user.id}>
                <Avatar person={user} size="small" />
                <div>
                  <strong>{user.name}</strong>
                  <span>{match.skills.join(", ")}</span>
                  <small>
                    {user.interests
                      .filter((interest) =>
                        project.tags.some(
                          (tag) => normalize(tag) === normalize(interest),
                        ),
                      )
                      .map((interest) => interest.toLowerCase())
                      .join(" · ") || user.university}
                  </small>
                </div>
                <span className="match-score">
                  {match.percent}% · {match.availableHours} h/wk
                </span>
              </div>
            ))
          ) : (
            <p className="subtle-note">
              Add more required skills to find relevant students.
            </p>
          )}
          <div className="team-roster">
            <span className="eyebrow">ON THE TEAM ({team.length + 1})</span>
            <div className="potential-person">
              <Avatar
                person={users.find((user) => user.id === project.ownerId)}
                size="small"
              />
              <div>
                <strong>
                  {users.find((user) => user.id === project.ownerId)?.name ||
                    "You"}
                </strong>
                <span>Project creator</span>
              </div>
            </div>
            {team.map((member) => (
              <div className="potential-person" key={member.id}>
                <Avatar person={member} size="small" />
                <div>
                  <strong>{member.name}</strong>
                  <span>
                    {member.skills.slice(0, 2).join(" · ") || "Team member"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </Modal>
  );
}