import { useCallback, useEffect, useState } from 'react'
import { useDataSource } from '../data/context'
import { resolveTrials, type ResolvedTrial } from '../domain/records'
import type { AssessmentSession, Block, SessionId, TrackingState } from '../domain/types'

export interface SessionsView {
  /** Every 期 the store knows about. */
  readonly blocks: readonly Block[]
  /** Every 場次, open and completed, across every 期. */
  readonly sessions: readonly AssessmentSession[]
  /** Resolved trials for every session, keyed by sessionId. */
  readonly allResolved: ReadonlyMap<SessionId, readonly ResolvedTrial[]>
  /** False until the first load lands, so surfaces can hold rather than flash. */
  readonly loaded: boolean
  readonly refresh: () => void
}

/**
 * Loads every 期 and every 場次, and keeps resolved trials in sync with the
 * append-only log.
 *
 * DELIBERATELY HAS NO NOTION OF "THE ACTIVE SESSION". Several 場次 are open at
 * once, and a hook that picked one — the newest, the only open one, the one
 * matching a phase — would be guessing on the facilitator's behalf at exactly
 * the point where a guess becomes a wrong number in a 成果報告. Which session is
 * active is App state, set by an explicit choice on the session list, and every
 * surface that can record reads it back from the context band.
 */
export function useSessions(): SessionsView {
  const src = useDataSource()
  const [blocks, setBlocks] = useState<readonly Block[]>([])
  const [sessions, setSessions] = useState<readonly AssessmentSession[]>([])
  const [loaded, setLoaded] = useState(false)
  const [allResolved, setAllResolved] = useState<ReadonlyMap<SessionId, readonly ResolvedTrial[]>>(
    new Map(),
  )

  const load = useCallback(async () => {
    const [bs, ss] = await Promise.all([src.getBlocks(), src.getSessions()])
    setBlocks(bs)
    setSessions(ss)
    const entries = await Promise.all(
      ss.map(async (s) => {
        const records = await src.getRecords(s.sessionId)
        return [s.sessionId, resolveTrials(records)] as const
      }),
    )
    setAllResolved(new Map(entries))
    setLoaded(true)
  }, [src])

  useEffect(() => {
    void load()
    return src.subscribeRecords(() => void load())
  }, [load, src])

  return { blocks, sessions, allResolved, loaded, refresh: () => void load() }
}

/** Tracking state for the rail indicator. */
export function useTracking(): TrackingState {
  const src = useDataSource()
  const [state, setState] = useState<TrackingState>(() => src.getTrackingState())
  useEffect(() => src.subscribeTracking(setState), [src])
  return state
}
