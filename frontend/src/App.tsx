import { connectWallet, readLedgerStats } from "./ledger";

import { useState } from "react";

import {

  Activity,

  ArrowLeftRight,

  ArrowUpRight,

  Ban,

  CheckCircle2,

  ChevronRight,

  CircleDollarSign,

  ClipboardCheck,

  Coins,

  FileCheck2,

  FileText,

  Fingerprint,

  LayoutDashboard,

  Leaf,

  Menu,

  Plus,

  Search,

  ShieldCheck,

  TrendingDown,

  Wallet,

  X,

} from "lucide-react";

import "./App.css";

type Project = {
  id: number;
  chainProjectId?: number;
  name: string;
  developer: string;
  location: string;
  units: number;
  status: "Pending" | "Verified" | "Rejected";
};

type EventRecord = {

  id: number;

  action: string;

  details: string;

  time: string;

};

type Page =

  | "Overview"

  | "Projects"

  | "Credit Management"

  | "Verification Console"

  | "Blockchain Explorer"

  | "Audit Trail";

export default function App() {

  const [page, setPage] = useState<Page>("Overview");

  const [mobileMenu, setMobileMenu] = useState(false);

  const [search, setSearch] = useState("");

  const [showProjectForm, setShowProjectForm] = useState(false);

  const [showIssueForm, setShowIssueForm] = useState(false);

  const [showTransferForm, setShowTransferForm] = useState(false);

  const [showRetireForm, setShowRetireForm] = useState(false);

  const [notice, setNotice] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [chainStats, setChainStats] = useState<{
    issued: string;
    retired: string;
    outstanding: string;
  } | null>(null);
  const [walletError, setWalletError] = useState("");
  const [walletLoading, setWalletLoading] = useState(false);

  const [projects, setProjects] = useState<Project[]>([

    {

      id: 1,

      name: "Western Ghats Reforestation",

      developer: "Green Earth Foundation",

      location: "Maharashtra, India",

      units: 1000,

      status: "Verified",

    },

    {

      id: 2,

      name: "Solar Energy Initiative",

      developer: "Sunrise Energy",

      location: "Rajasthan, India",

      units: 2500,

      status: "Pending",

    },

    {

      id: 3,

      name: "Community Biogas Project",

      developer: "Clean Village Network",

      location: "Gujarat, India",

      units: 500,

      status: "Pending",

    },

  ]);

  // Demo ledger state. This is not yet a live blockchain.

  const [issued, setIssued] = useState(1000);

  const [retired, setRetired] = useState(0);

  const [balances, setBalances] = useState<Record<string, number>>({

    "Holder A": 1000,

    "Holder B": 0,

  });

  const [events, setEvents] = useState<EventRecord[]>([

    {

      id: 1,

      action: "Project verified",

      details: "Western Ghats Reforestation",

      time: "Just now",

    },

    {

      id: 2,

      action: "Credits issued",

      details: "1,000 demo registry credit units",

      time: "Earlier",

    },

  ]);

  const [projectName, setProjectName] = useState("");

  const [developer, setDeveloper] = useState("");

  const [location, setLocation] = useState("");
  const [evidenceURI, setEvidenceURI] = useState("");
  const [registeringProject, setRegisteringProject] = useState(false);

  const [projectUnits, setProjectUnits] = useState("1000");

  const [selectedProject, setSelectedProject] = useState("1");

  const [issueAmount, setIssueAmount] = useState("100");

  const [issueHolder, setIssueHolder] = useState("Holder A");

  const [transferFrom, setTransferFrom] = useState("Holder A");

  const [transferTo, setTransferTo] = useState("Holder B");

  const [transferAmount, setTransferAmount] = useState("100");

  const [retireHolder, setRetireHolder] = useState("Holder A");

  const [retireAmount, setRetireAmount] = useState("100");

  const outstanding = issued - retired;

  const holderNames = Object.keys(balances);

  async function handleConnectWallet() {
    try {
      setWalletLoading(true);
      setWalletError("");
      const result = await connectWallet();
      setWalletAddress(result.address);
      const stats = await readLedgerStats();
      setChainStats(stats);
      showNotice("Wallet connected to CarbonLedger.");
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Could not connect to the local blockchain.";
      setWalletError(message);
      showNotice(`Wallet connection failed: ${message}`);
    } finally {
      setWalletLoading(false);
    }
  }

  function addEvent(action: string, details: string) {

    setEvents((previous) => [

      {

        id: Date.now(),

        action,

        details,

        time: new Date().toLocaleString(),

      },

      ...previous,

    ]);

  }

  function showNotice(message: string) {

    setNotice(message);

  }

  async function registerProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!projectName.trim() || !developer.trim() || !location.trim() || !evidenceURI.trim()) {
      showNotice("Please complete all project fields.");
      return;
    }

    const proposedUnits = Number(projectUnits);
    if (!Number.isSafeInteger(proposedUnits) || proposedUnits < 0) {
      showNotice("Enter a valid whole number of proposed units.");
      return;
    }

    try {
      setRegisteringProject(true);
      showNotice("Please confirm the registration in MetaMask.");

      const { address, contract } = await connectWallet();
      setWalletAddress(address);
      const tx = await contract.registerProject(
        projectName.trim(),
        location.trim(),
        evidenceURI.trim(),
      );
      showNotice("Transaction submitted. Waiting for confirmation...");
      const receipt = await tx.wait();
      if (!receipt) throw new Error("No transaction receipt was returned.");

  
const registeredEvent: any = receipt.logs
  .map((log: any) => {
    try {
      return contract.interface.parseLog(log);
    } catch {
      return null;
    }
  })
  .find((entry: any) => entry?.name === "ProjectRegistered");


      const chainProjectId = registeredEvent
        ? Number(registeredEvent.args.projectId)
        : null;

      const project: Project = {
        id: Date.now(),
        chainProjectId: chainProjectId ?? undefined,
        name: projectName.trim(),
        developer: developer.trim(),
        location: location.trim(),
        units: proposedUnits,
        status: "Pending",
      };

      setProjects((previous) => [project, ...previous]);
      addEvent(
        "Project registered on-chain",
        `Project ID: ${chainProjectId ?? "see contract"} | Developer wallet: ${address} | Tx: ${tx.hash}`,
      );

      setProjectName("");
      setDeveloper("");
      setLocation("");
      setEvidenceURI("");
      setProjectUnits("1000");
      setShowProjectForm(false);
      const updatedStats = await readLedgerStats();
      setChainStats(updatedStats);
      showNotice(`Project registered on-chain successfully. Project ID: ${chainProjectId ?? "check transaction"}.`);
    } catch (error) {
      console.error("Project registration failed:", error);
      showNotice(
        error instanceof Error
          ? `Registration failed: ${error.message}`
          : "Registration failed. Check MetaMask and the Hardhat node.",
      );
    } finally {
      setRegisteringProject(false);
    }
  }

  
async function verifyProject(id: number, approved: boolean) {
  const project = projects.find((item) => item.id === id);

  if (!project || project.status !== "Pending") return;

  if (project.chainProjectId === undefined) {
    showNotice(
      "This is a sample project. Register a project on the blockchain before verifying it."
    );
    return;
  }

  try {
    showNotice("Confirm the transaction in MetaMask.");

    const { address, contract } = await connectWallet();
    setWalletAddress(address);

    const tx = await contract.reviewProject(
      project.chainProjectId,
      approved
    );

    showNotice("Waiting for blockchain confirmation...");
    await tx.wait();

    setProjects((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,
              status: approved ? "Verified" : "Rejected",
            }
          : item
      )
    );

    addEvent(
      approved ? "Project approved on blockchain" : "Project rejected on blockchain",
      project.name
    );

    showNotice(
      approved
        ? `${project.name} was verified on the blockchain.`
        : `${project.name} was rejected on the blockchain.`
    );
  } catch (error: any) {
    console.error("Verification failed:", error);

    if (error?.code === "ACTION_REJECTED" || error?.code === 4001) {
      showNotice("You cancelled the MetaMask transaction.");
    } else {
      showNotice(
        error?.shortMessage ||
          error?.reason ||
          error?.message ||
          "Verification failed. Check your wallet and permissions."
      );
    }
  }
}


  function issueCredits(event: React.FormEvent<HTMLFormElement>) {

    event.preventDefault();

    const amount = Number(issueAmount);

    const project = projects.find(

      (item) => item.id === Number(selectedProject),

    );

    if (!project || project.status !== "Verified") {

      showNotice("Select a verified project before issuing credits.");

      return;

    }

    if (!Number.isSafeInteger(amount) || amount <= 0) {

      showNotice("Enter a positive whole-number amount.");

      return;

    }

    setIssued((previous) => previous + amount);

    setBalances((previous) => ({

      ...previous,

      [issueHolder]: (previous[issueHolder] || 0) + amount,

    }));

    addEvent(

      "Credits issued",

      `${amount.toLocaleString()} units for ${project.name} to ${issueHolder}`,

    );

    setShowIssueForm(false);

    showNotice(

      `${amount.toLocaleString()} demo registry credit units issued to ${issueHolder}.`,

    );

  }

  function transferCredits(event: React.FormEvent<HTMLFormElement>) {

    event.preventDefault();

    const amount = Number(transferAmount);

    const available = balances[transferFrom] || 0;

    if (transferFrom === transferTo) {

      showNotice("Choose two different holders.");

      return;

    }

    if (!Number.isSafeInteger(amount) || amount <= 0) {

      showNotice("Enter a positive whole-number amount.");

      return;

    }

    if (amount > available) {

      showNotice(`${transferFrom} does not have enough available units.`);

      return;

    }

    setBalances((previous) => ({

      ...previous,

      [transferFrom]: previous[transferFrom] - amount,

      [transferTo]: (previous[transferTo] || 0) + amount,

    }));

    addEvent(

      "Credits transferred",

      `${amount.toLocaleString()} units from ${transferFrom} to ${transferTo}`,

    );

    setShowTransferForm(false);

    showNotice(`${amount.toLocaleString()} units transferred in the demo.`);

  }

  function retireCredits(event: React.FormEvent<HTMLFormElement>) {

    event.preventDefault();

    const amount = Number(retireAmount);

    const available = balances[retireHolder] || 0;

    if (!Number.isSafeInteger(amount) || amount <= 0) {

      showNotice("Enter a positive whole-number amount.");

      return;

    }

    if (amount > available) {

      showNotice(`${retireHolder} does not have enough units to retire.`);

      return;

    }

    setBalances((previous) => ({

      ...previous,

      [retireHolder]: previous[retireHolder] - amount,

    }));

    setRetired((previous) => previous + amount);

    addEvent(

      "Credits retired",

      `${amount.toLocaleString()} units retired by ${retireHolder}`,

    );

    setShowRetireForm(false);

    showNotice(`${amount.toLocaleString()} units retired in the demo.`);

  }

  const filteredProjects = projects.filter((project) =>

    `${project.name} ${project.developer} ${project.location} ${project.status}`

      .toLowerCase()

      .includes(search.toLowerCase()),

  );

  const navItems: { name: Page; icon: typeof LayoutDashboard }[] = [

    { name: "Overview", icon: LayoutDashboard },

    { name: "Projects", icon: Leaf },

    { name: "Credit Management", icon: Coins },

    { name: "Verification Console", icon: ClipboardCheck },

    { name: "Blockchain Explorer", icon: Fingerprint },

    { name: "Audit Trail", icon: FileText },

  ];

  function changePage(nextPage: Page) {

    setPage(nextPage);

    setMobileMenu(false);

    setNotice("");

  }

  return (

    <div className="app-shell">

      {mobileMenu && (

        <button

          className="mobile-overlay"

          aria-label="Close navigation"

          onClick={() => setMobileMenu(false)}

        />

      )}

      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>

        <div className="brand">

          <div className="brand-icon">

            <Leaf size={23} />

          </div>

          <div>

            <h1>CarbonLedger</h1>

            <span>REGISTRY PLATFORM</span>

          </div>

          <button

            className="mobile-close"

            aria-label="Close menu"

            onClick={() => setMobileMenu(false)}

          >

            <X size={20} />

          </button>

        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="navigation">

          {navItems.map((item) => {

            const Icon = item.icon;

            return (

              <button

                key={item.name}

                className={`nav-item ${page === item.name ? "active" : ""}`}

                onClick={() => changePage(item.name)}

              >

                <Icon size={18} />

                <span>{item.name}</span>

                {page === item.name && <ChevronRight size={16} />}

              </button>

            );

          })}

        </nav>

        <div className="sidebar-bottom">

          <div className="network-status">

            <span className="status-dot" />

            <div>

              <strong>Demo environment</strong>

              <span>Local application state</span>

            </div>

          </div>

          <div className="profile">

            <div className="avatar">CL</div>

            <div className="profile-info">

              <strong>Registry Admin</strong>

              <span>Demo account</span>

            </div>

            <ShieldCheck size={18} />

          </div>

        </div>

      </aside>

      <main className="main-content">

        <header className="topbar">

          <div className="breadcrumb">

            <button

              className="mobile-menu"

              aria-label="Open navigation"

              onClick={() => setMobileMenu(true)}

            >

              <Menu size={22} />

            </button>

            <span>CarbonLedger</span>

            <ChevronRight size={15} />

            <strong>{page}</strong>

          </div>

          <div className="topbar-right">

            <span className="demo-badge">

              <span className="status-dot" />

              DEMO MODE

            </span>

            <button
              className="secondary-button wallet-connect-button"
              type="button"
              onClick={handleConnectWallet}
              disabled={walletLoading}
            >
              <Wallet size={16} />
              {walletLoading
                ? "Connecting..."
                : walletAddress
                  ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                  : "Connect Wallet"}
            </button>
            <div className="top-avatar">RA</div>

          </div>

        </header>

        <div className="page-container">

          <div className="demo-notice">
            <ShieldCheck size={17} />
            <span>
              Prototype only. Project registration uses the configured local blockchain;
              verification, issuance, transfer, and retirement are still demo actions.
              This is not a certified carbon registry.
            </span>
          </div>
          {walletError && <div className="toast-message" role="alert">{walletError}</div>}
          {chainStats && (
            <div className="demo-notice">
              <span>On-chain totals — Issued: {Number(chainStats.issued).toLocaleString()} · Retired: {Number(chainStats.retired).toLocaleString()} · Outstanding: {Number(chainStats.outstanding).toLocaleString()}</span>
            </div>
          )}

          {notice && (

            <div className="toast-message" role="status">

              <CheckCircle2 size={18} />

              <span>{notice}</span>

              <button

                aria-label="Dismiss message"

                onClick={() => setNotice("")}

              >

                <X size={16} />

              </button>

            </div>

          )}

          {page === "Overview" && (

            <>

              <div className="page-heading">

                <div>

                  <div className="eyebrow">REGISTRY DASHBOARD</div>

                  <h2>Overview</h2>

                  <p>Track projects, registry units, and recent activity.</p>

                </div>

                <button

                  className="primary-button"

                  onClick={() => setShowProjectForm(true)}

                >

                  <Plus size={17} /> Register project

                </button>

              </div>

              <div className="metrics-grid">

                <MetricCard

                  icon={Leaf}

                  label="Total projects"

                  value={projects.length.toString()}

                  note="Registered in this demo"

                  color="green"

                />

                <MetricCard

                  icon={Coins}

                  label="Total issued units"

                  value={issued.toLocaleString()}

                  note="Cumulative issuance"

                  color="blue"

                />

                <MetricCard

                  icon={Wallet}

                  label="Outstanding units"

                  value={outstanding.toLocaleString()}

                  note="Issued minus retired"

                  color="purple"

                />

                <MetricCard

                  icon={TrendingDown}

                  label="Retired units"

                  value={retired.toLocaleString()}

                  note="Unavailable for reuse"

                  color="orange"

                />

              </div>

              <div className="overview-grid">

                <section className="panel projects-panel">

                  <div className="panel-heading">

                    <div>

                      <h3>Project pipeline</h3>

                      <p>Recent projects and their verification status</p>

                    </div>

                    <button

                      className="text-button"

                      onClick={() => changePage("Projects")}

                    >

                      View all <ArrowUpRight size={15} />

                    </button>

                  </div>

                  <ProjectTable

                    projects={projects.slice(0, 4)}

                    onSelect={(id) => {

                      setSelectedProject(String(id));

                      changePage("Verification Console");

                    }}

                  />

                </section>

                <section className="panel activity-panel">

                  <div className="panel-heading">

                    <div>

                      <h3>Recent activity</h3>

                      <p>Latest demo registry events</p>

                    </div>

                    <Activity size={18} className="muted-icon" />

                  </div>

                  <EventList events={events.slice(0, 5)} />

                  <button

                    className="full-width-button"

                    onClick={() => changePage("Audit Trail")}

                  >

                    Open audit trail <ArrowUpRight size={15} />

                  </button>

                </section>

              </div>

              <section className="panel quick-actions">

                <div className="panel-heading">

                  <div>

                    <h3>Quick actions</h3>

                    <p>Manage your demonstration registry</p>

                  </div>

                </div>

                <div className="action-grid">

                  <ActionCard

                    icon={Plus}

                    title="Register project"

                    description="Add a new project for review"

                    onClick={() => setShowProjectForm(true)}

                  />

                  <ActionCard

                    icon={ClipboardCheck}

                    title="Review projects"

                    description="Approve or reject pending projects"

                    onClick={() => changePage("Verification Console")}

                  />

                  <ActionCard

                    icon={ArrowLeftRight}

                    title="Transfer units"

                    description="Move units between demo holders"

                    onClick={() => setShowTransferForm(true)}

                  />

                  <ActionCard

                    icon={FileCheck2}

                    title="Retire units"

                    description="Permanently remove units from circulation"

                    onClick={() => setShowRetireForm(true)}

                  />

                </div>

              </section>

            </>

          )}

          {page === "Projects" && (

            <>

              <PageHeading

                eyebrow="PROJECT REGISTRY"

                title="Projects"

                description="Browse and register projects submitted to the demo registry."

                action={

                  <button

                    className="primary-button"

                    onClick={() => setShowProjectForm(true)}

                  >

                    <Plus size={17} /> Register project

                  </button>

                }

              />

              <SearchBar value={search} onChange={setSearch} />

              <section className="panel">

                <ProjectTable

                  projects={filteredProjects}

                  onSelect={(id) => {

                    setSelectedProject(String(id));

                    changePage("Verification Console");

                  }}

                />

              </section>

            </>

          )}

          {page === "Credit Management" && (

            <>

              <PageHeading

                eyebrow="REGISTRY UNITS"

                title="Credit management"

                description="Issue, transfer, and retire registry credit units in the local demo."

                action={

                  <button

                    className="primary-button"

                    onClick={() => setShowIssueForm(true)}

                  >

                    <Plus size={17} /> Issue units

                  </button>

                }

              />

              <div className="metrics-grid">

                <MetricCard

                  icon={CircleDollarSign}

                  label="Issued units"

                  value={issued.toLocaleString()}

                  note="Cumulative total"

                  color="green"

                />

                <MetricCard

                  icon={Wallet}

                  label="Outstanding"

                  value={outstanding.toLocaleString()}

                  note="Available across all holders"

                  color="blue"

                />

                <MetricCard

                  icon={FileCheck2}

                  label="Retired"

                  value={retired.toLocaleString()}

                  note="Cannot be transferred"

                  color="orange"

                />

              </div>

              <section className="panel">

                <div className="panel-heading">

                  <div>

                    <h3>Holder balances</h3>

                    <p>Balances change when units are transferred or retired.</p>

                  </div>

                  <Wallet size={19} className="muted-icon" />

                </div>

                <div className="table-wrap">

                  <table>

                    <thead>

                      <tr>

                        <th>Holder</th>

                        <th>Available units</th>

                        <th>Share of outstanding</th>

                      </tr>

                    </thead>

                    <tbody>

                      {holderNames.map((holder) => (

                        <tr key={holder}>

                          <td>

                            <div className="holder-cell">

                              <div className="small-avatar">

                                {holder.slice(-1)}

                              </div>

                              <strong>{holder}</strong>

                            </div>

                          </td>

                          <td>{balances[holder].toLocaleString()}</td>

                          <td>

                            {outstanding > 0

                              ? `${(

                                  (balances[holder] / outstanding) *

                                  100

                                ).toFixed(1)}%`

                              : "0.0%"}

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

                <div className="management-actions">

                  <button

                    className="secondary-button"

                    onClick={() => setShowTransferForm(true)}

                  >

                    <ArrowLeftRight size={16} /> Transfer units

                  </button>

                  <button

                    className="secondary-button"

                    onClick={() => setShowRetireForm(true)}

                  >

                    <FileCheck2 size={16} /> Retire units

                  </button>

                </div>

              </section>

              <div className="info-box">

                <ShieldCheck size={19} />

                <div>

                  <strong>Supply accounting</strong>

                  <p>

                    Issued units = outstanding units + retired units. Transfers

                    move units between holders without changing total supply.

                  </p>

                </div>

              </div>

            </>

          )}

          {page === "Verification Console" && (

            <>

              <PageHeading

                eyebrow="REVIEW WORKSPACE"

                title="Verification console"

                description="Review project submissions. Decisions here are simulated and are not real-world verification."

              />

              <div className="verification-summary">

                <div>

                  <span>Awaiting review</span>

                  <strong>

                    {projects.filter((p) => p.status === "Pending").length}

                  </strong>

                </div>

                <div>

                  <span>Verified in demo</span>

                  <strong>

                    {projects.filter((p) => p.status === "Verified").length}

                  </strong>

                </div>

                <div>

                  <span>Rejected in demo</span>

                  <strong>

                    {projects.filter((p) => p.status === "Rejected").length}

                  </strong>

                </div>

              </div>

              <section className="panel">

                <div className="panel-heading">

                  <div>

                    <h3>Submitted projects</h3>

                    <p>Approve or reject projects in this demonstration.</p>

                  </div>

                  <ClipboardCheck size={19} className="muted-icon" />

                </div>

                <div className="review-list">

                  {projects.map((project) => (

                    <div className="review-card" key={project.id}>

                      <div className="review-icon">

                        <Leaf size={21} />

                      </div>

                      <div className="review-info">

                        <div className="review-title">

                          <h4>{project.name}</h4>

                          <StatusBadge status={project.status} />

                        </div>

                        <p>

                          {project.developer} · {project.location}

                        </p>

                        <span>

                          Proposed units: {project.units.toLocaleString()}

                        </span>

                      </div>

                      {project.status === "Pending" && (

                        <div className="review-actions">

                          <button

                            className="approve-button"

                            onClick={() => verifyProject(project.id, true)}

                          >

                            <CheckCircle2 size={16} /> Approve

                          </button>

                          <button

                            className="reject-button"

                            onClick={() => verifyProject(project.id, false)}

                          >

                            <Ban size={16} /> Reject

                          </button>

                        </div>

                      )}

                    </div>

                  ))}

                  {projects.length === 0 && (

                    <EmptyState message="No projects have been registered yet." />

                  )}

                </div>

              </section>

            </>

          )}

          {page === "Blockchain Explorer" && (

            <>

              <PageHeading

                eyebrow="TRANSACTION EXPLORER"

                title="Blockchain explorer"

                description="Inspect demo events. This page is not connected to a live blockchain."

              />

              <div className="explorer-banner">

                <div className="explorer-symbol">

                  <Fingerprint size={29} />

                </div>

                <div>

                  <h3>Local demo ledger</h3>

                  <p>

                    Events are stored in the current browser session's React

                    state. They do not have real transaction hashes or block

                    confirmations.

                  </p>

                </div>

                <span className="demo-badge">SIMULATED</span>

              </div>

              <div className="metrics-grid">

                <MetricCard

                  icon={Activity}

                  label="Recorded events"

                  value={events.length.toString()}

                  note="Current session"

                  color="green"

                />

                <MetricCard

                  icon={Coins}

                  label="Issued units"

                  value={issued.toLocaleString()}

                  note="Demo ledger"

                  color="blue"

                />

                <MetricCard

                  icon={FileCheck2}

                  label="Retired units"

                  value={retired.toLocaleString()}

                  note="Demo ledger"

                  color="orange"

                />

              </div>

              <section className="panel">

                <div className="panel-heading">

                  <div>

                    <h3>Registry events</h3>

                    <p>Most recent events appear first.</p>

                  </div>

                </div>

                <EventList events={events} />

              </section>

            </>

          )}

          {page === "Audit Trail" && (

            <>

              <PageHeading

                eyebrow="TRANSPARENCY"

                title="Audit trail"

                description="A readable history of actions performed in this demo session."

              />

              <section className="panel">

                <div className="panel-heading">

                  <div>

                    <h3>Activity history</h3>

                    <p>{events.length} recorded demo events</p>

                  </div>

                  <FileText size={19} className="muted-icon" />

                </div>

                <EventList events={events} />

                {events.length === 0 && (

                  <EmptyState message="No activity recorded yet." />

                )}

              </section>

              <div className="info-box">

                <ShieldCheck size={19} />

                <div>

                  <strong>Audit limitation</strong>

                  <p>

                    This history is temporary application state. A production

                    system needs persistent event storage and/or on-chain

                    events that can be independently verified.

                  </p>

                </div>

              </div>

            </>

          )}

        </div>

      </main>

      {showProjectForm && (

        <Modal

          title="Register a project"

          subtitle="Register a project on the configured local blockchain for review."

          onClose={() => setShowProjectForm(false)}

        >

          <form className="form-stack" onSubmit={registerProject}>

            <FormField label="Project name">

              <input

                required

                value={projectName}

                onChange={(e) => setProjectName(e.target.value)}

                placeholder="e.g. Community Solar Initiative"

              />

            </FormField>

            <FormField label="Project developer">

              <input

                required

                value={developer}

                onChange={(e) => setDeveloper(e.target.value)}

                placeholder="Organisation name"

              />

            </FormField>

            <FormField label="Location">

              <input

                required

                value={location}

                onChange={(e) => setLocation(e.target.value)}

                placeholder="State, country"

              />

            </FormField>
            <FormField label="Evidence reference (URL)">
              <input
                type="url"
                required
                value={evidenceURI}
                onChange={(e) => setEvidenceURI(e.target.value)}
                placeholder="https://example.com/project-evidence"
              />
            </FormField>

            <FormField label="Proposed registry credit units">

              <input

                type="number"

                min="0"

                step="1"

                required

                value={projectUnits}

                onChange={(e) => setProjectUnits(e.target.value)}

              />

            </FormField>

            <div className="modal-actions">

              <button

                type="button"

                className="secondary-button"

                onClick={() => setShowProjectForm(false)}

              >

                Cancel

              </button>

                          <button type="submit" className="primary-button" disabled={registeringProject}>
              {registeringProject ? "Registering..." : "Register project"}
            </button>

            </div>

          </form>

        </Modal>

      )}

      {showIssueForm && (

        <Modal

          title="Issue registry units"

          subtitle="Only projects marked Verified can receive demo issuance."

          onClose={() => setShowIssueForm(false)}

        >

          <form className="form-stack" onSubmit={issueCredits}>

            <FormField label="Verified project">

              <select

                value={selectedProject}

                onChange={(e) => setSelectedProject(e.target.value)}

                required

              >

                {projects

                  .filter((project) => project.status === "Verified")

                  .map((project) => (

                    <option key={project.id} value={project.id}>

                      {project.name}

                    </option>

                  ))}

              </select>

              {projects.every((project) => project.status !== "Verified") && (

                <span className="field-hint">

                  No verified projects. Verify a project first.

                </span>

              )}

            </FormField>

            <FormField label="Units to issue">

              <input

                type="number"

                min="1"

                step="1"

                required

                value={issueAmount}

                onChange={(e) => setIssueAmount(e.target.value)}

              />

            </FormField>

            <FormField label="Recipient holder">

              <select

                value={issueHolder}

                onChange={(e) => setIssueHolder(e.target.value)}

              >

                {holderNames.map((holder) => (

                  <option key={holder} value={holder}>

                    {holder}

                  </option>

                ))}

              </select>

            </FormField>

            <div className="info-box compact-info">

              <ShieldCheck size={17} />

              <p>

                Demo issuance updates local state only. It does not represent

                certified carbon credits.

              </p>

            </div>

            <div className="modal-actions">

              <button

                type="button"

                className="secondary-button"

                onClick={() => setShowIssueForm(false)}

              >

                Cancel

              </button>

              <button

                type="submit"

                className="primary-button"

                disabled={projects.every(

                  (project) => project.status !== "Verified",

                )}

              >

                Issue units

              </button>

            </div>

          </form>

        </Modal>

      )}

      {showTransferForm && (

        <Modal

          title="Transfer registry units"

          subtitle="Move units between holders without changing total issuance."

          onClose={() => setShowTransferForm(false)}

        >

          <form className="form-stack" onSubmit={transferCredits}>

            <FormField label="From holder">

              <select

                value={transferFrom}

                onChange={(e) => setTransferFrom(e.target.value)}

              >

                {holderNames.map((holder) => (

                  <option key={holder} value={holder}>

                    {holder} ({balances[holder].toLocaleString()} available)

                  </option>

                ))}

              </select>

            </FormField>

            <FormField label="To holder">

              <select

                value={transferTo}

                onChange={(e) => setTransferTo(e.target.value)}

              >

                {holderNames.map((holder) => (

                  <option key={holder} value={holder}>

                    {holder}

                  </option>

                ))}

              </select>

            </FormField>

            <FormField label="Units to transfer">

              <input

                type="number"

                min="1"

                step="1"

                required

                value={transferAmount}

                onChange={(e) => setTransferAmount(e.target.value)}

              />

            </FormField>

            <div className="modal-actions">

              <button

                type="button"

                className="secondary-button"

                onClick={() => setShowTransferForm(false)}

              >

                Cancel

              </button>

              <button type="submit" className="primary-button">

                <ArrowLeftRight size={16} /> Transfer units

              </button>

            </div>

          </form>

        </Modal>

      )}

      {showRetireForm && (

        <Modal

          title="Retire registry units"

          subtitle="Retired units are removed from circulation in this demo."

          onClose={() => setShowRetireForm(false)}

        >

          <form className="form-stack" onSubmit={retireCredits}>

            <FormField label="Holder">

              <select

                value={retireHolder}

                onChange={(e) => setRetireHolder(e.target.value)}

              >

                {holderNames.map((holder) => (

                  <option key={holder} value={holder}>

                    {holder} ({balances[holder].toLocaleString()} available)

                  </option>

                ))}

              </select>

            </FormField>

            <FormField label="Units to retire">

              <input

                type="number"

                min="1"

                step="1"

                required

                value={retireAmount}

                onChange={(e) => setRetireAmount(e.target.value)}

              />

            </FormField>

            <div className="info-box compact-info">

              <FileCheck2 size={17} />

              <p>

                Retirement is irreversible in a real registry. This prototype

                simulates the accounting change only.

              </p>

            </div>

            <div className="modal-actions">

              <button

                type="button"

                className="secondary-button"

                onClick={() => setShowRetireForm(false)}

              >

                Cancel

              </button>

              <button type="submit" className="primary-button">

                Retire units

              </button>

            </div>

          </form>

        </Modal>

      )}

    </div>

  );

}

function MetricCard({

  icon: Icon,

  label,

  value,

  note,

  color,

}: {

  icon: typeof Leaf;

  label: string;

  value: string;

  note: string;

  color: string;

}) {

  return (

    <div className="metric-card">

      <div className="metric-top">

        <span className={`metric-icon ${color}`}>

          <Icon size={20} />

        </span>

        <span className="metric-note">{note}</span>

      </div>

      <div className="metric-value">{value}</div>

      <div className="metric-label">{label}</div>

    </div>

  );

}

function PageHeading({

  eyebrow,

  title,

  description,

  action,

}: {

  eyebrow: string;

  title: string;

  description: string;

  action?: React.ReactNode;

}) {

  return (

    <div className="page-heading">

      <div>

        <div className="eyebrow">{eyebrow}</div>

        <h2>{title}</h2>

        <p>{description}</p>

      </div>

      {action}

    </div>

  );

}

function StatusBadge({ status }: { status: Project["status"] }) {

  return (

    <span className={`status-badge ${status.toLowerCase()}`}>

      <span className="status-dot" />

      {status}

    </span>

  );

}

function ProjectTable({

  projects,

  onSelect,

}: {

  projects: Project[];

  onSelect: (id: number) => void;

}) {

  if (projects.length === 0) {

    return <EmptyState message="No matching projects found." />;

  }

  return (

    <div className="table-wrap">

      <table>

        <thead>

          <tr>

            <th>Project</th>

            <th>Proposed units</th>

            <th>Status</th>

            <th />

          </tr>

        </thead>

        <tbody>

          {projects.map((project) => (

            <tr key={project.id}>

              <td>

                <div className="project-cell">

                  <div className="project-icon">

                    <Leaf size={17} />

                  </div>

                  <div>

                    <strong>{project.name}</strong>

                    <span>{project.developer}</span>

                  </div>

                </div>

              </td>

              <td>{project.units.toLocaleString()}</td>

              <td>

                <StatusBadge status={project.status} />

              </td>

              <td>

                <button

                  className="icon-button"

                  aria-label={`Review ${project.name}`}

                  onClick={() => onSelect(project.id)}

                >

                  <ChevronRight size={17} />

                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );

}

function EventList({ events }: { events: EventRecord[] }) {

  if (events.length === 0) {

    return <EmptyState message="No events recorded yet." />;

  }

  return (

    <div className="event-list">

      {events.map((event) => (

        <div className="event-row" key={event.id}>

          <div className="event-marker">

            <Activity size={16} />

          </div>

          <div className="event-content">

            <strong>{event.action}</strong>

            <p>{event.details}</p>

            <span>{event.time}</span>

          </div>

        </div>

      ))}

    </div>

  );

}

function ActionCard({

  icon: Icon,

  title,

  description,

  onClick,

}: {

  icon: typeof Leaf;

  title: string;

  description: string;

  onClick: () => void;

}) {

  return (

    <button className="action-card" onClick={onClick}>

      <span className="action-icon">

        <Icon size={20} />

      </span>

      <span className="action-text">

        <strong>{title}</strong>

        <span>{description}</span>

      </span>

      <ChevronRight size={17} className="action-chevron" />

    </button>

  );

}

function SearchBar({

  value,

  onChange,

}: {

  value: string;

  onChange: (value: string) => void;

}) {

  return (

    <div className="search-bar">

      <Search size={18} />

      <input

        value={value}

        onChange={(e) => onChange(e.target.value)}

        placeholder="Search projects, developers, locations..."

      />

      {value && (

        <button aria-label="Clear search" onClick={() => onChange("")}>

          <X size={16} />

        </button>

      )}

    </div>

  );

}

function FormField({

  label,

  children,

}: {

  label: string;

  children: React.ReactNode;

}) {

  return (

    <label className="form-field">

      <span>{label}</span>

      {children}

    </label>

  );

}

function Modal({

  title,

  subtitle,

  onClose,

  children,

}: {

  title: string;

  subtitle: string;

  onClose: () => void;

  children: React.ReactNode;

}) {

  return (

    <div className="modal-backdrop" onMouseDown={onClose}>

      <section

        className="modal"

        role="dialog"

        aria-modal="true"

        aria-label={title}

        onMouseDown={(event) => event.stopPropagation()}

      >

        <div className="modal-heading">

          <div>

            <h3>{title}</h3>

            <p>{subtitle}</p>

          </div>

          <button

            className="icon-button"

            aria-label="Close dialog"

            onClick={onClose}

          >

            <X size={19} />

          </button>

        </div>

        {children}

      </section>

    </div>

  );

}

function EmptyState({ message }: { message: string }) {

  return (

    <div className="empty-state">

      <FileText size={25} />

      <p>{message}</p>

    </div>

  );

}
