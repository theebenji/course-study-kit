import { useEffect, useRef, useState } from 'react'
import { api } from '../api.ts'

type SaveState = 'loading' | 'saved' | 'dirty' | 'saving' | 'error'

const statusText: Record<SaveState, string> = {
  loading: 'Loading…',
  saved: 'Saved',
  dirty: 'Unsaved changes',
  saving: 'Saving…',
  error: 'Save failed, retrying on next edit',
}

/**
 * Edits my-progress/<slug>/notes/<section>.md directly. Autosaves after a short
 * pause; the file on disk stays the source of truth, so it can also be edited in
 * any editor; outside edits are picked up when the tab regains focus.
 */
export function NotesEditor({ slug, sectionId, path }: { slug: string; sectionId: string; path: string }) {
  const [text, setText] = useState('')
  const [state, setState] = useState<SaveState>('loading')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pending = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = () =>
      api
        .notes(slug, sectionId)
        .then((t) => {
          if (cancelled || pending.current !== null) return
          setText(t)
          setState('saved')
        })
        .catch(() => !cancelled && setState('error'))
    // No reset to 'loading' here: the editor remounts per section (SectionScreen is keyed).
    void load()
    // /quiz appends results to this file from Claude Code; pick that up when
    // returning to the tab, unless there are unsaved edits here.
    const onFocus = () => {
      if (pending.current === null) void load()
    }
    window.addEventListener('focus', onFocus)
    return () => {
      cancelled = true
      window.removeEventListener('focus', onFocus)
    }
  }, [slug, sectionId])

  // Flush unsaved text when leaving the section.
  useEffect(
    () => () => {
      clearTimeout(timer.current)
      if (pending.current !== null) void api.saveNotes(slug, sectionId, pending.current)
      pending.current = null
    },
    [slug, sectionId],
  )

  function save(value: string) {
    setState('saving')
    api
      .saveNotes(slug, sectionId, value)
      .then(() => {
        if (pending.current === value) pending.current = null
        setState(pending.current === null ? 'saved' : 'dirty')
      })
      .catch(() => setState('error'))
  }

  function onChange(value: string) {
    setText(value)
    setState('dirty')
    pending.current = value
    clearTimeout(timer.current)
    timer.current = setTimeout(() => save(value), 700)
  }

  return (
    <section className="notes-editor" aria-labelledby="notes-heading">
      <header>
        <h2 id="notes-heading">Notes</h2>
        <span className="save-state" data-state={state} role="status">
          {statusText[state]}
        </span>
      </header>
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        disabled={state === 'loading'}
        spellCheck
        aria-label="Section notes (Markdown)"
      />
      <p className="hint">
        Saved to <code>{path}</code>. Anything under <strong>Questions / confusions</strong> is guaranteed to be quizzed.
      </p>
    </section>
  )
}
