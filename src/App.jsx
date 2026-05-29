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

      // Intelligent scoring logic simulating LLM behavior (with prompt injection defense)
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
        // Random good creative score
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
    <div className="min-h-screen p-6 md:p-12 flex flex-col justify-between">
      {/* Header section */}
      <header className="max-w-6xl mx-auto w-full mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Trophy className="text-white w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              NoHumanIdol <span className="text-xs px-2 py-0.5 rounded-full bg-violet-600/30 text-violet-300 border border-violet-500/20">GenLayer App</span>
            </h1>
            <p className="text-sm text-slate-400">Cosmic-scale creative contests judged solely by consensus AI</p>
          </div>
        </div>

        {/* Live / Sandbox Mode Toggle */}
        <div className="glass-panel p-1.5 flex gap-2 rounded-xl">
          <button 
            onClick={() => setIsLiveMode(false)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all ${!isLiveMode ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Terminal className="w-4 h-4" />
            Sandbox Simulator
          </button>
          <button 
            onClick={() => setIsLiveMode(true)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all ${isLiveMode ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Database className="w-4 h-4" />
            Live Network
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto w-full flex-grow">
        {/* Alerts and notifications */}
        {errorMsg && (
          <div className="mb-8 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-8 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-start gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-400 animate-bounce" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Hero Contest Title Card */}
        <section className="glass-panel p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-violet-600/10 to-cyan-500/0 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 animate-spin" /> Active Intelligent Contest
              </span>
              <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">{current.title}</h2>
              <p className="text-slate-400 max-w-3xl leading-relaxed text-sm bg-black/20 p-4 rounded-xl border border-white/5">
                <strong className="text-violet-300">Judging Rubric:</strong> {current.criteria}
              </p>
            </div>

            {/* Prize pool status */}
            <div className="flex flex-col items-end justify-center bg-white/5 p-6 rounded-2xl border border-white/5 text-right min-w-[200px]">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Coins className="w-4 h-4 text-yellow-500" /> Prize Pool
              </div>
              <div className="text-3xl font-black text-white flex items-baseline gap-1">
                <span className="text-yellow-400">{current.balance.toFixed(2)}</span>
                <span className="text-xs font-normal text-slate-400">GEN</span>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Grid */}
        <div className="dashboard-grid">
          {/* Left Column: Form submissions and participants */}
          <div className="flex flex-col gap-8">
            
            {/* Submit Form */}
            <section className="glass-panel p-8">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Send className="w-5 h-5 text-violet-400" /> Submit Your Work
              </h3>
              
              <form onSubmit={handleSubmission} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Submission Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. My Revolutionary GenLayer Meme"
                    value={submitTitle}
                    onChange={e => setSubmitTitle(e.target.value)}
                    disabled={!current.submissionsOpen}
                    className="glass-input"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Public Resource URL (Creative link)</label>
                  <input 
                    type="url" 
                    placeholder="https://example.com/my-work.jpg"
                    value={submitUrl}
                    onChange={e => setSubmitUrl(e.target.value)}
                    disabled={!current.submissionsOpen}
                    className="glass-input"
                    required
                  />
                </div>

                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5" /> URLs will be scraped & verified by consensus AI.
                  </span>
                  
                  <button 
                    type="submit" 
                    disabled={!current.submissionsOpen}
                    className="btn-primary"
                  >
                    Submit Entry
                  </button>
                </div>
              </form>
            </section>

            {/* Entrants and AI Scores Table */}
            <section className="glass-panel p-8 overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" /> Contestants & Live AI Scores ({current.entrants.length})
                </h3>
                {isLiveMode && (
                  <button 
                    onClick={fetchLiveState} 
                    disabled={isLoading}
                    className="btn-secondary py-2 px-3 rounded-lg flex items-center gap-1.5 text-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'spinner' : ''}`} />
                    Refresh
                  </button>
                )}
              </div>

              {current.entrants.length === 0 ? (
                <div className="p-8 text-center bg-black/10 rounded-xl border border-white/5">
                  <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No submissions received yet. Be the first to enter!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {current.entrants.map((addr, idx) => {
                    const detail = current.entryDetails[addr] || { title: "Fetching...", url: "", score: 0, reason: "" }
                    const isWinner = current.hasJudged && current.winner === addr
                    
                    return (
                      <div 
                        key={addr} 
                        className={`p-5 rounded-xl border relative transition-all ${
                          isWinner 
                            ? 'bg-amber-500/5 border-amber-500/30 shadow-lg shadow-amber-500/5' 
                            : detail.score === 0 && current.hasJudged
                              ? 'bg-rose-500/5 border-rose-500/20'
                              : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                        }`}
                      >
                        {/* Entry loading shimmer */}
                        {detail.loading && (
                          <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center backdrop-blur-sm z-10">
                            <div className="flex items-center gap-2 text-violet-400 text-sm font-semibold">
                              <Cpu className="w-5 h-5 spinner" /> AI Jury crawling site & evaluating score...
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <h4 className="font-bold text-white text-base">{detail.title}</h4>
                              {isWinner && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-xs font-extrabold uppercase border border-amber-500/30 flex items-center gap-1">
                                  <Trophy className="w-3 h-3" /> Winner
                                </span>
                              )}
                              {detail.score === 0 && current.hasJudged && (
                                <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-xs font-bold uppercase border border-rose-500/30">
                                  Flagged
                                </span>
                              )}
                            </div>
                            
                            <p className="text-xs text-slate-500 font-mono mb-2 flex items-center gap-1">
                              Entrant: <span className="text-slate-400">{addr.substring(0, 10)}...{addr.substring(addr.length - 8)}</span>
                            </p>

                            <a 
                              href={detail.url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 w-fit"
                            >
                              View Submission URL <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>

                          {/* Score metrics */}
                          <div className="flex flex-col items-end justify-center min-w-[80px]">
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Score</span>
                            <div className={`text-2xl font-black ${
                              !current.hasJudged 
                                ? 'text-slate-600' 
                                : detail.score >= 80 
                                  ? 'text-emerald-400' 
                                  : detail.score >= 50 
                                    ? 'text-yellow-400' 
                                    : 'text-rose-400'
                            }`}>
                              {current.hasJudged ? detail.score : "—"}
                            </div>
                          </div>
                        </div>

                        {/* AI explanation reason block */}
                        {current.hasJudged && detail.reason && (
                          <div className="mt-4 pt-3 border-t border-white/5 text-xs text-slate-400 leading-relaxed flex items-start gap-2 bg-black/10 p-3 rounded-lg">
                            <Cpu className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-violet-300 font-semibold">AI Jury verdict:</strong> {detail.reason}
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
          <div className="flex flex-col gap-8">
            
            {/* Live Contract Details panel */}
            <section className="glass-panel p-8">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-400" /> Contract Infrastructure
              </h3>
              
              <div className="flex flex-col gap-4 text-sm">
                <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Contest Contract Address</div>
                  <div className="font-mono text-xs text-violet-300 select-all break-all">{CONTRACT_ADDRESS}</div>
                </div>

                <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">GenLayer RPC Node Endpoint</div>
                  <div className="font-mono text-xs text-slate-400 break-all">{RPC_URL}</div>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-slate-400 text-xs">Target API Version</span>
                  <span className="font-mono font-bold text-xs text-white">v0.2.16</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-slate-400 text-xs">Submissions Status</span>
                  <span className="flex items-center gap-1.5 font-bold text-xs">
                    {current.submissionsOpen ? (
                      <span className="text-emerald-400 flex items-center gap-1"><Unlock className="w-3.5 h-3.5" /> OPEN</span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> CLOSED</span>
                    )}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-slate-400 text-xs">Judging State</span>
                  <span className="font-bold text-xs text-white">
                    {current.hasJudged ? "JUDGED & PAYOUT EMITTED" : "AWAITING JURY CONSENSUS"}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-400 text-xs">Organizer</span>
                  <span className="font-mono text-xs text-slate-400">
                    {current.organizer.substring(0, 8)}...{current.organizer.substring(current.organizer.length - 6)}
                  </span>
                </div>
              </div>
            </section>

            {/* Fund Contest Card */}
            <section className="glass-panel p-8">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-500" /> Sponsor Prize Pool
              </h3>
              
              <form onSubmit={handleFunding} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deposit Amount (GEN)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="e.g. 1.5"
                      value={fundingAmount}
                      onChange={e => setFundingAmount(e.target.value)}
                      className="glass-input w-full pr-12"
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">GEN</span>
                  </div>
                </div>

                <button type="submit" className="btn-secondary w-full">
                  Deposit GEN Tokens
                </button>
              </form>
            </section>

            {/* Organizer Controls */}
            <section className="glass-panel p-8 relative overflow-hidden border-violet-500/20">
              <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-violet-600 to-cyan-500"></div>
              
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-violet-400" /> Organizer Dashboard
              </h3>
              <p className="text-xs text-slate-400 mb-6">Manage submissions, trigger subjective crawls, and dispatch contract values.</p>
              
              <div className="flex flex-col gap-4">
                <button 
                  onClick={handleCloseSubmissions} 
                  disabled={!current.submissionsOpen}
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4 text-rose-400" />
                  Close Submissions
                </button>

                <button 
                  onClick={handleRunJudgingSimulated} 
                  disabled={current.submissionsOpen || current.hasJudged || isLoading}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Cpu className={`w-4 h-4 ${isLoading ? 'spinner' : ''}`} />
                  Run AI Judging
                </button>

                {!isLiveMode && (
                  <button 
                    onClick={handleResetSimulator}
                    className="btn-secondary w-full border-white/5 hover:border-rose-500/20 hover:text-rose-400"
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
      <footer className="max-w-6xl mx-auto w-full mt-16 pt-6 border-t border-white/5 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p>© 2026 NoHumanIdol. Deployed autonomously under GenLayer Intelligent Contract Protocol.</p>
        <div className="flex gap-4">
          <a href="https://docs.genlayer.com" target="_blank" rel="noreferrer" className="hover:text-slate-300">GenLayer Docs</a>
          <a href="https://studio.genlayer.com" target="_blank" rel="noreferrer" className="hover:text-slate-300">GenLayer Studio</a>
        </div>
      </footer>
    </div>
  )
}
