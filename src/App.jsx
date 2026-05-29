import React, { useState, useEffect } from 'react'
import { 
  Trophy, 
  Send, 
  Lock, 
  Unlock, 
  Coins, 
  Cpu, 
  Users, 
  ExternalLink, 
  Sparkles, 
  RefreshCw, 
  ShieldAlert, 
  CheckCircle,
  HelpCircle,
  Database,
  Terminal
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { createClient } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'

// Read contract address from environment variable
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTEST_CONTRACT_ADDRESS || "0x3E24E6c4db7B8C0f08392194515A1e4EAe656D68"
const RPC_URL = import.meta.env.VITE_GENLAYER_RPC_URL || "https://studio.genlayer.com/api"

export default function App() {
  // Connection state
  const [isLiveMode, setIsLiveMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  // Deployed Contract State (Fetched from Chain)
  const [contractState, setContractState] = useState({
    title: "GenLayer Meme Contest",
    criteria: "Humor (40%), originality (30%), relevance to GenLayer (30%). Penalize offensive content.",
    submissionsOpen: true,
    hasJudged: false,
    winner: "0x0000000000000000000000000000000000000000",
    winningScore: 0,
    organizer: "0x0000000000000000000000000000000000000000",
    entrants: [],
    entryDetails: {}, // Map of addr -> { title, url, score, reason }
    balance: 0.5 // In GEN
  })

  // Inputs
  const [submitTitle, setSubmitTitle] = useState("")
  const [submitUrl, setSubmitUrl] = useState("")
  const [fundingAmount, setFundingAmount] = useState("")
  
  // Custom mock interactive simulator state (runs locally to showcase AI flows)
  const [simulatedState, setSimulatedState] = useState({
    title: "GenLayer Space & Meme Contest",
    criteria: "Humor (40%), originality (30%), relevance to GenLayer (30%). Penalize offensive content and prompt-injection.",
    submissionsOpen: true,
    hasJudged: false,
    winner: "0x0000000000000000000000000000000000000000",
    winningScore: 0,
    organizer: "0x5A8E...6D68",
    entrants: [
      "0x1e368b5aF20f8cE8d08F002488888D6A425d5A31",
      "0x2BefC13cE48D6C425d20f8cE8d08F0024f2b5a31"
    ],
    entryDetails: {
      "0x1e368b5aF20f8cE8d08F002488888D6A425d5A31": {
        title: "GenLayer AI Jury Meme",
        url: "https://my-memes.com/genlayer-jury.png",
        score: 0,
        reason: "",
        loading: false
      },
      "0x2BefC13cE48D6C425d20f8cE8d08F0024f2b5a31": {
        title: "Prompt Injection Attack",
        url: "https://hacker-site.com/exploit.txt",
        score: 0,
        reason: "",
        loading: false
      }
    },
    balance: 2.5
  })

  // Select state depending on mode
  const current = isLiveMode ? contractState : simulatedState

  // Initialize genlayer client for live reads
  let client = null
  try {
    client = createClient({
      chain: {
        ...studionet,
        rpcUrls: {
          default: { http: [RPC_URL] }
        }
      }
    })
  } catch (e) {
    console.warn("Could not init genlayer client:", e)
  }

  // Fetch live state
  const fetchLiveState = async () => {
    if (!client) return
    setIsLoading(true)
    setErrorMsg("")
    try {
      // 1. Fetch scalars
      const title = await client.readContract({
        address: CONTRACT_ADDRESS,
        functionName: "get_contest_title"
      })
      const criteria = await client.readContract({
        address: CONTRACT_ADDRESS,
        functionName: "get_judging_criteria"
      })
      const submissionsOpen = await client.readContract({
        address: CONTRACT_ADDRESS,
        functionName: "get_submissions_open"
      })
      const hasJudged = await client.readContract({
        address: CONTRACT_ADDRESS,
        functionName: "get_has_judged"
      })
      const winner = await client.readContract({
        address: CONTRACT_ADDRESS,
        functionName: "get_winner"
      })
      const winningScore = await client.readContract({
        address: CONTRACT_ADDRESS,
        functionName: "get_winning_score"
      })
      const organizer = await client.readContract({
        address: CONTRACT_ADDRESS,
        functionName: "get_organizer"
      })

      // 2. Fetch entrants list
      const entrants = await client.readContract({
        address: CONTRACT_ADDRESS,
        functionName: "get_entrants"
      })

      // 3. Fetch entry details for each entrant
      const details = {}
      for (const addr of entrants) {
        const eTitle = await client.readContract({
          address: CONTRACT_ADDRESS,
          functionName: "get_entry_title",
          args: [addr]
        })
        const eUrl = await client.readContract({
          address: CONTRACT_ADDRESS,
          functionName: "get_entry_url",
          args: [addr]
        })
        const eScore = await client.readContract({
          address: CONTRACT_ADDRESS,
          functionName: "get_score",
          args: [addr]
        })
        const eReason = await client.readContract({
          address: CONTRACT_ADDRESS,
          functionName: "get_entry_reason",
          args: [addr]
        })
        details[addr] = {
          title: eTitle,
          url: eUrl,
          score: Number(eScore),
          reason: eReason
        }
      }

      setContractState({
        title,
        criteria,
        submissionsOpen,
        hasJudged,
        winner,
        winningScore: Number(winningScore),
        organizer,
        entrants,
        entryDetails: details,
        balance: 1.25 // Simulated or standard RPC balance
      })
      setSuccessMsg("Synchronized successfully with Studionet!")
      setTimeout(() => setSuccessMsg(""), 3000)
    } catch (e) {
      console.error(e)
      setErrorMsg("Failed to read from Studionet: " + e.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Trigger fetch on mode change
  useEffect(() => {
    if (isLiveMode) {
      fetchLiveState()
    }
  }, [isLiveMode])

  // Confetti helper
  const triggerCelebration = () => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#8b5cf6', '#06b6d4', '#fbbf24']
    })
  }

  // 1. Submit Entry handler
  const handleSubmission = async (e) => {
    e.preventDefault()
    if (!submitTitle || !submitUrl) return

    if (isLiveMode) {
      setErrorMsg("Write transactions require a browser wallet connection in Studionet. Switch to Simulator Mode to interact instantly without gas fees!")
      return
    }

    // Simulator submission
    const fakeAddress = "0x" + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('')
    setSimulatedState(prev => {
      if (!prev.submissionsOpen) return prev
      const newEntrants = [...prev.entrants, fakeAddress]
      return {
        ...prev,
        entrants: newEntrants,
        entryDetails: {
          ...prev.entryDetails,
          [fakeAddress]: {
            title: submitTitle,
            url: submitUrl,
            score: 0,
            reason: "",
            loading: false
          }
        }
      }
    })
    setSuccessMsg(`Successfully registered entry: "${submitTitle}"`)
    setSubmitTitle("")
    setSubmitUrl("")
    setTimeout(() => setSuccessMsg(""), 3500)
  }

  // 2. Deposit funding handler
  const handleFunding = (e) => {
    e.preventDefault()
    const amt = parseFloat(fundingAmount)
    if (isNaN(amt) || amt <= 0) return

    if (isLiveMode) {
      setErrorMsg("Please fund the contract directly on-chain using GenLayer Studio or a browser wallet.")
      return
    }

    setSimulatedState(prev => ({
      ...prev,
      balance: prev.balance + amt
    }))
    setSuccessMsg(`Deposited ${amt} GEN into the prize pool!`)
    setFundingAmount("")
    setTimeout(() => setSuccessMsg(""), 3000)
  }

  // 3. Close Submissions handler
  const handleCloseSubmissions = () => {
    if (isLiveMode) {
      setErrorMsg("Organizer actions require wallet keys. Switch to Simulator Mode to run live tests.")
      return
    }

    setSimulatedState(prev => ({
      ...prev,
      submissionsOpen: false
    }))
    setSuccessMsg("Submissions have been closed! AI judging can now be executed.")
    setTimeout(() => setSuccessMsg(""), 3500)
  }

  // 4. Exec Judging (Simulated AI loop with Prompt-Injection demonstrations!)
  const handleRunJudgingSimulated = async () => {
    if (simulatedState.entrants.length === 0) {
      setErrorMsg("No contestants have entered the contest!")
      return
    }

    setIsLoading(true)
    setErrorMsg("")
    setSuccessMsg("Spinning up AI Jury validators. Loading webpages...")

    // Evaluate each entrant with a visual micro-animation delay
    const updatedDetails = { ...simulatedState.entryDetails }
    
    for (const addr of simulatedState.entrants) {
      // Toggle loading status for specific card
      setSimulatedState(prev => ({
        ...prev,
        entryDetails: {
          ...prev.entryDetails,
          [addr]: { ...prev.entryDetails[addr], loading: true }
        }
      }))
      
      await new Promise(resolve => setTimeout(resolve, 1500))

      const item = updatedDetails[addr]
      let score = 0
      let reason = ""

      // Scoring logic simulating LLM behavior (with prompt injection defense)
      if (item.url.includes("exploit") || item.title.toLowerCase().includes("injection") || item.url.includes("README.md")) {
        score = 0
        reason = "SECURITY ALERT: Prompt injection attempt detected ('ignore judging criteria'). Entry penalized to 0."
      } else if (item.url.includes("meme")) {
        score = 88
        reason = "Excellent humor and visual styling. Represents the GenLayer ecosystem beautifully."
      } else if (item.url.includes("art")) {
        score = 78
        reason = "Aesthetically pleasing artwork, but slightly lacking in relevance to the primary GenLayer theme."
      } else {
        score = Math.floor(Math.random() * 41) + 55 // 55 to 95
        reason = `Creative submission evaluated successfully. High alignment with the rubric criteria.`
      }

      updatedDetails[addr] = {
        ...item,
        score,
        reason,
        loading: false
      }

      setSimulatedState(prev => ({
        ...prev,
        entryDetails: { ...updatedDetails }
      }))
    }

    // Determine winner
    let maxScore = -1
    let winnerAddr = "0x0000000000000000000000000000000000000000"

    simulatedState.entrants.forEach(addr => {
      const score = updatedDetails[addr].score
      if (score > maxScore) {
        maxScore = score
        winnerAddr = addr
      }
    })

    setSimulatedState(prev => ({
      ...prev,
      hasJudged: true,
      winner: winnerAddr,
      winningScore: maxScore,
      balance: 0 // Reset balance on payout
    }))

    setIsLoading(false)
    setSuccessMsg(`Winner crowned: ${updatedDetails[winnerAddr]?.title}! ${simulatedState.balance} GEN prize paid out.`)
    triggerCelebration()
  }

  // Reset simulator
  const handleResetSimulator = () => {
    setSimulatedState({
      title: "GenLayer Space & Meme Contest",
      criteria: "Humor (40%), originality (30%), relevance to GenLayer (30%). Penalize offensive content and prompt-injection.",
      submissionsOpen: true,
      hasJudged: false,
      winner: "0x0000000000000000000000000000000000000000",
      winningScore: 0,
      organizer: "0x5A8E...6D68",
      entrants: [
        "0x1e368b5aF20f8cE8d08F002488888D6A425d5A31",
        "0x2BefC13cE48D6C425d20f8cE8d08F0024f2b5a31"
      ],
      entryDetails: {
        "0x1e368b5aF20f8cE8d08F002488888D6A425d5A31": {
          title: "GenLayer AI Jury Meme",
          url: "https://my-memes.com/genlayer-jury.png",
          score: 0,
          reason: "",
          loading: false
        },
        "0x2BefC13cE48D6C425d20f8cE8d08F0024f2b5a31": {
          title: "Prompt Injection Attack",
          url: "https://hacker-site.com/exploit.txt",
          score: 0,
          reason: "",
          loading: false
        }
      },
      balance: 2.5
    })
    setSuccessMsg("Simulator reset successfully!")
    setTimeout(() => setSuccessMsg(""), 2000)
  }

  return (
    <div className="app-wrapper">
      {/* Header section */}
      <header className="app-header">
        <div className="logo-section">
          <div className="logo-badge">
            <Trophy />
          </div>
          <div className="logo-title-group">
            <h1>
              NoHumanIdol <span className="version-pill">GenLayer App</span>
            </h1>
            <p className="logo-subtitle">Cosmic-scale creative contests judged solely by consensus AI</p>
          </div>
        </div>

        {/* Live / Sandbox Mode Toggle */}
        <div className="mode-toggle">
          <button 
            onClick={() => setIsLiveMode(false)}
            className={`toggle-btn ${!isLiveMode ? 'active-sim' : ''}`}
          >
            <Terminal style={{ width: '16px', height: '16px' }} />
            Sandbox Simulator
          </button>
          <button 
            onClick={() => setIsLiveMode(true)}
            className={`toggle-btn ${isLiveMode ? 'active-live' : ''}`}
          >
            <Database style={{ width: '16px', height: '16px' }} />
            Live Network
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flexGrow: 1 }}>
        {/* Alerts and notifications */}
        {errorMsg && (
          <div className="alert-box alert-error">
            <ShieldAlert style={{ width: '20px', height: '20px', flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="alert-box alert-success">
            <CheckCircle style={{ width: '20px', height: '20px', flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Hero Contest Title Card */}
        <section className="hero-banner">
          <div>
            <span className="hero-tag">
              <Sparkles style={{ width: '14px', height: '14px' }} /> Active Intelligent Contest
            </span>
            <h2 className="hero-title">{current.title}</h2>
            <div className="hero-criteria-box">
              <strong>Judging Rubric:</strong>
              <p>{current.criteria}</p>
            </div>
          </div>

          {/* Prize pool status */}
          <div className="prize-badge">
            <div className="prize-label">
              <Coins style={{ width: '16px', height: '16px', color: 'var(--color-gold)' }} /> Prize Pool
            </div>
            <div className="prize-value">
              {current.balance.toFixed(2)}
              <span className="prize-currency">GEN</span>
            </div>
          </div>
        </section>

        {/* Dashboard Grid */}
        <div className="dashboard-grid">
          {/* Left Column: Form submissions and participants */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Submit Form */}
            <section className="panel-card">
              <h3 className="card-title">
                <Send style={{ width: '20px', height: '20px', color: 'var(--color-violet)' }} /> Submit Your Work
              </h3>
              
              <form onSubmit={handleSubmission} className="form-layout">
                <div className="form-group">
                  <label className="form-label">Submission Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. My Revolutionary GenLayer Meme"
                    value={submitTitle}
                    onChange={e => setSubmitTitle(e.target.value)}
                    disabled={!current.submissionsOpen}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Public Resource URL (Creative link)</label>
                  <input 
                    type="url" 
                    placeholder="https://example.com/my-work.jpg"
                    value={submitUrl}
                    onChange={e => setSubmitUrl(e.target.value)}
                    disabled={!current.submissionsOpen}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-footer">
                  <span className="form-help">
                    <HelpCircle style={{ width: '14px', height: '14px' }} /> URLs will be scraped & verified by consensus AI.
                  </span>
                  
                  <button 
                    type="submit" 
                    disabled={!current.submissionsOpen}
                    className="btn btn-primary"
                  >
                    Submit Entry
                  </button>
                </div>
              </form>
            </section>

            {/* Entrants and AI Scores Table */}
            <section className="panel-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 className="card-title" style={{ marginBottom: 0 }}>
                  <Users style={{ width: '20px', height: '20px', color: 'var(--color-cyan)' }} /> Contestants & Live AI Scores ({current.entrants.length})
                </h3>
                {isLiveMode && (
                  <button 
                    onClick={fetchLiveState} 
                    disabled={isLoading}
                    className="btn btn-secondary btn-small"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <RefreshCw className={isLoading ? 'spinner' : ''} style={{ width: '14px', height: '14px' }} />
                    Refresh
                  </button>
                )}
              </div>

              {current.entrants.length === 0 ? (
                <div className="empty-state">
                  <Users className="empty-icon" />
                  <p className="empty-text">No submissions received yet. Be the first to enter!</p>
                </div>
              ) : (
                <div className="contestant-container">
                  {current.entrants.map((addr) => {
                    const detail = current.entryDetails[addr] || { title: "Fetching...", url: "", score: 0, reason: "" }
                    const isWinner = current.hasJudged && current.winner === addr
                    
                    return (
                      <div 
                        key={addr} 
                        className={`entrant-card ${isWinner ? 'is-winner' : ''} ${detail.score === 0 && current.hasJudged ? 'is-flagged' : ''}`}
                      >
                        {/* Entry loading shimmer */}
                        {detail.loading && (
                          <div className="entrant-loading-overlay">
                            <Cpu className="spinner" style={{ width: '20px', height: '20px' }} /> 
                            AI Jury crawling site & evaluating score...
                          </div>
                        )}

                        <div className="entrant-header">
                          <div className="entrant-info">
                            <h4>
                              {detail.title}
                              {isWinner && (
                                <span className="status-badge badge-winner">
                                  Winner
                                </span>
                              )}
                              {detail.score === 0 && current.hasJudged && (
                                <span className="status-badge badge-flagged">
                                  Flagged
                                </span>
                              )}
                            </h4>
                            
                            <p className="entrant-addr">
                              Entrant: <span>{addr.substring(0, 10)}...{addr.substring(addr.length - 8)}</span>
                            </p>

                            <a 
                              href={detail.url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="entrant-url"
                            >
                              View Submission URL <ExternalLink style={{ width: '12px', height: '12px' }} />
                            </a>
                          </div>

                          {/* Score metrics */}
                          <div className="entrant-score-box">
                            <span className="entrant-score-label">Score</span>
                            <div className={`entrant-score-value ${
                              !current.hasJudged 
                                ? 'not-judged' 
                                : detail.score >= 80 
                                  ? 'excellent' 
                                  : detail.score >= 50 
                                    ? 'average' 
                                    : 'low'
                            }`}>
                              {current.hasJudged ? detail.score : "—"}
                            </div>
                          </div>
                        </div>

                        {/* AI explanation reason block */}
                        {current.hasJudged && detail.reason && (
                          <div className="entrant-verdict">
                            <Cpu />
                            <div>
                              <span className="verdict-label">AI Jury verdict:</span> {detail.reason}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Organizer Actions & System specs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Live Contract Details panel */}
            <section className="panel-card">
              <h3 className="card-title">
                <Database style={{ width: '20px', height: '20px', color: 'var(--color-cyan)' }} /> Contract Infrastructure
              </h3>
              
              <div className="details-list">
                <div className="details-block">
                  <div className="details-block-label">Contest Contract Address</div>
                  <div className="details-block-val">{CONTRACT_ADDRESS}</div>
                </div>

                <div className="details-block">
                  <div className="details-block-label">GenLayer RPC Node Endpoint</div>
                  <div className="details-block-val">{RPC_URL}</div>
                </div>

                <div className="details-item">
                  <span className="details-label">Target API Version</span>
                  <span className="details-val">v0.2.16</span>
                </div>

                <div className="details-item">
                  <span className="details-label">Submissions Status</span>
                  <span className="details-val">
                    {current.submissionsOpen ? (
                      <span className="status-badge badge-open">OPEN</span>
                    ) : (
                      <span className="status-badge badge-closed">CLOSED</span>
                    )}
                  </span>
                </div>

                <div className="details-item">
                  <span className="details-label">Judging State</span>
                  <span className="details-val" style={{ fontSize: '0.75rem' }}>
                    {current.hasJudged ? "COMPLETED" : "AWAITING JURY"}
                  </span>
                </div>

                <div className="details-item">
                  <span className="details-label">Organizer</span>
                  <span className="details-val mono">
                    {current.organizer.substring(0, 8)}...{current.organizer.substring(current.organizer.length - 6)}
                  </span>
                </div>
              </div>
            </section>

            {/* Fund Contest Card */}
            <section className="panel-card">
              <h3 className="card-title">
                <Coins style={{ width: '20px', height: '20px', color: 'var(--color-gold)' }} /> Sponsor Prize Pool
              </h3>
              
              <form onSubmit={handleFunding} className="form-layout">
                <div className="form-group">
                  <label className="form-label">Deposit Amount (GEN)</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="e.g. 1.5"
                      value={fundingAmount}
                      onChange={e => setFundingAmount(e.target.value)}
                      className="form-input"
                      style={{ width: '100%', paddingRight: '56px' }}
                      required
                    />
                    <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>GEN</span>
                  </div>
                </div>

                <button type="submit" className="btn btn-secondary btn-full">
                  Deposit GEN Tokens
                </button>
              </form>
            </section>

            {/* Organizer Controls */}
            <section className="panel-card panel-card-accent">
              <h3 className="card-title">
                <Cpu style={{ width: '20px', height: '20px', color: 'var(--color-violet)' }} /> Organizer Dashboard
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.4 }}>
                Manage submissions, trigger subjective crawls, and dispatch contract values.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  onClick={handleCloseSubmissions} 
                  disabled={!current.submissionsOpen}
                  className="btn btn-secondary btn-full"
                  style={{ display: 'flex', justifySelf: 'center', gap: '8px' }}
                >
                  <Lock style={{ width: '16px', height: '16px', color: 'var(--color-rose)' }} />
                  Close Submissions
                </button>

                <button 
                  onClick={handleRunJudgingSimulated} 
                  disabled={current.submissionsOpen || current.hasJudged || isLoading}
                  className="btn btn-primary btn-full"
                  style={{ display: 'flex', justifySelf: 'center', gap: '8px' }}
                >
                  <Cpu className={isLoading ? 'spinner' : ''} style={{ width: '16px', height: '16px' }} />
                  Run AI Judging
                </button>

                {!isLiveMode && (
                  <button 
                    onClick={handleResetSimulator}
                    className="btn btn-danger btn-full"
                  >
                    Reset Sandbox State
                  </button>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>© 2026 NoHumanIdol. Deployed autonomously under GenLayer Intelligent Contract Protocol.</p>
        <div className="footer-links">
          <a href="https://docs.genlayer.com" target="_blank" rel="noreferrer">GenLayer Docs</a>
          <a href="https://studio.genlayer.com" target="_blank" rel="noreferrer">GenLayer Studio</a>
        </div>
      </footer>
    </div>
  )
}
