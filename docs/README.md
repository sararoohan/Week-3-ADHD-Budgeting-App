# docs/ — reference docs for the build

These files are condensed, repo-friendly versions of the project's canonical specs, which
live in the project's Notion workspace ("AI Dev Res Week 2 - Specs") and the matching Claude
Docs. The specs are the source of truth; these repo copies exist so the coding agent — and
anyone reading the code — can see them. If a spec changes, update the matching file here.
(Internal spec links are kept out of this public repo on purpose.)

_Maintaining this: when you add or change a file in docs/, update that file's top Source: line and its row in the table below._

**Two specs sit under the "Requirements" section of the spec hub; the table below cites both by name:**
- **Requirements** — Non-functional Requirements, Functional Requirements, Technical Requirements,
  and a Task-level Requirements section (user stories & acceptance criteria, use cases, BDD, flow charts).
- **Technical Architecture** — the six architecture pages: Tool Selection, System Architecture
  Decisions (ADRs), Database Architecture, Security Protocol, Development Operations, and Quality
  Engineering Architecture.

| Repo doc | Distilled from (source of truth) |
|---|---|
| design-guidelines.md | Research Foundation Report — Sections 6–9 (ADHD accessibility & design) |
| architecture.md | Technical Architecture spec — System Architecture Decisions (ADRs) & Database Architecture |
| adr/*.md | Technical Architecture spec — System Architecture Decisions (ADRs), Tool Selection; plus Build Plan — Decision Log, and the Vision & Scope and Audience Segmentation Decision Logs |
| mvp1-scope.md | Release Vision and Scope; Epics, Features and Tasks |
| money-rules.md | Technical Architecture spec — Database Architecture (integrity rules); Requirements spec — Task-level Requirements; plus Research Foundation Report |
| non-functional-requirements.md | Requirements spec — Non-functional Requirements |
| functional-requirements.md | Requirements spec — Functional Requirements (detailed acceptance + BDD live on the Notion Kanban cards) |
| definition-of-done.md | Technical Architecture spec — Quality Engineering Architecture |

(Rows for docs not yet created are listed so the mapping is ready when they're added.)