import type { Issue, Sprint, BurndownData, IssueStatus, IssueType, IssuePriority } from '../types';

interface RawSprint {
  id: number;
  name: string;
  startDate?: string;
  endDate?: string;
  state?: string;
}

interface RawIssue {
  key: string;
  fields: {
    summary: string;
    status: { name: string };
    customfield_10016?: number;
    assignee?: { displayName: string };
    timetracking?: {
      originalEstimate?: string;
      timeSpent?: string;
    };
    labels?: string[];
    issuetype: { name: string };
    priority?: { name: string };
    resolutiondate?: string;
  };
}

export class JiraApiService {
  private baseUrl: string;
  private email: string;
  private token: string;
  private cacheKey = 'velocity-dashboard-cache';
  private cacheTTL = 5 * 60 * 1000;

  constructor(instanceUrl: string, email: string, token: string) {
    this.baseUrl = instanceUrl.replace(/\/$/, '');
    this.email = email;
    this.token = token;
  }

  private getAuthHeader(): Record<string, string> {
    return {
      Authorization: `Basic ${btoa(`${this.email}:${this.token}`)}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
  }

  async verifyAuth(): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/rest/api/3/myself`, {
      headers: this.getAuthHeader(),
    });
    return response.ok;
  }

  async fetchSprints(boardId: string): Promise<RawSprint[]> {
    const cacheKey = `sprints-${boardId}`;
    const cached = this.getCache<RawSprint[]>(cacheKey);
    if (cached) return cached;

    const response = await fetch(
      `${this.baseUrl}/rest/agile/1.0/board/${boardId}/sprint?state=active,closed`,
      { headers: this.getAuthHeader() },
    );
    if (!response.ok) throw new Error(`Failed to fetch sprints: ${response.status}`);

    const data = await response.json();
    const sprints: RawSprint[] = (data.values || []).slice(-6).reverse();
    this.setCache(cacheKey, sprints);
    return sprints;
  }

  async fetchSprintIssues(sprintId: string): Promise<Issue[]> {
    const cacheKey = `issues-${sprintId}`;
    const cached = this.getCache<Issue[]>(cacheKey);
    if (cached) return cached;

    const jql = `sprint = ${sprintId}`;
    const response = await fetch(
      `${this.baseUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=100&fields=summary,status,assignee,timetracking,labels,issuetype,priority,customfield_10016,resolutiondate`,
      { headers: this.getAuthHeader() },
    );
    if (!response.ok) throw new Error(`Failed to fetch issues: ${response.status}`);

    const data = await response.json();
    const issues: Issue[] = (data.issues || []).map((i: RawIssue) => this.normalizeIssue(i));
    this.setCache(cacheKey, issues);
    return issues;
  }

  async fetchSprintsWithIssues(boardId: string): Promise<Sprint[]> {
    const rawSprints = await this.fetchSprints(boardId);
    const sprints: Sprint[] = [];

    for (const raw of rawSprints) {
      const issues = await this.fetchSprintIssues(String(raw.id));
      const plannedPoints = issues.reduce((s, i) => s + i.points, 0);
      const completedPoints = issues
        .filter((i) => i.status === 'Done')
        .reduce((s, i) => s + i.points, 0);
      const plannedHours = issues.reduce((s, i) => s + i.estimatedHours, 0);
      const actualHours = issues.reduce((s, i) => s + i.actualHours, 0);
      const startDate = raw.startDate || new Date().toISOString();
      const endDate = raw.endDate || new Date().toISOString();
      const burndown = this.calculateBurndown(
        issues,
        plannedPoints,
        new Date(startDate),
        new Date(endDate),
      );

      sprints.push({
        id: String(raw.id),
        name: raw.name,
        startDate,
        endDate,
        plannedPoints,
        completedPoints,
        plannedHours: Math.round(plannedHours * 10) / 10,
        actualHours: Math.round(actualHours * 10) / 10,
        issues,
        burndown,
      });
    }

    return sprints;
  }

  private normalizeIssue(raw: RawIssue): Issue {
    const status = this.normalizeStatus(raw.fields.status.name);
    return {
      id: raw.key,
      title: raw.fields.summary,
      status,
      points: raw.fields.customfield_10016 || 0,
      assignee: raw.fields.assignee?.displayName || 'Unassigned',
      estimatedHours: this.parseTime(raw.fields.timetracking?.originalEstimate),
      actualHours: this.parseTime(raw.fields.timetracking?.timeSpent),
      labels: raw.fields.labels || [],
      type: this.normalizeType(raw.fields.issuetype.name),
      priority: this.normalizePriority(raw.fields.priority?.name),
      completionDate: status === 'Done' ? raw.fields.resolutiondate : undefined,
    };
  }

  private normalizeStatus(s: string): IssueStatus {
    const lower = s.toLowerCase();
    if (lower.includes('done') || lower.includes('closed') || lower.includes('完了')) return 'Done';
    if (lower.includes('progress') || lower.includes('進行')) return 'In Progress';
    if (lower.includes('review') || lower.includes('レビュー')) return 'Review';
    return 'To Do';
  }

  private normalizeType(t: string): IssueType {
    const lower = t.toLowerCase();
    if (lower.includes('bug')) return 'Bug';
    if (lower.includes('improvement')) return 'Improvement';
    if (lower.includes('story') || lower.includes('feature')) return 'Feature';
    return 'Task';
  }

  private normalizePriority(p?: string): IssuePriority {
    if (!p) return 'Medium';
    const lower = p.toLowerCase();
    if (lower.includes('critical') || lower.includes('highest')) return 'Critical';
    if (lower.includes('high')) return 'High';
    if (lower.includes('low')) return 'Low';
    return 'Medium';
  }

  private parseTime(jiraTime?: string): number {
    if (!jiraTime) return 0;
    // 例: "1w 2d 3h 30m"
    let total = 0;
    const matches = jiraTime.matchAll(/(\d+(?:\.\d+)?)([wdhm])/g);
    for (const m of matches) {
      const val = parseFloat(m[1]);
      switch (m[2]) {
        case 'w':
          total += val * 40;
          break;
        case 'd':
          total += val * 8;
          break;
        case 'h':
          total += val;
          break;
        case 'm':
          total += val / 60;
          break;
      }
    }
    return Math.round(total * 10) / 10;
  }

  private calculateBurndown(
    issues: Issue[],
    plannedPoints: number,
    startDate: Date,
    endDate: Date,
  ): BurndownData[] {
    const dayMs = 1000 * 60 * 60 * 24;
    const sprintDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / dayMs));
    const idealDecrement = plannedPoints / sprintDays;
    const burndown: BurndownData[] = [];

    for (let day = 0; day <= sprintDays; day++) {
      const checkDate = new Date(startDate);
      checkDate.setDate(checkDate.getDate() + day);
      const completed = issues
        .filter(
          (i) =>
            i.status === 'Done' &&
            i.completionDate &&
            new Date(i.completionDate).getTime() <= checkDate.getTime(),
        )
        .reduce((s, i) => s + i.points, 0);
      burndown.push({
        day,
        remaining: Math.max(0, plannedPoints - completed),
        ideal: Math.max(0, plannedPoints - idealDecrement * day),
      });
    }
    return burndown;
  }

  private getCache<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(`${this.cacheKey}:${key}`);
      if (!cached) return null;
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > this.cacheTTL) {
        localStorage.removeItem(`${this.cacheKey}:${key}`);
        return null;
      }
      return data as T;
    } catch {
      return null;
    }
  }

  private setCache(key: string, data: unknown): void {
    try {
      localStorage.setItem(
        `${this.cacheKey}:${key}`,
        JSON.stringify({ data, timestamp: Date.now() }),
      );
    } catch {
      // localStorage が満杯の場合はスキップ
    }
  }
}
