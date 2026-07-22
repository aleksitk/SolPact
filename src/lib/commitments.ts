export type CommitmentStatus = 'active' | 'completed' | 'forfeited'

export type CheckIn = {
  day: number
  date: string
  signature: string
}

export type Commitment = {
  id: string
  goal: string
  stakeSol: number
  streakDays: number
  startDate: string
  daysCompleted: number
  stakeSignature: string
  status: CommitmentStatus
  checkIns: CheckIn[]
  claimSignature?: string
}

const STORAGE_KEY = 'solpact.commitments.v1'

function normalize(commitment: Commitment): Commitment {
  return {
    ...commitment,
    checkIns: Array.isArray(commitment.checkIns) ? commitment.checkIns : [],
  }
}

export function loadCommitments(): Commitment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed)
      ? (parsed as Commitment[]).map(normalize)
      : []
  } catch {
    return []
  }
}

export function saveCommitments(commitments: Commitment[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(commitments))
}

export function addCommitment(commitment: Commitment): Commitment[] {
  const next = [commitment, ...loadCommitments()]
  saveCommitments(next)
  return next
}

export function createCommitment(params: {
  goal: string
  stakeSol: number
  streakDays: number
  stakeSignature: string
}): Commitment {
  return {
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    goal: params.goal,
    stakeSol: params.stakeSol,
    streakDays: params.streakDays,
    startDate: new Date().toISOString(),
    daysCompleted: 0,
    stakeSignature: params.stakeSignature,
    status: 'active',
    checkIns: [],
  }
}

/** Local calendar day key (YYYY-MM-DD) used to gate one check-in per day. */
export function localDateKey(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function hasCheckedInToday(commitment: Commitment): boolean {
  const today = localDateKey()
  return commitment.checkIns.some((ci) => ci.date === today)
}

/**
 * Records a confirmed check-in: appends it, advances the streak counter, and
 * marks the commitment completed once the streak length is reached. No-ops if
 * the commitment is not active or already checked in today.
 */
export function recordCheckIn(id: string, signature: string): Commitment[] {
  const next = loadCommitments().map((c) => {
    if (c.id !== id) return c
    if (c.status !== 'active' || hasCheckedInToday(c)) return c

    const day = c.daysCompleted + 1
    const checkIns = [...c.checkIns, { day, date: localDateKey(), signature }]
    const status: CommitmentStatus =
      day >= c.streakDays ? 'completed' : 'active'
    return { ...c, checkIns, daysCompleted: day, status }
  })
  saveCommitments(next)
  return next
}

/** Records a confirmed stake-reclaim, keeping the commitment `completed`. */
export function recordClaim(id: string, signature: string): Commitment[] {
  const next = loadCommitments().map((c) =>
    c.id === id ? { ...c, claimSignature: signature } : c,
  )
  saveCommitments(next)
  return next
}

function daysBetween(fromKey: string, toKey: string): number {
  const from = new Date(`${fromKey}T00:00:00`)
  const to = new Date(`${toKey}T00:00:00`)
  return Math.round((to.getTime() - from.getTime()) / 86_400_000)
}

/**
 * A streak is broken if an active, not-yet-complete commitment has gone more
 * than one calendar day without a check-in (i.e. a full day was skipped). The
 * last relevant day is the most recent check-in, or the start date if none.
 */
export function isStreakBroken(
  commitment: Commitment,
  now: Date = new Date(),
): boolean {
  if (commitment.status !== 'active') return false
  if (commitment.daysCompleted >= commitment.streakDays) return false

  const lastKey =
    commitment.checkIns.length > 0
      ? commitment.checkIns[commitment.checkIns.length - 1].date
      : localDateKey(new Date(commitment.startDate))

  return daysBetween(lastKey, localDateKey(now)) > 1
}

/** Recomputes and persists forfeited statuses for broken streaks. */
export function refreshStatuses(now: Date = new Date()): Commitment[] {
  const next = loadCommitments().map((c) =>
    isStreakBroken(c, now) ? { ...c, status: 'forfeited' as const } : c,
  )
  saveCommitments(next)
  return next
}
