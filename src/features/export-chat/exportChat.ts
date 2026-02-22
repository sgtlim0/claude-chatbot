import type { ChatSession } from "@/entities/message";

export function exportToMarkdown(session: ChatSession): string {
  let md = `# ${session.title}\n\n`;
  md += `*Created: ${new Date(session.createdAt).toLocaleString()}*\n\n---\n\n`;

  for (const msg of session.messages) {
    const role = msg.role === "user" ? "**You**" : "**AI**";
    md += `${role}:\n\n${msg.content}\n\n---\n\n`;
  }

  return md;
}

export function exportToJson(session: ChatSession): string {
  return JSON.stringify(session, null, 2);
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportSessionMarkdown(session: ChatSession) {
  const md = exportToMarkdown(session);
  const filename = `${session.title.replace(/[^a-zA-Z0-9가-힣]/g, "_")}.md`;
  downloadFile(md, filename, "text/markdown");
}

export function exportSessionJson(session: ChatSession) {
  const json = exportToJson(session);
  const filename = `${session.title.replace(/[^a-zA-Z0-9가-힣]/g, "_")}.json`;
  downloadFile(json, filename, "application/json");
}

export function exportAllSessionsJson(sessions: Record<string, ChatSession>) {
  const json = JSON.stringify(Object.values(sessions), null, 2);
  downloadFile(json, "all_conversations.json", "application/json");
}
