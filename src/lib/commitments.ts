export type CommitmentStatus = 'active' | 'completed' | 'forfeited'

export type Commitment = {
  id: string
  goal: string
  stakeSol: number
  streakDays: number
  startDate: string
  daysCompleted: number
  stakeSignature: string
  status: CommitmentStatus
}

const STORAGE_KEY = 'solpact.commitments.v1'

export function loadCommitments(): Commitment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Commitment[]) : []
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
  }
}
