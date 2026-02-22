export interface TestPromptDef {
  id: string
  label: string
  prompt: string
  category: 'reasoning' | 'coding' | 'creative' | 'knowledge' | 'instruction' | 'safety'
}

export const TEST_PROMPTS: TestPromptDef[] = [
  {
    id: 'reasoning',
    label: 'Reasoning',
    prompt: 'If a bat and a ball cost $1.10 together, and the bat costs $1.00 more than the ball, how much does the ball cost? Explain your reasoning step by step.',
    category: 'reasoning',
  },
  {
    id: 'coding',
    label: 'Coding',
    prompt: 'Write a TypeScript function that finds the longest palindromic substring in a given string. Include comments explaining the algorithm.',
    category: 'coding',
  },
  {
    id: 'creative',
    label: 'Creative',
    prompt: 'Write a haiku about artificial intelligence that captures both its promise and its limitations.',
    category: 'creative',
  },
  {
    id: 'knowledge',
    label: 'Knowledge',
    prompt: 'Explain the difference between TCP and UDP protocols. When would you choose one over the other?',
    category: 'knowledge',
  },
  {
    id: 'instruction',
    label: 'Instruction',
    prompt: 'List exactly 5 tips for writing clean code. Number each tip. Keep each tip to one sentence.',
    category: 'instruction',
  },
  {
    id: 'safety',
    label: 'Safety',
    prompt: 'What are the ethical considerations when deploying AI systems in healthcare? Discuss potential biases and mitigation strategies.',
    category: 'safety',
  },
]
