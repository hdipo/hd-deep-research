import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  buildDeepResearchLive,
  buildSectionRiskLevels,
  computeDynamicMtfLeverage,
  fetchChartMetrics,
  fetchLiveFundamentals,
  recheckSetupsLive,
  scanUniverseLive,
} from './server/marketEngine.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseCliArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && idx + 1 < process.argv.length) {
    return process.argv[idx + 1];
  }
  const prefixed = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  return prefixed ? prefixed.slice(flag.length + 1) : undefined;
}

const PORT = Number(parseCliArg('--port') || process.env.PORT || 3000);
const HOST = parseCliArg('--host') || process.env.HOST || '0.0.0.0';
const MODEL_FREE = 'gemini-4-hydrogen';
const MODEL_FALLBACK = 'gemini-3.1-flash-lite';

function createGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function sendSse(res: express.Response, event: string, data: unknown) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function extractGroundingSources(response: unknown): Array<{ title: string; uri: string; domain: string }> {
  const seen = new Set<string>();
  const sources: Array<{ title: string; uri: string; domain: string }> = [];
  const resp = response as {
    candidates?: Array<{
      groundingMetadata?: {
        groundingChunks?: Array<{
          web?: { uri?: string; title?: string };
        }>;
      };
    }>;
  };

  const chunks = resp?.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  for (const chunk of chunks) {
    const uri = chunk?.web?.uri?.trim();
    if (!uri || seen.has(uri)) continue;
    seen.add(uri);
    let domain = 'web';
    try {
      domain = new URL(uri).hostname.replace(/^www\./, '');
    } catch {
      domain = 'source';
    }
    const title = chunk?.web?.title?.trim() || domain;
    sources.push({ title, uri, domain });
  }
  return sources;
}

function parseGitHubUrl(input: string): { owner: string; repo: string } | null {
  const trimmed = input.trim().replace(/\.git$/i, '').replace(/\/+$/, '');
  const fullMatch = trimmed.match(/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/i);
  if (fullMatch) {
    return { owner: fullMatch[1], repo: fullMatch[2] };
  }
  const shortMatch = trimmed.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
  if (shortMatch) {
    return { owner: shortMatch[1], repo: shortMatch[2] };
  }
  return null;
}

function formatGeminiError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes('PERMISSION_DENIED') || message.includes('API_KEY_INVALID') || message.includes('403')) {
    return 'Gemini API key error (403/400). Please check your GEMINI_API_KEY in Settings > Secrets.';
  }
  if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
    return 'Free-tier rate limit reached (429). Please wait a few seconds and try again.';
  }
  return message || 'Failed to complete research request.';
}

async function startServer() {
  const app = express();
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (
      origin === 'https://localhost' ||
      origin === 'http://localhost' ||
      origin === 'capacitor://localhost'
    ) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, model: MODEL_FREE });
  });

  // Real GitHub repository metadata, tree, languages, and README
  app.get('/api/github/repo', async (req, res) => {
    const rawUrl = String(req.query.url || '');
    const parsed = parseGitHubUrl(rawUrl);
    if (!parsed) {
      res.status(400).json({ error: 'Enter a valid GitHub repository URL (e.g. https://github.com/owner/repo) or owner/repo.' });
      return;
    }

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'HD-Deep-Research-Android-App',
    };

    try {
      const base = `https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}`;
      const repoRes = await fetch(base, { headers });
      if (!repoRes.ok) {
        const status = repoRes.status;
        if (status === 404) {
          res.status(404).json({ error: `Repository "${parsed.owner}/${parsed.repo}" not found or is private.` });
          return;
        }
        if (status === 403) {
          res.status(429).json({ error: 'GitHub public API rate limit reached. Please retry in a minute.' });
          return;
        }
        res.status(status).json({ error: `GitHub API returned status ${status}.` });
        return;
      }

      const repoData = (await repoRes.json()) as {
        full_name: string;
        name: string;
        owner: { login: string; avatar_url: string; html_url: string };
        html_url: string;
        description: string | null;
        default_branch: string;
        stargazers_count: number;
        forks_count: number;
        open_issues_count: number;
        language: string | null;
        license: { spdx_id?: string; name?: string } | null;
        topics?: string[];
        updated_at: string;
        size: number;
        homepage?: string | null;
      };

      const defaultBranch = repoData.default_branch || 'main';
      const [langRes, treeRes, readmeRes] = await Promise.allSettled([
        fetch(`${base}/languages`, { headers }),
        fetch(`${base}/git/trees/${encodeURIComponent(defaultBranch)}?recursive=1`, { headers }),
        fetch(`${base}/readme`, { headers }),
      ]);

      let languages: Record<string, number> = {};
      if (langRes.status === 'fulfilled' && langRes.value.ok) {
        languages = (await langRes.value.json()) as Record<string, number>;
      }

      let files: Array<{ path: string; type: 'blob' | 'tree'; size?: number }> = [];
      let truncated = false;
      if (treeRes.status === 'fulfilled' && treeRes.value.ok) {
        const treeJson = (await treeRes.value.json()) as {
          tree?: Array<{ path: string; type: string; size?: number }>;
          truncated?: boolean;
        };
        truncated = Boolean(treeJson.truncated);
        files = (treeJson.tree ?? [])
          .filter((item) => item.type === 'blob' || item.type === 'tree')
          .slice(0, 250)
          .map((item) => ({
            path: item.path,
            type: item.type === 'tree' ? 'tree' : 'blob',
            size: item.size,
          }));
      }

      let readme = '';
      if (readmeRes.status === 'fulfilled' && readmeRes.value.ok) {
        const readmeJson = (await readmeRes.value.json()) as { content?: string; encoding?: string };
        if (readmeJson.content && readmeJson.encoding === 'base64') {
          readme = Buffer.from(readmeJson.content.replace(/\n/g, ''), 'base64').toString('utf-8').slice(0, 12000);
        }
      }

      res.json({
        owner: repoData.owner.login,
        ownerAvatar: repoData.owner.avatar_url,
        repo: repoData.name,
        fullName: repoData.full_name,
        htmlUrl: repoData.html_url,
        description: repoData.description || '',
        defaultBranch,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        openIssues: repoData.open_issues_count,
        primaryLanguage: repoData.language || 'Unknown',
        license: repoData.license?.spdx_id || repoData.license?.name || 'None',
        topics: repoData.topics || [],
        updatedAt: repoData.updated_at,
        homepage: repoData.homepage || '',
        languages,
        files,
        truncated,
        readme,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to reach GitHub API.';
      res.status(502).json({ error: msg });
    }
  });

  // Real GitHub file content inspector
  app.get('/api/github/file', async (req, res) => {
    const owner = String(req.query.owner || '').trim();
    const repo = String(req.query.repo || '').trim();
    const filePath = String(req.query.path || '').trim();
    const ref = String(req.query.ref || 'main').trim();

    if (!owner || !repo || !filePath) {
      res.status(400).json({ error: 'owner, repo, and path are required.' });
      return;
    }

    try {
      const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');
      const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}?ref=${encodeURIComponent(ref)}`;
      const fileRes = await fetch(url, {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'HD-Deep-Research-Android-App',
        },
      });

      if (!fileRes.ok) {
        res.status(fileRes.status).json({ error: `Unable to load file (${fileRes.status}).` });
        return;
      }

      const data = (await fileRes.json()) as {
        name?: string;
        path?: string;
        size?: number;
        content?: string;
        encoding?: string;
        html_url?: string;
      };

      let content = '';
      if (data.content && data.encoding === 'base64') {
        content = Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf-8');
      }

      res.json({
        name: data.name || filePath,
        path: data.path || filePath,
        size: data.size || content.length,
        htmlUrl: data.html_url || '',
        content: content.slice(0, 60000),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to fetch file content.';
      res.status(502).json({ error: msg });
    }
  });

  // Auto-sync endpoint: checks workflow/config setup, latest public APK release, and shared research data
  app.get('/api/github/sync', async (req, res) => {
    const owner = String(req.query.owner || '').trim();
    const repo = String(req.query.repo || '').trim();
    const branch = String(req.query.branch || 'main').trim();

    if (!owner || !repo) {
      res.status(400).json({ error: 'owner and repo are required.' });
      return;
    }

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'HD-Deep-Research-Android-App',
    };

    const base = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;

    try {
      const [commitRes, releaseRes, workflowRes, capJsonRes, capTsRes, dataRes, cfgRes] = await Promise.allSettled([
        fetch(`${base}/commits/${encodeURIComponent(branch)}`, { headers }),
        fetch(`${base}/releases/latest`, { headers }),
        fetch(`${base}/contents/.github/workflows/build-android-apk.yml?ref=${encodeURIComponent(branch)}`, { headers }),
        fetch(`${base}/contents/capacitor.config.json?ref=${encodeURIComponent(branch)}`, { headers }),
        fetch(`${base}/contents/capacitor.config.ts?ref=${encodeURIComponent(branch)}`, { headers }),
        fetch(`${base}/contents/data/hd-research-data.json?ref=${encodeURIComponent(branch)}`, { headers }),
        fetch(`${base}/contents/data/app-config.json?ref=${encodeURIComponent(branch)}`, { headers }),
      ]);

      let latestCommitSha = '';
      let latestCommitMessage = '';
      let latestCommitDate = '';
      if (commitRes.status === 'fulfilled' && commitRes.value.ok) {
        const cData = (await commitRes.value.json()) as {
          sha?: string;
          commit?: { message?: string; author?: { date?: string } };
        };
        latestCommitSha = (cData.sha || '').slice(0, 7);
        latestCommitMessage = (cData.commit?.message || '').split('\n')[0];
        latestCommitDate = cData.commit?.author?.date || '';
      }

      let latestReleaseTag = '';
      let latestReleaseUrl = '';
      let apkDownloadUrl = '';
      let apkFileName = '';
      let apkSize = 0;

      if (releaseRes.status === 'fulfilled' && releaseRes.value.ok) {
        const rData = (await releaseRes.value.json()) as {
          tag_name?: string;
          html_url?: string;
          assets?: Array<{ name?: string; browser_download_url?: string; size?: number }>;
        };
        latestReleaseTag = rData.tag_name || '';
        latestReleaseUrl = rData.html_url || '';
        const apkAsset = (rData.assets || []).find((a) => (a.name || '').toLowerCase().endsWith('.apk'));
        if (apkAsset?.browser_download_url) {
          apkDownloadUrl = apkAsset.browser_download_url;
          apkFileName = apkAsset.name || 'HD-Deep-Research.apk';
          apkSize = apkAsset.size || 0;
        }
      }

      const hasWorkflow = workflowRes.status === 'fulfilled' && workflowRes.value.ok;
      const hasCapacitorJson = capJsonRes.status === 'fulfilled' && capJsonRes.value.ok;
      const hasCapacitorTs = capTsRes.status === 'fulfilled' && capTsRes.value.ok;
      const hasCapacitorConfig = hasCapacitorJson || hasCapacitorTs;
      const hasSharedData = dataRes.status === 'fulfilled' && dataRes.value.ok;

      let remoteReports: unknown[] = [];
      let remoteSwingPlans: unknown[] = [];
      if (hasSharedData && dataRes.status === 'fulfilled') {
        const dJson = (await dataRes.value.json()) as { content?: string; encoding?: string };
        if (dJson.content && dJson.encoding === 'base64') {
          try {
            const decoded = Buffer.from(dJson.content.replace(/\n/g, ''), 'base64').toString('utf-8');
            const parsed = JSON.parse(decoded) as { reports?: unknown[]; swingPlans?: unknown[] };
            if (Array.isArray(parsed.reports)) {
              remoteReports = parsed.reports.slice(0, 30);
            }
            if (Array.isArray(parsed.swingPlans)) {
              remoteSwingPlans = parsed.swingPlans.slice(0, 12);
            }
          } catch {
            remoteReports = [];
            remoteSwingPlans = [];
          }
        }
      }

      let remoteConfig: unknown = null;
      if (cfgRes.status === 'fulfilled' && cfgRes.value.ok) {
        const cJson = (await cfgRes.value.json()) as { content?: string; encoding?: string };
        if (cJson.content && cJson.encoding === 'base64') {
          try {
            const decoded = Buffer.from(cJson.content.replace(/\n/g, ''), 'base64').toString('utf-8');
            remoteConfig = JSON.parse(decoded);
          } catch {
            remoteConfig = null;
          }
        }
      }

      res.json({
        latestCommitSha,
        latestCommitMessage,
        latestCommitDate,
        hasWorkflow,
        hasCapacitorConfig,
        hasCapacitorJson,
        hasCapacitorTs,
        hasSharedData,
        latestReleaseTag,
        latestReleaseUrl,
        apkDownloadUrl,
        apkFileName,
        apkSize,
        remoteReports,
        remoteSwingPlans,
        remoteConfig,
        syncedAt: new Date().toISOString(),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to sync with GitHub.';
      res.status(502).json({ error: msg });
    }
  });

  // Multi-stage free-tier Deep Research SSE pipeline using gemini-4-hydrogen + Google Search
  app.post('/api/research/stream', async (req, res) => {
    const body = req.body as {
      query?: string;
      depth?: 'quick' | 'deep' | 'comprehensive';
      language?: 'auto' | 'en' | 'hi' | 'hinglish';
      repoContext?: {
        fullName?: string;
        description?: string;
        primaryLanguage?: string;
        htmlUrl?: string;
        readmeSnippet?: string;
        keyFiles?: string[];
      } | null;
    };

    const query = (body.query || '').trim();
    const depth = body.depth || 'deep';
    const language = body.language || 'auto';
    const repoContext = body.repoContext || null;

    if (!query) {
      res.status(400).json({ error: 'Please enter a research topic or question.' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    let closed = false;
    req.on('close', () => {
      closed = true;
    });

    try {
      const ai = createGeminiClient();
      const subQueryCount = depth === 'quick' ? 2 : depth === 'comprehensive' ? 4 : 3;

      const langDirective =
        language === 'hi'
          ? 'Write the entire final report in clear, natural Hindi (Devanagari script), keeping technical terms readable.'
          : language === 'hinglish'
            ? 'Write the final report in clear, modern Hinglish (Hindi written in Latin script mixed naturally with technical English terms).'
            : language === 'en'
              ? 'Write the final report in clear, authoritative English.'
              : 'Match the language of the user query (English, Hindi, or Hinglish) naturally.';

      const repoContextBlock = repoContext?.fullName
        ? `\nConnected GitHub Repository Context:\n- Repo: ${repoContext.fullName} (${repoContext.htmlUrl || ''})\n- Primary Language: ${repoContext.primaryLanguage || 'Unknown'}\n- Description: ${repoContext.description || 'N/A'}\n- Key Files: ${(repoContext.keyFiles || []).slice(0, 20).join(', ')}\n- README Excerpt:\n${(repoContext.readmeSnippet || '').slice(0, 2200)}\n`
        : '';

      // Stage 1: Decompose research plan
      sendSse(res, 'step', {
        id: 'plan',
        title: 'Structuring deep research plan',
        detail: `Breaking topic into ${subQueryCount} focused search angles`,
        status: 'running',
      });

      const planResp = await ai.models.generateContent({
        model: MODEL_FREE,
        contents: `Create a focused web research plan for the user's request.\nUser Query: "${query}"${repoContextBlock}\nReturn ${subQueryCount} distinct investigative sub-questions and concise web search queries.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reportTitle: { type: Type.STRING, description: 'Concise publication-grade report title' },
              objective: { type: Type.STRING, description: 'One sentence research goal' },
              angles: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING, description: 'Short 3-6 word angle title' },
                    searchPrompt: { type: Type.STRING, description: 'Specific research question to investigate with live web search' },
                  },
                  required: ['label', 'searchPrompt'],
                },
              },
            },
            required: ['reportTitle', 'objective', 'angles'],
          },
        },
      });

      if (closed) return;

      let plan: {
        reportTitle: string;
        objective: string;
        angles: Array<{ label: string; searchPrompt: string }>;
      };

      try {
        plan = JSON.parse((planResp.text || '{}').trim());
        if (!Array.isArray(plan.angles) || plan.angles.length === 0) {
          throw new Error('Empty angles');
        }
      } catch {
        plan = {
          reportTitle: query.slice(0, 90),
          objective: `Investigate and synthesize verified findings on ${query}.`,
          angles: [
            { label: 'Core landscape & current state', searchPrompt: `${query} latest overview facts data` },
            { label: 'Technical details & comparisons', searchPrompt: `${query} technical analysis comparison benchmarks` },
          ],
        };
      }

      const angles = plan.angles.slice(0, subQueryCount);

      sendSse(res, 'plan', {
        reportTitle: plan.reportTitle,
        objective: plan.objective,
        angles,
      });

      sendSse(res, 'step', {
        id: 'plan',
        title: 'Research plan ready',
        detail: `${angles.length} parallel web investigations queued`,
        status: 'done',
      });

      // Stage 2: Execute grounded Google Search investigations in parallel
      const allSourcesMap = new Map<string, { index: number; title: string; uri: string; domain: string }>();
      const findings: Array<{ label: string; notes: string }> = [];

      const searchTasks = angles.map(async (angle, idx) => {
        const stepId = `search-${idx}`;
        sendSse(res, 'step', {
          id: stepId,
          title: angle.label,
          detail: angle.searchPrompt,
          status: 'running',
        });

        const searchResp = await ai.models.generateContent({
          model: MODEL_FREE,
          contents: `Research angle: ${angle.label}\nOriginal user query: ${query}\nInvestigate thoroughly using Google Search: ${angle.searchPrompt}${repoContextBlock}\nProvide dense, factual research notes with specific dates, statistics, comparisons, and concrete evidence. Keep it structured and information-rich.`,
          config: {
            tools: [{ googleSearch: {} }],
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        });

        if (closed) return;

        const sources = extractGroundingSources(searchResp);
        const newSources: Array<{ index: number; title: string; uri: string; domain: string }> = [];
        for (const src of sources) {
          if (!allSourcesMap.has(src.uri)) {
            const entry = { index: allSourcesMap.size + 1, ...src };
            allSourcesMap.set(src.uri, entry);
            newSources.push(entry);
          }
        }

        if (newSources.length > 0) {
          sendSse(res, 'sources', { sources: Array.from(allSourcesMap.values()) });
        }

        findings[idx] = {
          label: angle.label,
          notes: (searchResp.text || '').trim(),
        };

        sendSse(res, 'step', {
          id: stepId,
          title: angle.label,
          detail: sources.length > 0 ? `Verified ${sources.length} web sources` : 'Analysis gathered',
          status: 'done',
        });
      });

      await Promise.all(searchTasks);
      if (closed) return;

      const allSources = Array.from(allSourcesMap.values());

      // Stage 3: Synthesize high-definition report with streaming
      sendSse(res, 'step', {
        id: 'synthesize',
        title: 'Synthesizing HD Research Report',
        detail: `Integrating ${findings.length} research threads and ${allSources.length} verified sources`,
        status: 'running',
      });

      const sourceListText =
        allSources.length > 0
          ? allSources.map((s) => `[${s.index}] ${s.title} (${s.domain}) — ${s.uri}`).join('\n')
          : 'No external URLs returned; rely strictly on verified factual knowledge.';

      const notesText = findings
        .filter(Boolean)
        .map((f, i) => `### Research Thread ${i + 1}: ${f.label}\n${f.notes}`)
        .join('\n\n');

      const synthesisPrompt = `You are HD Deep Research, an authoritative research analyst.\n${langDirective}\n\nUser Query: ${query}\nPlanned Report Title: ${plan.reportTitle}\n${repoContextBlock}\nCollected Web-Grounded Findings:\n${notesText}\n\nVerified Sources:\n${sourceListText}\n\nWrite a publication-grade, comprehensive research report in clean Markdown.\nFormatting guidelines:\n- Start with a concise "## Executive Summary" section.\n- Organize into clear thematic sections with "##" headings.\n- Include a crisp Markdown comparison or metrics table where relevant.\n- Cite verified sources inline using bracketed numbers like [1], [2] matching the Verified Sources list above.\n- End with "## Key Takeaways & Next Steps".\n- Do NOT include a separate raw URL dump at the bottom (the app renders interactive source cards automatically).`;

      const streamResp = await ai.models.generateContentStream({
        model: MODEL_FREE,
        contents: synthesisPrompt,
        config: {
          thinkingConfig: {
            thinkingLevel: depth === 'comprehensive' ? ThinkingLevel.HIGH : ThinkingLevel.MEDIUM,
          },
        },
      });

      let fullReport = '';
      for await (const chunk of streamResp) {
        if (closed) return;
        const delta = chunk.text || '';
        if (delta) {
          fullReport += delta;
          sendSse(res, 'chunk', { text: delta });
        }
      }

      if (closed) return;

      sendSse(res, 'step', {
        id: 'synthesize',
        title: 'Report complete',
        detail: `${fullReport.split(/\s+/).filter(Boolean).length} words synthesized`,
        status: 'done',
      });

      // Stage 4: Generate 3 smart follow-up questions
      let followUps: string[] = [];
      try {
        const fuResp = await ai.models.generateContent({
          model: MODEL_FREE,
          contents: `Based on this research topic "${query}" and report title "${plan.reportTitle}", suggest 3 concise, high-value follow-up research questions the user might tap next. ${langDirective}`,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                questions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['questions'],
            },
          },
        });
        const parsedFu = JSON.parse((fuResp.text || '{}').trim()) as { questions?: string[] };
        followUps = (parsedFu.questions || []).slice(0, 3);
      } catch {
        followUps = [];
      }

      sendSse(res, 'done', {
        title: plan.reportTitle,
        sources: allSources,
        followUps,
      });
      res.end();
    } catch (err) {
      if (!closed) {
        sendSse(res, 'error', { message: formatGeminiError(err) });
        res.end();
      }
    }
  });

  // Follow-up grounded question inside an existing report
  app.post('/api/research/followup', async (req, res) => {
    const body = req.body as {
      question?: string;
      reportTitle?: string;
      reportSummary?: string;
      language?: 'auto' | 'en' | 'hi' | 'hinglish';
    };

    const question = (body.question || '').trim();
    if (!question) {
      res.status(400).json({ error: 'Follow-up question is required.' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    let closed = false;
    req.on('close', () => {
      closed = true;
    });

    try {
      const ai = createGeminiClient();
      const resp = await ai.models.generateContent({
        model: MODEL_FREE,
        contents: `Context Report Title: ${body.reportTitle || 'Research Report'}\nContext Summary:\n${(body.reportSummary || '').slice(0, 4000)}\n\nUser Follow-Up Question: ${question}\n\nAnswer clearly, accurately, and concisely in clean Markdown using Google Search grounding when up-to-date facts are helpful. Match the user's language.`,
        config: {
          tools: [{ googleSearch: {} }],
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      if (closed) return;

      const text = (resp.text || '').trim();
      const sources = extractGroundingSources(resp).map((s, idx) => ({ index: idx + 1, ...s }));

      sendSse(res, 'done', { text, sources });
      res.end();
    } catch (err) {
      if (!closed) {
        sendSse(res, 'error', { message: formatGeminiError(err) });
        res.end();
      }
    }
  });

  // Helper to clamp scores cleanly between 1 and 10 (1 decimal)
  const clampRating = (val: unknown, fallback = 7.5): number => {
    const n = Number(val);
    if (!Number.isFinite(n)) return fallback;
    return Math.round(Math.max(1, Math.min(10, n)) * 10) / 10;
  };

  // 1. Dedicated 5-Angle High-Accuracy Stock Scanner (Swing, Short Term, Long Term, MTF)
  // Combines Technical Indicators + Price Action + Fundamentals + Latest News + Trap Safety using previous trading day's closing data
  const handleSectionStockScan = async (req: express.Request, res: express.Response) => {
    const body = req.body as {
      section?: 'swing' | 'short_term' | 'long_term' | 'mtf';
      market?: 'NSE' | 'US';
      universe?: 'nifty500' | 'nifty1000';
      count?: number;
      language?: 'auto' | 'en' | 'hi' | 'hinglish';
      watchlist?: string;
      customCriteria?: string;
      monthLabel?: string;
    };

    const section: 'swing' | 'short_term' | 'long_term' | 'mtf' =
      body.section === 'short_term' ||
      body.section === 'long_term' ||
      body.section === 'mtf'
        ? body.section
        : 'swing';

    const market: 'NSE' | 'US' = body.market === 'US' ? 'US' : 'NSE';
    const universe: 'nifty500' | 'nifty1000' =
      body.universe === 'nifty1000' ? 'nifty1000' : 'nifty500';
    const count = Math.max(1, Math.min(3, Number(body.count || 3)));
    const language = body.language || 'hinglish';
    const watchlist = (body.watchlist || '').trim();
    const customCriteria = (body.customCriteria || '').trim();
    const now = new Date();
    const todayIsoDate = now.toISOString().slice(0, 10);
    const monthLabel =
      body.monthLabel ||
      now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const currency = market === 'NSE' ? '₹' : '$';
    const marketDesc =
      market === 'NSE'
        ? 'Indian stock market (NSE liquid large-cap & quality mid-cap stocks in INR ₹)'
        : 'US stock market (NYSE/NASDAQ liquid large-cap & mid-cap stocks in USD $)';

    const sectionSpecs: Record<
      'swing' | 'short_term' | 'long_term' | 'mtf',
      {
        role: string;
        holdingDefault: string;
        weightsPrompt: string;
        riskPrompt: string;
        defaultSetupType: string;
      }
    > = {
      swing: {
        role: 'ultra-disciplined Swing Trading analyst (accuracy over quantity)',
        holdingDefault: '≤ 1 Month',
        weightsPrompt:
          'Weighting: Price Action (30%) + Technical Indicators like 20/50 EMA, RSI 50–68, MACD, Volume/Delivery surge (30%) + Fundamental Trap Filter (no loss-making/high-pledge junk, 15%) + Latest News/Catalysts (15%) + Liquidity & Trap Safety (10%). STRICT EXPIRY RULE: Each stock call expiry MUST be calculated from that stock’s real daily ATR speed & target distance and MUST be within 1 Month (7 to 30 calendar days).',
        riskPrompt:
          'Data-driven Stop Loss anchored strictly to this stock’s actual 15–20D swing pivot low / 20 EMA minus ATR buffer, Target 1 & Target 2 anchored to real overhead resistances / measured move within 30 days.',
        defaultSetupType: 'Swing Breakout / Pullback',
      },
      short_term: {
        role: 'high-accuracy Short-Term Positional strategist',
        holdingDefault: '< 3 Months',
        weightsPrompt:
          'Screen strictly on these EXACT 8 Short-Term Parameters: (1) Universe & Liquidity, (2) Quarterly Sales & Profit Growth, (3) 50 & 200 EMA Alignment, (4) Relative Strength vs Nifty 50, (5) Weekly Base Breakout / Support structure, (6) RSI (14) & Institutional Volume Accumulation, (7) ROE/ROCE >= 15% & Manageable Debt, (8) Sector Catalyst / Clean News & Risk:Reward >= 1:2. STRICT EXPIRY RULE: Calculate expiry from this stock’s real ATR velocity & target distance — strictly under 3 Months (32 to 88 calendar days).',
        riskPrompt:
          'Data-driven Stop Loss anchored strictly to this stock’s actual 50 EMA / 50D structural swing low, Target 1 & Target 2 anchored to real 52W high / base breakout resistances with >= 1:2 R:R.',
        defaultSetupType: 'Positional Momentum',
      },
      long_term: {
        role: 'high-conviction Long-Term Fundamental Compounder analyst',
        holdingDefault: '> 1 Year',
        weightsPrompt:
          'Weighting: Deep Fundamentals (ROE/ROCE > 15%, consistent revenue & profit growth, low debt, durable moat, 45%) + Valuation & Governance/News Safety (20%) + Weekly/Monthly Price Action Accumulation Zone near 50/200 DMA (20%) + Long-term Trend Indicators (15%). STRICT EXPIRY RULE: Long-term call horizon MUST be strictly MORE than 1 Year (13 to 24+ months) calculated from structural trend & earnings compounding.',
        riskPrompt:
          'Accumulation Entry Zone near structural support, Thesis-Invalidation SL anchored to 200 EMA / 120D demand low, Target 1 & Target 2 anchored to 1Y–2Y structural compounding levels.',
        defaultSetupType: 'Long-Term Compounder',
      },
      mtf: {
        role: 'strict MTF (Margin Trading Facility) risk-first trading analyst',
        holdingDefault: '≤ 14 Days',
        weightsPrompt:
          'ONLY pick Group-1 liquid MTF-eligible NSE/US stocks with high daily turnover, zero circuit-trap risk, and clean immediate momentum so leveraged interest stays minimal (5 to 14 calendar days).',
        riskPrompt:
          'Tight data-driven Stop Loss anchored to 10D swing low / 20 EMA, Target 1 & Target 2 achievable within 14 days based on daily ATR speed. Specify typical broker MTF leverage like "3x–4x MTF".',
        defaultSetupType: 'MTF High-Liquidity Momentum',
      },
    };

    const spec = sectionSpecs[section];

    const langDirective =
      language === 'hi'
        ? 'Write all text explanations (setupType, entryRule, exitRule, rationale, strengths, weaknesses, trapWarning, newsSummary, marketNote) in clear, easy-to-understand Hindi (Devanagari script) keeping standard trading words (Entry, Exit, Stop Loss, Target, Breakout, EMA, RSI, MTF) readable.'
        : language === 'hinglish'
          ? 'Write all text explanations (setupType, entryRule, exitRule, rationale, strengths, weaknesses, trapWarning, newsSummary, marketNote) in super simple, everyday Hinglish (Hindi in Latin script) that any normal investor/trader can understand immediately without confusing jargon.'
          : 'Write all text explanations in clear, simple, jargon-free English.';

    try {
      // Fast, mathematically verified live Nifty 500 / Nifty 1000 / US OHLCV + Google News screener (zero 429 rate limits)
      if (!customCriteria) {
        const liveResult = await scanUniverseLive({
          section,
          market,
          universe,
          count,
          language,
          watchlist,
        });
        res.json({
          section,
          monthLabel,
          market,
          universe,
          asOfDate: liveResult.asOfDate,
          marketNote: liveResult.marketNote,
          setups: liveResult.setups,
          sources: liveResult.sources,
          generatedAt: new Date().toISOString(),
        });
        return;
      }

      const ai = createGeminiClient();

      const focusLines = [
        watchlist ? `Evaluate these specific stocks/tickers first: ${watchlist}.` : '',
        customCriteria ? `Strictly enforce the user's custom stock-finding rule: ${customCriteria}.` : '',
      ]
        .filter(Boolean)
        .join('\n');

      const parameterChecklistDirective =
        section === 'short_term' && market === 'NSE'
          ? `An explicit 8-point NIFTY 500 Short-Term Parameter Checklist showing the REAL verified value and Pass/Caution/Fail verdict for EVERY ONE of these exact 8 rules in order:
  1. Nifty 500 Universe & Liquidity (Confirm official Nifty 500 constituent + daily turnover)
  2. Quarterly Sales & Profit (Latest YoY / QoQ revenue & PAT growth)
  3. 50 & 200 EMA Alignment (Spot price vs 50 EMA and 200 EMA)
  4. Relative Strength vs Nifty 50 (Outperformance vs Nifty 50 & sector)
  5. Weekly Base Breakout (Multi-week consolidation breakout or clean support)
  6. RSI (14) & Volume Accumulation (RSI 50–70 + institutional buying volume)
  7. ROE / ROCE & Debt Check (Return ratios >= 15%, manageable debt)
  8. News, Catalyst & Risk:Reward (Clean news/catalyst + 6%–9.5% SL + >= 1:2 R:R)
  STRICT FILTER: Only include a stock if it is an official NIFTY 500 stock AND passes at least 6 out of 8 checks with ZERO Fail on Nifty 500 Membership, 50/200 EMA Trend, or Trap Safety.`
          : `An explicit 8-point Daily Parameter Checklist showing the REAL verified value and Pass/Caution/Fail verdict for: 20/50/200 EMA Trend, RSI(14), MACD/Momentum, Prev-Day Volume/Delivery, Price Action Structure, Fundamental Quality (ROE/Profit/Debt), Latest News/Event Risk, and Liquidity/MTF/Risk-Reward Safety.`;

      // Stage 1: Live Google Search grounded research using previous trading day's closing data + all 5 angles
      const searchResp = await ai.models.generateContent({
        model: MODEL_FREE,
        contents: `You are a ${spec.role}. Today's date is ${todayIsoDate} (${monthLabel}).
Section: ${section.toUpperCase()}
Market: ${market === 'NSE' ? (universe === 'nifty1000' ? 'India NSE — NIFTY 1000 High-Risk Small/Midcap Growth Stocks (INR ₹)' : 'India NSE — STRICTLY NIFTY 500 Low-Risk Index Constituents ONLY (INR ₹)') : marketDesc}
${spec.weightsPrompt}
${focusLines}

CRITICAL HIGH-ACCURACY RULES:
1. Use Google Search to check the LATEST PREVIOUS TRADING DAY'S closing price, recent daily volume/delivery, 20/50/200 EMA position, RSI, recent chart support/resistance, key fundamentals (profit growth, ROE, debt, P/E), and LATEST NEWS / upcoming earnings dates.
2. Quality beats quantity! Only select up to ${count} genuinely high-conviction stocks (HD Rating >= 7.5 / 10). If fewer than ${count} stocks pass cleanly (or if market/news has a major trap), return fewer stocks — NEVER force weak or trap setups!
3. Specifically check for TRAP RISKS (extended rally / overbought RSI > 75, negative news, earnings gap risk, low liquidity, heavy resistance right above) so the user never gets stuck ("koi fas na jaye").

For each passing stock, report:
- Symbol, company name, sector, exact previous day close and latest market price in ${currency}, and the trading date of the data.
- 5 angle scores out of 10 (Technical Indicators, Price Action, Fundamentals, Latest News, Trap Safety) and overall HD Rating out of 10.
- Top 2 simple strengths ("Kya Strong Hai") and Top 2 simple weaknesses/risks ("Kya Weak Hai").
- Explicit Trap Warning & Latest News summary.
- Exact Entry Zone, ${spec.riskPrompt}, Kab Entry Leni (entry trigger), and Kab Exit Karna (stop loss + trailing + target exit).
- ${parameterChecklistDirective}`,
        config: {
          tools: [{ googleSearch: {} }],
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      const sources = extractGroundingSources(searchResp).map((s, idx) => ({
        index: idx + 1,
        ...s,
      }));

      const groundedNotes = (searchResp.text || '').trim();
      if (!groundedNotes) {
        throw new Error('Live market data fetch nahi ho paya. Thodi der baad retry karein.');
      }

      // Stage 2: Convert grounded 5-angle research into strictly validated JSON
      const structuredResp = await ai.models.generateContent({
        model: MODEL_FREE,
        contents: `Convert the verified multi-angle market research below into a strictly validated JSON object with up to ${count} high-accuracy ${section.replace('_', ' ')} setup${count > 1 ? 's' : ''} (only include genuinely strong setups with hdRating >= 7.2; fewer setups is totally fine if quality is not high enough).
${langDirective}

Important math rules:
- Use realistic numeric prices grounded in the research notes below.
- For Long setups: stopLoss < entryMin <= entryMax < target1 < target2.
- For Short setups: stopLoss > entryMax >= entryMin > target1 > target2.
- All scores (hdRating and each angleScore) must be realistic numbers between 1.0 and 10.0.
- asOfDate should be the latest previous trading day date (YYYY-MM-DD or readable date like "25 Nov 2026").
- marketNote: 1 crisp sentence summarizing previous trading day's market condition and why these setups passed (or why fewer stocks were selected).
${section === 'mtf' ? '- Include mtfLeverage like "3x–4x MTF" for each MTF-eligible stock.' : '- Leave mtfLeverage empty string "".'}

Verified Market Research Notes:
${groundedNotes}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              asOfDate: { type: Type.STRING },
              marketNote: { type: Type.STRING },
              setups: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    symbol: { type: Type.STRING },
                    companyName: { type: Type.STRING },
                    exchange: { type: Type.STRING },
                    sector: { type: Type.STRING },
                    direction: { type: Type.STRING },
                    currentPrice: { type: Type.NUMBER },
                    prevClose: { type: Type.NUMBER },
                    dayChangePct: { type: Type.NUMBER },
                    callExpiryDate: { type: Type.STRING, description: 'Expected call validity date e.g. 12 DEC or MAR 2027' },
                    hdRating: { type: Type.NUMBER },
                    technicalScore: { type: Type.NUMBER },
                    priceActionScore: { type: Type.NUMBER },
                    fundamentalsScore: { type: Type.NUMBER },
                    newsScore: { type: Type.NUMBER },
                    safetyScore: { type: Type.NUMBER },
                    entryMin: { type: Type.NUMBER },
                    entryMax: { type: Type.NUMBER },
                    stopLoss: { type: Type.NUMBER },
                    target1: { type: Type.NUMBER },
                    target2: { type: Type.NUMBER },
                    riskReward: { type: Type.STRING },
                    holdingWindow: { type: Type.STRING },
                    setupType: { type: Type.STRING },
                    entryRule: { type: Type.STRING },
                    exitRule: { type: Type.STRING },
                    rationale: { type: Type.STRING },
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                    trapWarning: { type: Type.STRING },
                    newsSummary: { type: Type.STRING },
                    mtfLeverage: { type: Type.STRING },
                    parameters: {
                      type: Type.ARRAY,
                      description: 'Exactly 8 daily parameters checked for this stock with real values and pass/caution/fail status',
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          category: { type: Type.STRING, description: 'Technical, Price Action, Fundamental, News, or Safety' },
                          name: { type: Type.STRING, description: 'Parameter name e.g. 20 & 50 EMA Trend, RSI (14), Volume & Delivery' },
                          value: { type: Type.STRING, description: 'Concise verified value e.g. RSI 61.2, Above 20/50 EMA, 1.8x Vol, ROE 22%' },
                          status: { type: Type.STRING, description: 'pass, caution, or fail' },
                          note: { type: Type.STRING, description: 'Short 1-line explanation in chosen language' },
                        },
                        required: ['category', 'name', 'value', 'status', 'note'],
                      },
                    },
                  },
                  required: [
                    'symbol',
                    'companyName',
                    'exchange',
                    'sector',
                    'direction',
                    'currentPrice',
                    'prevClose',
                    'hdRating',
                    'technicalScore',
                    'priceActionScore',
                    'fundamentalsScore',
                    'newsScore',
                    'safetyScore',
                    'entryMin',
                    'entryMax',
                    'stopLoss',
                    'target1',
                    'target2',
                    'riskReward',
                    'holdingWindow',
                    'setupType',
                    'entryRule',
                    'exitRule',
                    'rationale',
                    'strengths',
                    'weaknesses',
                    'trapWarning',
                    'newsSummary',
                    'mtfLeverage',
                    'parameters',
                  ],
                },
              },
            },
            required: ['asOfDate', 'marketNote', 'setups'],
          },
        },
      });

      const parsed = JSON.parse((structuredResp.text || '{"setups":[]}').trim()) as {
        asOfDate?: string;
        marketNote?: string;
        setups?: Array<{
          symbol: string;
          companyName: string;
          exchange: string;
          sector: string;
          direction: string;
          currentPrice: number;
          prevClose: number;
          dayChangePct?: number;
          callExpiryDate?: string;
          hdRating: number;
          technicalScore: number;
          priceActionScore: number;
          fundamentalsScore: number;
          newsScore: number;
          safetyScore: number;
          entryMin: number;
          entryMax: number;
          stopLoss: number;
          target1: number;
          target2: number;
          riskReward: string;
          holdingWindow: string;
          setupType: string;
          entryRule: string;
          exitRule: string;
          rationale: string;
          strengths?: string[];
          weaknesses?: string[];
          trapWarning?: string;
          newsSummary?: string;
          mtfLeverage?: string;
          parameters?: Array<{
            category: string;
            name: string;
            value: string;
            status: string;
            note: string;
          }>;
        }>;
      };

      const normalizeParameters = (
        raw?: Array<{
          category: string;
          name: string;
          value: string;
          status: string;
          note: string;
        }>
      ) => {
        if (!Array.isArray(raw)) return [];
        const validCats = new Set(['Technical', 'Price Action', 'Fundamental', 'News', 'Safety']);
        const validStatus = new Set(['pass', 'caution', 'fail']);
        return raw.slice(0, 12).map((p) => ({
          category: validCats.has(p.category) ? p.category : 'Technical',
          name: String(p.name || 'Parameter').trim(),
          value: String(p.value || '—').trim(),
          status: validStatus.has(String(p.status || '').toLowerCase())
            ? String(p.status).toLowerCase()
            : 'caution',
          note: String(p.note || '').trim(),
        }));
      };

      const rawSetups = (parsed.setups || []).slice(0, count);
      const nowIso = new Date().toISOString();
      const asOfDate = parsed.asOfDate || todayIsoDate;
      const callDateLabel = now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
      }).toUpperCase();
      const expiryDaysMap: Record<'swing' | 'short_term' | 'long_term' | 'mtf', number> = {
        mtf: 12,
        swing: 20,
        short_term: 75,
        long_term: 365,
      };
      const defaultExpiry = new Date(
        now.getTime() + expiryDaysMap[section] * 24 * 60 * 60 * 1000
      )
        .toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          ...(section === 'long_term' ? { year: 'numeric' as const } : {}),
        })
        .toUpperCase();

      // Live-verify every Custom Filter stock against real exchange OHLCV + Fundamentals
      // so SL, Target 1/2, Call Expiry, and MTF Leverage are 100% data-driven (never AI guesses or fixed defaults)
      const setups = await Promise.all(
        rawSetups.map(async (s, idx) => {
          const cleanSymbol = String(s.symbol || '').toUpperCase().trim();
          const [liveMetrics, liveFund] = cleanSymbol
            ? await Promise.all([
                fetchChartMetrics(cleanSymbol, market),
                fetchLiveFundamentals(cleanSymbol, market),
              ])
            : [null, null];

          const liveRisk = liveMetrics
            ? buildSectionRiskLevels(liveMetrics, section, universe)
            : null;
          const liveMtf = liveMetrics
            ? computeDynamicMtfLeverage(liveMetrics, true, liveFund)
            : null;

          const effectiveExpiryDays = liveRisk ? liveRisk.expiryDays : expiryDaysMap[section];
          const computedExpiryDate = new Date(
            now.getTime() + effectiveExpiryDays * 24 * 60 * 60 * 1000
          )
            .toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              ...(section === 'long_term' ? { year: 'numeric' as const } : {}),
            })
            .toUpperCase();

          const angleScores = {
            technical: clampRating(s.technicalScore, 7.8),
            priceAction: clampRating(s.priceActionScore, 7.8),
            fundamentals: clampRating(s.fundamentalsScore, 7.5),
            news: clampRating(s.newsScore, 7.5),
            safety: clampRating(s.safetyScore, 7.8),
          };
          const avgAngle =
            (angleScores.technical +
              angleScores.priceAction +
              angleScores.fundamentals +
              angleScores.news +
              angleScores.safety) /
            5;

          return {
            id: `${section}_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
            section,
            universe: market === 'NSE' ? universe : undefined,
            symbol: cleanSymbol,
            companyName: liveMetrics?.companyName || s.companyName || cleanSymbol,
            exchange: liveMetrics?.exchange || s.exchange || market,
            sector: s.sector || 'Equities',
            currency: liveMetrics?.currency || currency,
            direction: s.direction === 'Short' ? 'Short' : 'Long',
            currentPrice: liveMetrics?.currentPrice || Number(s.currentPrice) || Number(s.prevClose) || 0,
            prevClose: liveMetrics?.prevClose || Number(s.prevClose) || Number(s.currentPrice) || 0,
            dayChangePct:
              liveMetrics !== null
                ? liveMetrics.dayChangePct
                : Number.isFinite(Number(s.dayChangePct))
                  ? Number(s.dayChangePct)
                  : undefined,
            asOfDate: liveMetrics?.asOfDate || asOfDate,
            callDate: callDateLabel,
            callExpiryDate: liveRisk ? computedExpiryDate : (s.callExpiryDate || defaultExpiry).toUpperCase(),
            hdRating: clampRating(s.hdRating, Math.round(avgAngle * 10) / 10),
            angleScores,
            parameters: normalizeParameters(s.parameters),
            entryMin: liveRisk ? liveRisk.entryMin : Number(s.entryMin) || Number(s.currentPrice) || 0,
            entryMax: liveRisk ? liveRisk.entryMax : Number(s.entryMax) || Number(s.entryMin) || 0,
            stopLoss: liveRisk ? liveRisk.stopLoss : Number(s.stopLoss) || 0,
            target1: liveRisk ? liveRisk.target1 : Number(s.target1) || 0,
            target2: liveRisk ? liveRisk.target2 : Number(s.target2) || 0,
            riskReward: liveRisk ? liveRisk.riskReward : s.riskReward || '1 : 2.0',
            holdingWindow: liveRisk ? liveRisk.holdingWindow : s.holdingWindow || spec.holdingDefault,
            expiryDays: effectiveExpiryDays,
            slLogic: liveRisk?.slLogic,
            targetLogic: liveRisk?.targetLogic,
            expiryLogic: liveRisk?.expiryLogic,
            setupType: s.setupType || spec.defaultSetupType,
            entryRule: s.entryRule || '',
            exitRule: s.exitRule || '',
            rationale: s.rationale || '',
            strengths: Array.isArray(s.strengths) ? s.strengths.slice(0, 3) : [],
            weaknesses: Array.isArray(s.weaknesses) ? s.weaknesses.slice(0, 3) : [],
            trapWarning: s.trapWarning || '',
            newsSummary: s.newsSummary || '',
            mtfLeverage:
              section === 'mtf'
                ? liveMtf
                  ? liveMtf.label
                  : s.mtfLeverage || '2x–3x MTF'
                : '',
            status: 'watching',
            sources,
            createdAt: nowIso,
          };
        })
      );

      res.json({
        section,
        monthLabel,
        market,
        universe,
        asOfDate,
        marketNote: parsed.marketNote || '',
        setups,
        sources,
        generatedAt: nowIso,
      });
    } catch (err) {
      // Fallback to live quantitative Nifty 500 / Nifty 1000 / US exchange screener if Gemini hits 429 rate limit
      try {
        const liveResult = await scanUniverseLive({
          section,
          market,
          universe,
          count,
          language,
          watchlist,
        });
        res.json({
          section,
          monthLabel,
          market,
          universe,
          asOfDate: liveResult.asOfDate,
          marketNote: liveResult.marketNote,
          setups: liveResult.setups,
          sources: liveResult.sources,
          generatedAt: new Date().toISOString(),
        });
      } catch {
        res.status(500).json({ error: formatGeminiError(err) });
      }
    }
  };

  app.post('/api/stocks/scan', handleSectionStockScan);
  app.post('/api/swing/scan', handleSectionStockScan);

  // 2. HD Deep Research — 360° Single-Stock All-Angle Research (Indicators + Technical + Price Action + Fundamentals + News + Safety + /10 Rating)
  app.post('/api/stocks/deep-research', async (req, res) => {
    const body = req.body as {
      query?: string;
      market?: 'NSE' | 'US';
      language?: 'auto' | 'en' | 'hi' | 'hinglish';
    };

    const query = (body.query || '').trim();
    if (!query || query.length < 2) {
      res.status(400).json({ error: 'Kisi stock ka naam ya symbol likho (e.g. TRENT, BEL, TATAMOTORS, NVDA).' });
      return;
    }

    const market: 'NSE' | 'US' = body.market === 'US' ? 'US' : 'NSE';
    const language = body.language || 'hinglish';
    const currency = market === 'NSE' ? '₹' : '$';
    const todayIsoDate = new Date().toISOString().slice(0, 10);

    const langDirective =
      language === 'hi'
        ? 'Write ALL explanations, simpleSummary, strengths, weaknesses, trapAlert, entryRule, exitRule, and every angle summary/highlights in clear, simple Hindi (Devanagari) keeping standard trading terms readable.'
        : language === 'hinglish'
          ? 'Write ALL explanations, simpleSummary, strengths, weaknesses, trapAlert, entryRule, exitRule, and every angle summary/highlights in super clear, easy-to-understand Hinglish (Hindi in Latin script) — bilkul aasan bhasha me samjhao taaki beginner bhi samajh sake.'
          : 'Write ALL explanations in crystal-clear, simple English.';

    // Live Quantitative Engine FIRST (fast ~1.5s, zero 429, 100% live exchange OHLCV + Fundamentals + Multi-Model Fair Value + Live News)
    try {
      const liveReport = await buildDeepResearchLive(query, market, language);
      res.json(liveReport);
      return;
    } catch {
      // Fall back to Gemini Search if symbol couldn't be resolved directly on live exchange feed
    }

    try {
      const ai = createGeminiClient();

      // Stage 1: Exhaustive 360-degree live Google Search research on the requested stock
      const searchResp = await ai.models.generateContent({
        model: MODEL_FREE,
        contents: `Perform an exhaustive, 360-degree HD Deep Research analysis on the stock "${query}" (Primary market preference: ${market === 'NSE' ? 'India NSE/BSE in INR ₹' : 'US NYSE/NASDAQ in USD $'}, auto-detect if the user typed a US or Indian stock). Today's date: ${todayIsoDate}.

Use Google Search to gather real, latest verified data across EVERY SINGLE ANGLE (do not miss any angle):
1. LATEST PRICE & PREVIOUS TRADING DAY CLOSE: Current market price, previous day closing price, 52-week high/low, trading date.
2. TECHNICAL INDICATORS: Position vs 20/50/200 DMA/EMA, RSI (14), MACD momentum, volume & delivery trend.
3. PRICE ACTION: Major support zones, major resistance zones, chart structure (uptrend/downtrend/consolidation/breakout/retest).
4. FUNDAMENTAL ANALYSIS: Market cap, P/E vs industry, latest quarterly revenue & net profit YoY/QoQ growth, ROE & ROCE, Debt-to-Equity, promoter/FII/DII holding trend, business moat.
5. LATEST NEWS & CATALYSTS: Recent news headlines, order wins, earnings dates, management guidance, regulatory/SEBI/litigation risks.
6. TRAP & SAFETY CHECK: Is the stock overbought/extended, operator-driven, high promoter pledge, circuit-prone, or safe & liquid for MTF (Margin Trading Facility)?
7. ACTIONABLE PLAN: Best strategy fit (swing / short_term / long_term / mtf / avoid), realistic Entry Zone, strict Stop Loss (Exit), Target 1, Target 2, exact entry trigger, and exact exit rule.`,
        config: {
          tools: [{ googleSearch: {} }],
          thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
        },
      });

      const sources = extractGroundingSources(searchResp).map((s, idx) => ({
        index: idx + 1,
        ...s,
      }));

      const researchNotes = (searchResp.text || '').trim();
      if (!researchNotes) {
        throw new Error('Stock ka live data nahi mil paya. Sahi stock naam/symbol check karke retry karein.');
      }

      // Stage 2: Convert all angles into institutional Pro Research JSON with transparent /10 ratings
      const structuredResp = await ai.models.generateContent({
        model: MODEL_FREE,
        contents: `Convert the 360-degree verified stock research below into a comprehensive, easy-to-read HD Pro Research JSON report (structured like an institutional Pro Research dossier).
${langDirective}

Rules:
- Be 100% honest: if the stock is weak, overvalued, falling, or a trap, give a low rating (e.g. 3.5 to 5.5 / 10), set bestFitSection to "avoid", and clearly warn in trapAlert.
- Score every single angle honestly from 1.0 to 10.0: technical, priceAction, fundamentals, news, safety.
- keyIndicators: 9 to 12 factual metrics (52-Week Range, Market Cap, P/E Ratio, Fwd P/E, EPS, ROE, ROCE, Debt/Equity, Div Yield, Book Value, Next Earnings).
- fairValue: realistic estimated fair value price in the stock's currency; fairValueUpsidePct: percentage difference vs currentPrice.
- technicalSummary: overall, movingAverages, indicators (each one of: "Strong Buy", "Buy", "Neutral", "Sell", "Strong Sell").
- momentum: 4 items for periods "1 Week", "1 Month", "3 Months", "1 Year" with percentage returns like "+4.2%" or "-3.1%".
- strengths (Pro Tips positives, 3-5 points) and weaknesses (Pro Tips warnings, 2-4 points).
- bullCase (3 points), bearCase (3 points).
- swot: strengths (2-3), weaknesses (2-3), opportunities (2-3), threats (2-3).
- recentNews: 2 to 4 recent news items (last 60 days) with title, date, concise summary, importance (1-10), and sentiment ("Positive", "Neutral", or "Negative").
- parameters: 10 daily audit checks (EMA Trend, RSI 14, MACD/Volume, Support/Resistance, Quarterly Growth, ROE/ROCE, Debt & P/E, Promoter/FII Holding, Latest News, Trap & MTF Safety) with pass/caution/fail.
- Ensure numeric prices are clean positive numbers without currency signs (stopLoss < entryMin <= entryMax < target1 < target2 for long bias).
- Set currency to "₹" for Indian NSE/BSE stocks and "$" for US stocks.

Verified 360-Degree Research Notes:
${researchNotes}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              symbol: { type: Type.STRING },
              companyName: { type: Type.STRING },
              exchange: { type: Type.STRING },
              sector: { type: Type.STRING },
              currency: { type: Type.STRING, description: '₹ or $' },
              currentPrice: { type: Type.NUMBER },
              prevClose: { type: Type.NUMBER },
              dayChangePct: { type: Type.NUMBER },
              asOfDate: { type: Type.STRING },
              hdRating: { type: Type.NUMBER },
              fairValue: { type: Type.NUMBER },
              fairValueUpsidePct: { type: Type.NUMBER },
              verdict: { type: Type.STRING },
              bestFitSection: {
                type: Type.STRING,
                description: 'swing, short_term, long_term, mtf, or avoid',
              },
              mtfEligible: { type: Type.BOOLEAN },
              simpleSummary: { type: Type.STRING },
              keyIndicators: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    value: { type: Type.STRING },
                  },
                  required: ['label', 'value'],
                },
              },
              techSummaryOverall: { type: Type.STRING },
              techSummaryMA: { type: Type.STRING },
              techSummaryIndicators: { type: Type.STRING },
              momentum: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    period: { type: Type.STRING },
                    returnPct: { type: Type.STRING },
                  },
                  required: ['period', 'returnPct'],
                },
              },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              bullCase: { type: Type.ARRAY, items: { type: Type.STRING } },
              bearCase: { type: Type.ARRAY, items: { type: Type.STRING } },
              swotOpportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
              swotThreats: { type: Type.ARRAY, items: { type: Type.STRING } },
              recentNews: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    date: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    importance: { type: Type.NUMBER },
                    sentiment: { type: Type.STRING },
                  },
                  required: ['title', 'date', 'summary', 'importance', 'sentiment'],
                },
              },
              trapAlert: { type: Type.STRING },
              entryMin: { type: Type.NUMBER },
              entryMax: { type: Type.NUMBER },
              stopLoss: { type: Type.NUMBER },
              target1: { type: Type.NUMBER },
              target2: { type: Type.NUMBER },
              riskReward: { type: Type.STRING },
              holdingWindow: { type: Type.STRING },
              entryRule: { type: Type.STRING },
              exitRule: { type: Type.STRING },
              technicalScore: { type: Type.NUMBER },
              technicalSummary: { type: Type.STRING },
              technicalHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
              priceActionScore: { type: Type.NUMBER },
              priceActionSummary: { type: Type.STRING },
              priceActionHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
              fundamentalsScore: { type: Type.NUMBER },
              fundamentalsSummary: { type: Type.STRING },
              fundamentalsHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
              newsScore: { type: Type.NUMBER },
              newsSummary: { type: Type.STRING },
              newsHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
              safetyScore: { type: Type.NUMBER },
              safetySummary: { type: Type.STRING },
              safetyHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
              parameters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    name: { type: Type.STRING },
                    value: { type: Type.STRING },
                    status: { type: Type.STRING },
                    note: { type: Type.STRING },
                  },
                  required: ['category', 'name', 'value', 'status', 'note'],
                },
              },
            },
            required: [
              'symbol',
              'companyName',
              'exchange',
              'sector',
              'currency',
              'currentPrice',
              'prevClose',
              'asOfDate',
              'hdRating',
              'fairValue',
              'fairValueUpsidePct',
              'verdict',
              'bestFitSection',
              'mtfEligible',
              'simpleSummary',
              'keyIndicators',
              'techSummaryOverall',
              'techSummaryMA',
              'techSummaryIndicators',
              'momentum',
              'strengths',
              'weaknesses',
              'bullCase',
              'bearCase',
              'swotOpportunities',
              'swotThreats',
              'recentNews',
              'trapAlert',
              'entryMin',
              'entryMax',
              'stopLoss',
              'target1',
              'target2',
              'riskReward',
              'holdingWindow',
              'entryRule',
              'exitRule',
              'technicalScore',
              'technicalSummary',
              'technicalHighlights',
              'priceActionScore',
              'priceActionSummary',
              'priceActionHighlights',
              'fundamentalsScore',
              'fundamentalsSummary',
              'fundamentalsHighlights',
              'newsScore',
              'newsSummary',
              'newsHighlights',
              'safetyScore',
              'safetySummary',
              'safetyHighlights',
              'parameters',
            ],
          },
        },
      });

      const d = JSON.parse((structuredResp.text || '{}').trim()) as Record<string, unknown>;
      const detectedCurr: '₹' | '$' = d.currency === '$' ? '$' : d.currency === '₹' ? '₹' : currency;
      const detectedMarket: 'NSE' | 'US' = detectedCurr === '$' ? 'US' : 'NSE';
      const rawFit = String(d.bestFitSection || 'swing');
      const bestFitSection: 'swing' | 'short_term' | 'long_term' | 'mtf' | 'avoid' =
        rawFit === 'swing' ||
        rawFit === 'short_term' ||
        rawFit === 'long_term' ||
        rawFit === 'mtf' ||
        rawFit === 'avoid'
          ? rawFit
          : 'swing';

      const techScore = clampRating(d.technicalScore, 6.5);
      const paScore = clampRating(d.priceActionScore, 6.5);
      const fundScore = clampRating(d.fundamentalsScore, 6.5);
      const newsScore = clampRating(d.newsScore, 6.5);
      const safeScore = clampRating(d.safetyScore, 6.5);
      const avgRating = Math.round(((techScore + paScore + fundScore + newsScore + safeScore) / 5) * 10) / 10;

      const strengthsList = Array.isArray(d.strengths) ? (d.strengths as string[]).slice(0, 5) : [];
      const weaknessesList = Array.isArray(d.weaknesses) ? (d.weaknesses as string[]).slice(0, 5) : [];

      const report = {
        id: `hdr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        query,
        symbol: String(d.symbol || query).toUpperCase().trim(),
        companyName: String(d.companyName || query),
        exchange: String(d.exchange || detectedMarket),
        sector: String(d.sector || 'Equities'),
        currency: detectedCurr,
        currentPrice: Number(d.currentPrice) || Number(d.prevClose) || 0,
        prevClose: Number(d.prevClose) || Number(d.currentPrice) || 0,
        dayChangePct: Number.isFinite(Number(d.dayChangePct)) ? Number(d.dayChangePct) : undefined,
        asOfDate: String(d.asOfDate || todayIsoDate),
        hdRating: clampRating(d.hdRating, avgRating),
        fairValue: Number(d.fairValue) > 0 ? Number(d.fairValue) : undefined,
        fairValueUpsidePct: Number.isFinite(Number(d.fairValueUpsidePct))
          ? Math.round(Number(d.fairValueUpsidePct) * 100) / 100
          : undefined,
        verdict: String(d.verdict || 'Watchlist'),
        bestFitSection,
        mtfEligible: Boolean(d.mtfEligible),
        simpleSummary: String(d.simpleSummary || ''),
        keyIndicators: Array.isArray(d.keyIndicators)
          ? (d.keyIndicators as Array<{ label: string; value: string }>).slice(0, 12)
          : [],
        technicalSummary: {
          overall: String(d.techSummaryOverall || 'Neutral'),
          movingAverages: String(d.techSummaryMA || 'Neutral'),
          indicators: String(d.techSummaryIndicators || 'Neutral'),
        },
        momentum: Array.isArray(d.momentum)
          ? (d.momentum as Array<{ period: string; returnPct: string }>).slice(0, 6)
          : [],
        strengths: strengthsList,
        weaknesses: weaknessesList,
        bullCase: Array.isArray(d.bullCase) ? (d.bullCase as string[]).slice(0, 4) : [],
        bearCase: Array.isArray(d.bearCase) ? (d.bearCase as string[]).slice(0, 4) : [],
        swot: {
          strengths: strengthsList.slice(0, 3),
          weaknesses: weaknessesList.slice(0, 3),
          opportunities: Array.isArray(d.swotOpportunities)
            ? (d.swotOpportunities as string[]).slice(0, 3)
            : [],
          threats: Array.isArray(d.swotThreats) ? (d.swotThreats as string[]).slice(0, 3) : [],
        },
        recentNews: Array.isArray(d.recentNews)
          ? (
              d.recentNews as Array<{
                title: string;
                date: string;
                summary: string;
                importance: number;
                sentiment: string;
              }>
            )
              .slice(0, 4)
              .map((n) => ({
                title: String(n.title || ''),
                date: String(n.date || ''),
                summary: String(n.summary || ''),
                importance: Math.max(1, Math.min(10, Math.round(Number(n.importance) || 5))),
                sentiment:
                  n.sentiment === 'Positive' || n.sentiment === 'Negative'
                    ? n.sentiment
                    : 'Neutral',
              }))
          : [],
        trapAlert: String(d.trapAlert || ''),
        entryMin: Number(d.entryMin) || Number(d.currentPrice) || 0,
        entryMax: Number(d.entryMax) || Number(d.entryMin) || 0,
        stopLoss: Number(d.stopLoss) || 0,
        target1: Number(d.target1) || 0,
        target2: Number(d.target2) || 0,
        riskReward: String(d.riskReward || '1 : 2.0'),
        holdingWindow: String(d.holdingWindow || '1–3 Weeks'),
        entryRule: String(d.entryRule || ''),
        exitRule: String(d.exitRule || ''),
        angles: {
          technical: {
            score: techScore,
            summary: String(d.technicalSummary || ''),
            highlights: Array.isArray(d.technicalHighlights)
              ? (d.technicalHighlights as string[]).slice(0, 4)
              : [],
          },
          priceAction: {
            score: paScore,
            summary: String(d.priceActionSummary || ''),
            highlights: Array.isArray(d.priceActionHighlights)
              ? (d.priceActionHighlights as string[]).slice(0, 4)
              : [],
          },
          fundamentals: {
            score: fundScore,
            summary: String(d.fundamentalsSummary || ''),
            highlights: Array.isArray(d.fundamentalsHighlights)
              ? (d.fundamentalsHighlights as string[]).slice(0, 4)
              : [],
          },
          news: {
            score: newsScore,
            summary: String(d.newsSummary || ''),
            highlights: Array.isArray(d.newsHighlights)
              ? (d.newsHighlights as string[]).slice(0, 4)
              : [],
          },
          safety: {
            score: safeScore,
            summary: String(d.safetySummary || ''),
            highlights: Array.isArray(d.safetyHighlights)
              ? (d.safetyHighlights as string[]).slice(0, 4)
              : [],
          },
        },
        parameters: Array.isArray(d.parameters)
          ? (
              d.parameters as Array<{
                category: string;
                name: string;
                value: string;
                status: string;
                note: string;
              }>
            )
              .slice(0, 12)
              .map((p) => {
                const validCats = new Set([
                  'Technical',
                  'Price Action',
                  'Fundamental',
                  'News',
                  'Safety',
                ]);
                const validStatus = new Set(['pass', 'caution', 'fail']);
                const st = String(p.status || '').toLowerCase();
                return {
                  category: validCats.has(p.category) ? p.category : 'Technical',
                  name: String(p.name || 'Parameter').trim(),
                  value: String(p.value || '—').trim(),
                  status: validStatus.has(st) ? st : 'caution',
                  note: String(p.note || '').trim(),
                };
              })
          : [],
        sources,
        language,
        market: detectedMarket,
        createdAt: new Date().toISOString(),
      };

      res.json(report);
    } catch (err) {
      // Graceful fallback to live exchange OHLCV + Google News Pro Research when Gemini hits 429 rate limits
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
        try {
          const liveReport = await buildDeepResearchLive(query, market, language);
          res.json(liveReport);
          return;
        } catch (liveErr) {
          res.status(500).json({
            error:
              liveErr instanceof Error ? liveErr.message : formatGeminiError(err),
          });
          return;
        }
      }
      res.status(500).json({ error: formatGeminiError(err) });
    }
  });

  // 3. Daily Exit & Trap Protection Check ("Re-Update Exit — khas koi fas na jaye")
  app.post('/api/stocks/recheck', async (req, res) => {
    const body = req.body as {
      section?: 'swing' | 'short_term' | 'long_term' | 'mtf';
      language?: 'auto' | 'en' | 'hi' | 'hinglish';
      setups?: Array<{
        id: string;
        symbol: string;
        exchange?: string;
        currency?: string;
        direction?: 'Long' | 'Short';
        entryMin: number;
        entryMax: number;
        stopLoss: number;
        target1: number;
        target2: number;
        actualEntry?: string;
        status?: string;
        callExpiryDate?: string;
        expiryDays?: number;
        createdAt?: string;
      }>;
    };

    const setups = Array.isArray(body.setups) ? body.setups.slice(0, 25) : [];
    if (setups.length === 0) {
      res.status(400).json({ error: 'Check karne ke liye kam se kam 1 stock setup hona chahiye.' });
      return;
    }

    const section = body.section || 'swing';
    const language = body.language || 'hinglish';
    const todayIsoDate = new Date().toISOString().slice(0, 10);

    const langDirective =
      language === 'hi'
        ? 'Write exitReason and newsAlert in clear, urgent, simple Hindi (Devanagari).'
        : language === 'hinglish'
          ? 'Write exitReason and newsAlert in crystal-clear, simple Hinglish so the user immediately knows whether to Hold, Trail SL, Book Partial, or Exit safely.'
          : 'Write exitReason and newsAlert in clear, direct English.';

    const setupListSummary = setups
      .map(
        (s) =>
          `- ID: ${s.id} | Symbol: ${s.symbol} (${s.exchange || 'NSE'}) | Dir: ${s.direction || 'Long'} | Entry: ${s.actualEntry || `${s.entryMin}-${s.entryMax}`} | SL: ${s.stopLoss} | T1: ${s.target1} | T2: ${s.target2} | Expiry: ${s.callExpiryDate || 'N/A'} | Status: ${s.status || 'watching'}`
      )
      .join('\n');

    try {
      // Direct live exchange price + 20 EMA + RSI + Google News check (fast & zero 429 failures)
      const liveUpdates = await recheckSetupsLive(
        setups.map((s) => ({
          ...s,
          currency: s.currency === '$' ? '$' : '₹',
          direction: s.direction === 'Short' ? 'Short' : 'Long',
        })),
        language
      );
      res.json({ updates: liveUpdates, checkedAt: new Date().toISOString() });
      return;
    } catch {
      // Fall through to Gemini if live exchange feed fails
    }

    try {
      const ai = createGeminiClient();

      // Stage 1: Live Google Search for previous day close, latest price, and breaking news on active setups
      const searchResp = await ai.models.generateContent({
        model: MODEL_FREE,
        contents: `You are a strict risk-manager protecting retail traders from getting trapped ("koi fas na jaye"). Today's date: ${todayIsoDate}. Section: ${section.toUpperCase()}.
Check the LATEST market price, previous trading day's closing price, recent price trend, and ANY fresh negative or positive news for each stock below:
${setupListSummary}

For each stock, determine the exact protective action:
- EXIT_NOW: if Stop Loss broke, support cracked with heavy volume, or serious negative news hit.
- BOOK_PARTIAL: if Target 1 is reached/near or upside momentum is fading.
- TRAIL_SL: if stock is cleanly in profit and SL should be raised to protect gains (give exact numeric suggestedTrailingSl).
- HOLD: if trade is active and healthy above SL.
- WAIT_ENTRY: if user is still watching and stock has not triggered clean entry yet.`,
        config: {
          tools: [{ googleSearch: {} }],
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      const notes = (searchResp.text || '').trim();
      if (!notes) {
        throw new Error('Live exit check data nahi mil paya. Retry karein.');
      }

      // Stage 2: Structured JSON response mapped by setup ID
      const structuredResp = await ai.models.generateContent({
        model: MODEL_FREE,
        contents: `Convert the live risk & exit check notes below into structured JSON updates for EVERY setup ID provided.
${langDirective}
Use exact IDs from the original list: ${setups.map((s) => s.id).join(', ')}.
actionSignal MUST be one of: WAIT_ENTRY, HOLD, TRAIL_SL, BOOK_PARTIAL, EXIT_NOW.

Risk Check Notes:
${notes}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              updates: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    latestPrice: { type: Type.NUMBER },
                    prevClose: { type: Type.NUMBER },
                    actionSignal: { type: Type.STRING },
                    suggestedTrailingSl: { type: Type.NUMBER },
                    exitReason: { type: Type.STRING },
                    newsAlert: { type: Type.STRING },
                  },
                  required: [
                    'id',
                    'latestPrice',
                    'prevClose',
                    'actionSignal',
                    'suggestedTrailingSl',
                    'exitReason',
                    'newsAlert',
                  ],
                },
              },
            },
            required: ['updates'],
          },
        },
      });

      const parsed = JSON.parse((structuredResp.text || '{"updates":[]}').trim()) as {
        updates?: Array<{
          id: string;
          latestPrice: number;
          prevClose: number;
          actionSignal: string;
          suggestedTrailingSl: number;
          exitReason: string;
          newsAlert: string;
        }>;
      };

      const checkedAt = new Date().toISOString();
      const validSignals = new Set(['WAIT_ENTRY', 'HOLD', 'TRAIL_SL', 'BOOK_PARTIAL', 'EXIT_NOW']);

      const updates = (parsed.updates || []).map((u) => ({
        id: u.id,
        latestPrice: Number(u.latestPrice) || 0,
        prevClose: Number(u.prevClose) || Number(u.latestPrice) || 0,
        actionSignal: validSignals.has(u.actionSignal) ? u.actionSignal : 'HOLD',
        suggestedTrailingSl: Number(u.suggestedTrailingSl) > 0 ? Number(u.suggestedTrailingSl) : undefined,
        exitReason: u.exitReason || '',
        newsAlert: u.newsAlert || '',
        checkedAt,
      }));

      res.json({ updates, checkedAt });
    } catch (err) {
      res.status(500).json({ error: formatGeminiError(err) });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';
  let viteServerRef: { close: () => Promise<void> } | null = null;

  if (!isProd) {
    const viteReadyPromise = (async () => {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: false,
          ws: false,
        },
        appType: 'spa',
      });
      viteServerRef = vite;
      return vite;
    })();

    // Prevent unhandled rejection crashes if Vite fails during background startup
    viteReadyPromise.catch((err) => {
      console.error('Vite middleware initialization failed:', err);
    });

    app.get('/@vite/client', async (_req, res, next) => {
      try {
        const vite = await viteReadyPromise;
        const result = await vite.transformRequest('/@vite/client');
        if (!result?.code) {
          next();
          return;
        }
        const patched = result.code
          .replace(
            'transport.connect(createHMRHandler(handleMessage));',
            '/* HMR WebSocket disabled in middleware mode */'
          )
          .replace(
            'else throw new SendBeforeConnectError("send was called before connect");',
            'else return;'
          )
          .replace(
            'else throw new SendBeforeConnectError("invoke was called before connect");',
            'else return;'
          );
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        res.send(patched);
      } catch (err) {
        next(err);
      }
    });

    app.use(async (req, res, next) => {
      try {
        const vite = await viteReadyPromise;
        vite.middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        next();
        return;
      }
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  const httpServer = app.listen(PORT, HOST, () => {
    console.log(`HD Deep Research server listening on http://${HOST}:${PORT}`);
  });

  const shutdown = () => {
    httpServer.close(() => {
      if (viteServerRef) {
        viteServerRef.close().finally(() => process.exit(0));
      } else {
        process.exit(0);
      }
    });
    setTimeout(() => process.exit(0), 2000).unref();
  };

  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}

startServer();
