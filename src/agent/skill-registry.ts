import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { cwd } from "process";

// ─── Types ────────────────────────────────────────────────────────────────

export interface SkillManifest {
  name: string;
  description: string;
  path: string;
}

export interface SkillDocument {
  manifest: SkillManifest;
  body: string;
}

// ─── Registry ─────────────────────────────────────────────────────────────

export class SkillRegistry {
  private documents: Record<string, SkillDocument> = {};
  private skillsDir: string;

  constructor(skillsDir?: string) {
    this.skillsDir = skillsDir ?? join(cwd(), ".agents", "skills");
    this.loadAll();
  }

  // ── Loading ──────────────────────────────────────────────────────────

  private loadAll(): void {
    const dir = this.skillsDir;
    if (!existsSync(dir)) {
      return;
    }
    this.scanDir(dir);
  }

  /**
   * Scan the skills directory. Each sub-directory that contains a SKILL.md
   * file is loaded as a skill.
   */
  private scanDir(dir: string): void {
    const entries = readdirSync(dir).sort();
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      if (!statSync(fullPath).isDirectory()) continue;
      const skillFile = join(fullPath, "SKILL.md");
      if (existsSync(skillFile)) {
        this.loadSkillFile(skillFile);
      }
    }
  }

  private loadSkillFile(path: string): void {
    const text = readFileSync(path, "utf-8");
    const { meta, body } = this.parseFrontmatter(text);
    const name = meta.name || this.inferName(path);
    const description = meta.description || "No description";
    const manifest: SkillManifest = { name, description, path };
    this.documents[name] = { manifest, body: body.trim() };
  }

  private inferName(path: string): string {
    // Parent directory name, e.g. .agents/skills/my-skill/SKILL.md → "my-skill"
    const parts = path.replace(/\\/g, "/").split("/");
    return parts[parts.length - 2] || "unknown";
  }

  private parseFrontmatter(text: string): { meta: Record<string, string>; body: string } {
    //const match = text.match(/^---\n(.*?)\n---\n([\s\S]*)$/);
    const match = text.match(/^---\s*\n(.*?)\n---\s*\n(.*)$/s);
    if (!match) {
      return { meta: {}, body: text };
    }
    const meta: Record<string, string> = {};
    for (const line of match[1].trim().split("\n")) {
      const idx = line.indexOf(":");
      if (idx === -1) continue;
      meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
    return { meta, body: match[2] };
  }

  // ── Querying ─────────────────────────────────────────────────────────

  /**
   * Describe available skills for the system prompt.
   */
  describeAvailable(): string {
    const names = Object.keys(this.documents).sort();
    if (names.length === 0) {
      return "(no skills available)";
    }
    return names
      .map((name) => {
        const d = this.documents[name];
        return `- ${d.manifest.name}: ${d.manifest.description}`;
      })
      .join("\n");
  }

  /**
   * Load the full body text of a named skill, wrapped in a <skill> tag.
   * Returns an error message if the skill doesn't exist.
   */
  loadFullText(name: string): string {
    const doc = this.documents[name];
    if (!doc) {
      const known = Object.keys(this.documents).sort().join(", ") || "(none)";
      return `Error: Unknown skill '${name}'. Available skills: ${known}`;
    }
    return `<skill name="${doc.manifest.name}">\n${doc.body}\n</skill>`;
  }
}

/** Default singleton registry, loaded from .agents/skills/ */
export const defaultRegistry = new SkillRegistry();
