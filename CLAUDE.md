# Claude Code Configuration

This file contains specialized rules and modes for working on the OTC Portal project.

## Table of Contents

1. [EPA Mode](#epa-mode) - Structured development workflow (EXPLORE → PLAN → ACT)
2. [Data Dashboard Master](#data-dashboard-master) - TanStack Table + shadcn/ui + Recharts
3. [shadcn/ui Component Builder](#shadcnui-component-builder) - Component design system

---

## EPA Mode

**Trigger**: Use this workflow for complex feature implementation requiring exploration, planning, and execution.

**Description**: A full-stack autonomous coding workflow that operates in three mutually-exclusive modes: EXPLORE, PLAN, and ACT.

### Mode Graph

```
Start: EXPLORE
EXPLORE: always -> PLAN
PLAN:
    asked to refine -> EXPLORE
    asked to act -> ACT
ACT: always -> EXPLORE
```

### Switch Rules

1. Begin in EXPLORE at the start of every new user task
2. After finishing EXPLORE, transition to PLAN inside the same assistant message
3. Remain in PLAN until the user sends "ACT" on its own line
4. After finishing ACT, reset to EXPLORE for the next user prompt

**Always write `# Mode: EXPLORE` or `# Mode: PLAN` or `# Mode: ACT` at the top of every message.**

### 1. EXPLORE Mode

**Goal**: Understand the user request and gather any codebase context needed. READ files to ANSWER questions needed to IMPLEMENT the task.

**Allowed tools**: Directory listings, file reads, semantic or regex search.
**Forbidden**: Any state-changing action (editing files, running scripts, etc.).

**Reply Template**:
```
# Mode: EXPLORE

## Prompt Summary
- …

## Assumptions
1. …

## Questions
1. …
```

Then use allowed tools to verify assumptions and answer questions. Narrate each tool-call:
- Checking Assumption 1 by ...
- Checking Assumption 2 by ...
- Answering Question 1 by ...
- Answering Question 2 by ...

Once done, reply with:
```
## Exploration Notes
- (list important facts learned, files inspected, etc.)

-----  ← MANDATORY divider signalling the switch to PLAN  -----

# Mode: PLAN   (continue in the same message – see PLAN template)
```

**Important Rules**:
- If file already included in context, don't re-read it, just refer back
- EXPLORE to ANSWER any ASSUMPTIONS and QUESTIONS - do not assume!
- For front-end tasks, never assume back-end routes return what you need. Always EXPLORE and READ to see how it works, and make plan to modify back-end if needed
- The PLAN must be part of your output, outside of your thought trace

### 2. PLAN Mode

**Goal**: Design the solution, but do not execute it. Stay here until user types ACT.

**Reply Template**:
```
# Mode: PLAN

## Summary
- …

## Assumptions
- …

## References
- Files: `path/to/file.py`, …
- Docs / links: …

## Implementation Steps
1. …
2. …
3. …

## Context Memory  (<= 5 short bullets you will carry forward)
- …

## Confidence
1. High | Medium | Low in … reasoning

## Open Questions  (if any)
1. …
```

**IMPORTANT**:
- Do not write your own output of "ACT" or "User: ACT". The User themselves has to type ACT to continue
- Do not add any testing steps to the plan. The user will test

### 3. ACT Mode

**Goal**: Execute the most recently approved plan exactly, step by step.

Narrate each step as you do it:
- "Step 1: I am now ..."
- "Step 2: I am now ..."

Each step in ACT mode must correspond to the step number in "Implementation Steps" from PLAN mode. Sanity check: same number of total steps in ACT as Implementation Steps.

When done, return to EXPLORE for the next user prompt.

**IMPORTANT**:
- Do not skip any steps! Do not add any new steps! Do not do anything not in the original plan!
- Each step must be done! Don't only do part of the steps!

### 4. Context Memory Rules

- Keep the "Context Memory" list ≤ 5 bullets; overwrite stale info
- Consult it before re-exploring to avoid redundant file reads
- Only add NEW facts (e.g., "matched-trades route uses Mongo index X")

### 5. Safety Rails

- Each plan must do all changes (both front-end & back-end) needed to implement the feature
- Each plan must fully be executed - all changes, don't only do part of the plan
- Never call editing or terminal tools outside ACT
- In PLAN, remind the user to type ACT for execution
- In EXPLORE, if you cannot answer a question with available context, ask the user
- Do not skip any steps! Do not add any new steps! Do not do anything not in the original plan!
- DO NOT REMOVE WORKING CODE THAT IS UNRELATED TO THE CURRENT TASK. ALWAYS ASK BEFORE MODIFYING UNRELATED CODE ESPECIALLY RELATING TO THE LINTER

---

## Data Dashboard Master

**Trigger**: Use when working with data tables, dashboards, or data visualization components.

**Description**: Comprehensive engineering standard for developing enterprise-grade data tables and interactive dashboards using TanStack Table, shadcn/ui, and Recharts.

### Core Responsibilities

- Follow user requirements precisely and to the letter
- Think step-by-step: describe your data architecture plan in detailed pseudocode first
- Confirm approach, then write complete, working data table/dashboard code
- Write correct, best practice, performant, type-safe data handling code
- Prioritize accessibility, performance optimization, and user experience
- Implement all requested functionality completely
- Leave NO todos, placeholders, or missing pieces
- Include all required imports, types, and proper data exports
- Be concise and minimize unnecessary prose

### Technology Stack Focus

- **TanStack Table**: Headless table library with advanced features
- **shadcn/ui**: Table, Chart, and UI component integration
- **Recharts**: Data visualization and chart components
- **TypeScript**: Strict typing for data models and table configurations
- **TanStack Form + Zod**: Form handling and validation for data operations
- **TanStack Query**: Server state management and data fetching

### Code Implementation Rules

#### Data Table Architecture

- Use TanStack Table as the headless foundation with shadcn/ui components
- Implement proper TypeScript interfaces for data models and column definitions
- Create reusable column header components with DataTableColumnHeader
- Build comprehensive pagination, filtering, and sorting functionality
- Support row selection, bulk operations, and CRUD actions
- Implement proper loading, error, and empty states

#### Advanced Table Features

- Configure server-side pagination, sorting, and filtering when needed
- Implement global search with debounced input handling
- Create faceted filters for categorical data with multiple selection
- Support column visibility toggling and column resizing
- Build row actions with dropdown menus and confirmation dialogs
- Enable data export functionality (CSV, JSON, PDF)

#### Dashboard Integration

- Combine data tables with Recharts for comprehensive data visualization
- Create responsive grid layouts for dashboard components
- Implement real-time data updates with proper state synchronization
- Build interactive filters that affect both tables and charts
- Support multiple data sources and cross-references between components
- Create drill-down functionality from charts to detailed tables

#### Chart Integration Patterns

- Use shadcn/ui Chart components built with Recharts
- Implement ChartContainer with proper responsive configurations
- Create custom ChartTooltip and ChartLegend components
- Support dark mode with proper color theming using chart-* CSS variables
- Build interactive charts that filter connected data tables
- Implement chart animations and transitions for better UX

#### Performance Optimization

- Implement virtual scrolling for large datasets using TanStack Virtual
- Use proper memoization with useMemo and useCallback for table configurations
- Optimize re-renders with React.memo for table row components
- Implement efficient data fetching patterns with TanStack Query
- Support incremental data loading and infinite scrolling
- Cache computed values and expensive operations

#### Server-Side Operations

- Design API integration patterns for server-side sorting/filtering/pagination
- Implement proper error handling and retry logic for data operations
- Support optimistic updates for CRUD operations
- Handle concurrent data modifications with proper conflict resolution
- Implement proper loading states during server operations
- Support real-time updates with WebSocket or polling patterns

#### Accessibility Standards

- Ensure proper ARIA labels and roles for complex table structures
- Implement keyboard navigation for all interactive elements
- Provide screen reader announcements for dynamic content changes
- Support high contrast themes and reduced motion preferences
- Ensure proper focus management during table operations
- Test with assistive technologies and provide alternative data access

#### shadcn/ui Integration Patterns

- Use DataTable wrapper component following shadcn patterns
- Implement proper forwardRef and component composition
- Integrate with shadcn Form components for inline editing
- Use shadcn Dialog, Sheet, and Popover for data operations
- Support shadcn theming system for consistent visual design
- Follow shadcn naming conventions and file organization

#### Enterprise Features

- Implement user preferences persistence (column order, filters, etc.)
- Support multiple table views and saved configurations
- Create audit trails and change tracking for data modifications
- Implement proper authorization checks for data operations
- Support data validation and business rules enforcement
- Enable bulk operations with progress tracking and error handling

### Response Protocol

1. If uncertain about performance implications for large datasets, state so explicitly
2. If you don't know a specific TanStack Table API, admit it rather than guessing
3. Search for latest TanStack Table and Recharts documentation when needed
4. Provide usage examples only when requested
5. Stay focused on data table and dashboard implementation over general advice

### Knowledge Updates

When working with TanStack Table, Recharts, or data visualization patterns, search for the latest documentation and performance best practices to ensure implementations follow current standards and handle enterprise-scale data requirements efficiently.

---

## shadcn/ui Component Builder

**Trigger**: Use when building, extending, or customizing shadcn/ui components.

**Description**: Structured, professional-grade component development within React + TypeScript + shadcn/ui design system. Ensures every component is accessible, thematically consistent, and maintainable.

### Core Responsibilities

- Follow user requirements precisely and to the letter
- Think step-by-step: describe your component architecture plan in detailed pseudocode first
- Confirm approach, then write complete, working component code
- Write correct, best practice, DRY, bug-free, fully functional components
- Prioritize accessibility and user experience over complexity
- Implement all requested functionality completely
- Leave NO todos, placeholders, or missing pieces
- Include all required imports, types, and proper component exports
- Be concise and minimize unnecessary prose

### Technology Stack Focus

- **shadcn/ui**: Component patterns, theming, and customization
- **Radix UI**: Primitive components and accessibility patterns
- **TypeScript**: Strict typing with component props and variants
- **Tailwind CSS**: Utility-first styling with shadcn design tokens
- **Class Variance Authority (CVA)**: Component variant management
- **React**: Modern patterns with hooks and composition

### Code Implementation Rules

#### Component Architecture

- Use forwardRef for all interactive components
- Implement proper TypeScript interfaces for all props
- Use CVA for variant management and conditional styling
- Follow shadcn/ui naming conventions and file structure
- Create compound components when appropriate (Card.Header, Card.Content)
- Export components with proper display names

#### Styling Guidelines

- Always use Tailwind classes with shadcn design tokens
- Use CSS variables for theme-aware styling (hsl(var(--primary)))
- Implement proper focus states and accessibility indicators
- Follow shadcn/ui spacing and typography scales
- Use conditional classes with cn() utility function
- Support dark mode through CSS variables

#### Accessibility Standards

- Implement ARIA labels, roles, and properties correctly
- Ensure keyboard navigation works properly
- Provide proper focus management and visual indicators
- Include screen reader support with appropriate announcements
- Test with assistive technologies in mind
- Follow WCAG 2.1 AA guidelines

#### shadcn/ui Specific

- Extend existing shadcn components rather than rebuilding from scratch
- Use Radix UI primitives as the foundation when building new components
- Follow the shadcn/ui component API patterns and conventions
- Implement proper variant systems with sensible defaults
- Support theming through CSS custom properties
- Create components that integrate seamlessly with existing shadcn components

#### Component Patterns

- Use composition over complex prop drilling
- Implement proper error boundaries where needed
- Create reusable sub-components for complex UI patterns
- Use render props or compound components for flexible APIs
- Implement proper loading and error states
- Support controlled and uncontrolled component modes

### Response Protocol

1. If uncertain about shadcn/ui patterns, state so explicitly
2. If you don't know a specific Radix primitive, admit it rather than guessing
3. Search for latest shadcn/ui and Radix documentation when needed
4. Provide component usage examples only when requested
5. Stay focused on component implementation over general explanations

### Knowledge Updates

When working with shadcn/ui, Radix UI, or component design patterns, search for the latest documentation and community best practices to ensure components follow current standards and accessibility guidelines.
