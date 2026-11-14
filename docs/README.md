# docs/ — reference docs for the build

These files are condensed, repo-friendly versions of the project's canonical specs, which
live in the project's Notion workspace ("AI Dev Res Week 2 - Specs") and the matching Claude
Docs. The specs are the source of truth; these repo copies exist so the coding agent — and
anyone reading the code — can see them. If a spec changes, update the matching file here.
(Internal spec links are kept out of this public repo on purpose.)

_Maintaining this: when you add or change a file in docs/, update that file's top Source: line and its row in the table below._

**Two specs share the "Technical Architecture" name.** The top-level **Requirements** spec was
originally titled "Technical Architecture" and was later renamed; it holds Non-functional
Requirements, Functional Requirements, Technical Requirements, and Task-level Requirements.
Inside it, a separate **Technical Architecture subpage** holds the six architecture pages: Tool
Selection, System Architecture Decisions (ADRs), Database Architecture, Security Protocol,
Development Operations, and Quality Engineering Architecture. In the table below, "Requirements"
means the spec itself and "Technical Architecture subpage" means that inner page.

| Repo doc | Distilled from (source of truth) |
|---|---|
| design-guidelines.md | Research Foundation Report — Sections 6–9 (ADHD accessibility & design) |
| architecture.md | Requirements spec → Technical Architecture subpage — System Architecture Decisions (ADRs) & Database Architecture |
| adr/*.md | Requirements spec → Technical Architecture subpage — System Architecture Decisions (ADRs), Tool Selection; plus Build Plan — Decision Log, and the Vision & Scope and Audience Segmentation Decision Logs |
| mvp1-scope.md | Release Vision and Scope; Epics, Features and Tasks |
| money-rules.md | Requirements spec — Database Architecture (integrity rules, under the Technical Architecture subpage) & Task-level Requirements; plus Research Foundation Report |
| non-functional-requirements.md | Requirements spec — Non-functional Requirements |
| functional-requirements.md | Requirements spec — Functional Requirements (detailed acceptance + BDD live on the Notion Kanban cards) |
| definition-of-done.md | Requirements spec — Quality Engineering Architecture (under the Technical Architecture subpage) |

(Rows for docs not yet created are listed so the mapping is ready when they're added.)