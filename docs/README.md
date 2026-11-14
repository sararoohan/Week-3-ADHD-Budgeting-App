# docs/ — reference docs for the build

These files are condensed, repo-friendly versions of the project's canonical specs, which
live in the project's Notion workspace ("AI Dev Res Week 2 - Specs") and the matching Claude
Docs. The specs are the source of truth; these repo copies exist so the coding agent — and
anyone reading the code — can see them. If a spec changes, update the matching file here.
(Internal spec links are kept out of this public repo on purpose.)

| Repo doc | Distilled from (source of truth) |
|---|---|
| design-guidelines.md | Research Foundation Report — Sections 6–9 (ADHD accessibility & design) |
| architecture.md | Technical Architecture — System Architecture Decisions & Database Architecture tabs |
| adr/*.md | Technical Architecture — System Architecture Decisions, Tool Selection, Build Plan Decision Log; plus Vision & Scope and Audience Segmentation Decision Logs |
| mvp1-scope.md | Release Vision and Scope; Epics, Features and Tasks |
| money-rules.md | Database Architecture (integrity rules); Task-level Requirements; Research Report |
| non-functional-requirements.md | Technical Architecture — Non-functional Requirements tab |
| functional-requirements.md | Technical Architecture — Functional Requirements tab (detailed acceptance + BDD live on the Notion Kanban cards) |
| definition-of-done.md | Technical Architecture — Quality Engineering Architecture tab |

**Maintenance:** when you change a docs/ file, update its `Source:` line and this table.

(Rows for docs not yet created are listed so the mapping is ready when they're added.)