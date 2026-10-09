import { useState } from 'react'

/** A Claude Code command the user runs themselves, with a copy button. */
export function CopyCommand({ command, hint }: { command: string; hint?: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard blocked: the command is still selectable.
    }
  }

  return (
    <div className="copy-command">
      <code>{command}</code>
      <button type="button" onClick={copy} aria-label={`Copy ${command}`}>
        {copied ? 'Copied' : 'Copy'}
      </button>
      {hint && <p className="hint">{hint}</p>}
    </div>
  )
}
