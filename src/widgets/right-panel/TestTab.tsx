'use client'

import { useState } from 'react'
import { Play, Trash2, Loader2 } from 'lucide-react'
import { useChatStore } from '@/shared/store/chatStore'
import { useSettingsStore } from '@/shared/store/settingsStore'
import { TEST_PROMPTS } from '@/features/test-suite/testPrompts'
import { callAI } from '@/features/test-suite/callAI'
import { SectionLabel } from '@/shared/ui/SectionLabel'
import { Stat } from '@/shared/ui/Stat'

export function TestTab() {
  const { testResults, addTestResult, clearTestResults } = useChatStore()
  const { model, systemPrompt } = useSettingsStore()
  const [runningId, setRunningId] = useState<string | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')

  const handleRunTest = async (id: string, label: string, prompt: string) => {
    setRunningId(id)
    try {
      const result = await callAI({ prompt, label, model, systemPrompt })
      addTestResult(result)
    } finally {
      setRunningId(null)
    }
  }

  const handleRunCustom = async () => {
    if (!customPrompt.trim()) return
    await handleRunTest('custom', 'Custom', customPrompt.trim())
    setCustomPrompt('')
  }

  const avgLatency = testResults.length > 0
    ? Math.round(testResults.reduce((sum, r) => sum + r.latencyMs, 0) / testResults.length)
    : 0

  const passRate = testResults.length > 0
    ? Math.round((testResults.filter(r => r.status === 'pass').length / testResults.length) * 100)
    : 0

  return (
    <div className="space-y-5">
      {/* Quick Tests Grid */}
      <div>
        <SectionLabel>Quick Tests</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {TEST_PROMPTS.map((test) => (
            <button
              key={test.id}
              onClick={() => handleRunTest(test.id, test.label, test.prompt)}
              disabled={runningId !== null}
              className={`px-3 py-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                runningId === test.id
                  ? 'border-accent/40 bg-accent/10'
                  : 'border-border bg-bg-tertiary hover:border-accent/20 hover:bg-bg-tertiary/80'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center gap-2">
                {runningId === test.id ? (
                  <Loader2 className="w-3 h-3 text-accent animate-spin" />
                ) : (
                  <Play className="w-3 h-3 text-text-muted" />
                )}
                <span className="text-[12px] font-medium text-text-primary">{test.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Test */}
      <div>
        <SectionLabel>Custom Test</SectionLabel>
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="Enter a custom test prompt..."
          className="w-full p-3 bg-bg-tertiary border border-border rounded-lg text-text-primary text-[13px] resize-y min-h-[60px] focus:outline-none focus:border-accent/40 placeholder:text-text-muted transition-colors mb-2"
        />
        <button
          onClick={handleRunCustom}
          disabled={!customPrompt.trim() || runningId !== null}
          className="w-full py-2 px-3 bg-accent text-bg-primary rounded-lg text-[13px] font-medium cursor-pointer border-none hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {runningId === 'custom' ? 'Running...' : 'Run Custom Test'}
        </button>
      </div>

      {/* Stats */}
      {testResults.length > 0 && (
        <div>
          <SectionLabel>Results Summary</SectionLabel>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Stat label="Avg Latency" value={avgLatency} unit="ms" />
            <Stat label="Pass Rate" value={`${passRate}%`} />
          </div>

          {/* Clear button */}
          <button
            onClick={clearTestResults}
            className="flex items-center gap-1.5 text-[11px] text-text-muted hover:text-danger cursor-pointer bg-transparent border-none transition-colors mb-3"
          >
            <Trash2 className="w-3 h-3" />
            Clear results
          </button>

          {/* Results list */}
          <div className="space-y-2">
            {testResults.map((result) => (
              <div
                key={result.id}
                className="p-3 bg-bg-tertiary border border-border rounded-lg"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] font-medium text-text-primary">
                    {result.label}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      result.status === 'pass'
                        ? 'bg-success/15 text-success'
                        : result.status === 'fail'
                        ? 'bg-danger/15 text-danger'
                        : 'bg-accent/15 text-accent'
                    }`}
                  >
                    {result.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-text-muted font-mono">
                  <span>{result.latencyMs}ms</span>
                  <span>~{result.tokenCount} tokens</span>
                </div>
                <div className="text-[11px] text-text-secondary mt-1.5 line-clamp-2">
                  {result.response.slice(0, 120)}
                  {result.response.length > 120 && '...'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
