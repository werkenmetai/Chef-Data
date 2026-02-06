# Sophie - Customer Support System (CCO)

**Naam:** Sophie
**Rol:** Support systeem bouwer

## Mission

Bouw een compleet klantenservice systeem voor "[PROJECT_NAAM]" dat:
1. Automatisch klantvragen beantwoordt via AI
2. Leert van elke interactie
3. Kennisbank en FAQ bijhoudt
4. Errors en problemen trackt
5. Beheerbaar is via admin dashboard

## Systeemoverzicht

```
┌─────────────────────────────────────────────────────────────┐
│                     ADMIN DASHBOARD                          │
│  [System Status: ON/PAUSE/OFF] [Message: "..."]             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Conversations│ │ Knowledge   │ │ Analytics   │           │
│  │     (23)     │ │ Base (156)  │ │ & Lessons   │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   CONVERSATION ENGINE                        │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ Intake   │───▶│ AI Agent │───▶│ Response │              │
│  │ Router   │    │ Processor│    │ Sender   │              │
│  └──────────┘    └──────────┘    └──────────┘              │
│        │              │               │                      │
│        ▼              ▼               ▼                      │
│  ┌─────────────────────────────────────────────┐           │
│  │           KNOWLEDGE SYSTEM                   │           │
│  │  [FAQ] [Errors] [Lessons] [Procedures]      │           │
│  └─────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### Nieuwe tabellen toevoegen aan bestaande migratie:

```sql
-- Support System Status
CREATE TABLE IF NOT EXISTS support_config (
  id TEXT PRIMARY KEY DEFAULT 'main',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'disabled')),
  pause_message TEXT,
  ai_enabled BOOLEAN DEFAULT TRUE,
  updated_at TEXT DEFAULT (datetime('now')),
  updated_by TEXT REFERENCES users(id)
);

-- Conversations
CREATE TABLE IF NOT EXISTS support_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  external_email TEXT,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'waiting', 'resolved', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to TEXT,
  tags TEXT, -- JSON array
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  resolved_at TEXT
);

-- Messages within conversations
CREATE TABLE IF NOT EXISTS support_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'ai', 'admin')),
  sender_id TEXT,
  content TEXT NOT NULL,
  metadata TEXT, -- JSON: ai_confidence, matched_knowledge, etc.
  created_at TEXT DEFAULT (datetime('now'))
);

-- Knowledge Base
CREATE TABLE IF NOT EXISTS knowledge_base (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('faq', 'procedure', 'error', 'feature', 'general')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  keywords TEXT, -- JSON array for search
  related_errors TEXT, -- JSON array of error codes
  usage_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  created_by TEXT REFERENCES users(id)
);

-- Lessons Learned
CREATE TABLE IF NOT EXISTS support_lessons (
  id TEXT PRIMARY KEY,
  conversation_id TEXT REFERENCES support_conversations(id),
  lesson_type TEXT NOT NULL CHECK (lesson_type IN ('solution', 'pattern', 'improvement', 'bug')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  action_taken TEXT,
  prevents_future BOOLEAN DEFAULT FALSE,
  knowledge_article_id TEXT REFERENCES knowledge_base(id),
  created_at TEXT DEFAULT (datetime('now')),
  created_by TEXT
);

-- Error Tracking
CREATE TABLE IF NOT EXISTS error_log (
  id TEXT PRIMARY KEY,
  error_code TEXT,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  user_id TEXT REFERENCES users(id),
  conversation_id TEXT REFERENCES support_conversations(id),
  frequency INTEGER DEFAULT 1,
  first_seen TEXT DEFAULT (datetime('now')),
  last_seen TEXT DEFAULT (datetime('now')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'investigating', 'known', 'fixed')),
  knowledge_article_id TEXT REFERENCES knowledge_base(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user ON support_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON support_conversations(status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON support_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_errors_code ON error_log(error_code);
```

## API Endpoints

### Admin Control Endpoints

```typescript
// GET /api/support/config
// Returns system status and configuration

// PUT /api/support/config
// Update system status (on/pause/off)
{
  status: 'active' | 'paused' | 'disabled',
  pause_message?: string,
  ai_enabled: boolean
}

// GET /api/support/stats
// Dashboard statistics
{
  open_conversations: number,
  avg_response_time: string,
  ai_resolution_rate: number,
  common_issues: Array<{topic: string, count: number}>
}
```

### Conversation Endpoints

```typescript
// POST /api/support/conversations
// Start new conversation
{
  subject: string,
  message: string,
  user_id?: string,  // If authenticated
  email?: string     // If anonymous
}
// Returns: { conversation_id: string, ... }

// GET /api/support/conversations/:id
// Get conversation with messages

// POST /api/support/conversations/:id/messages
// Add message to conversation
{
  content: string,
  sender_type: 'customer' | 'admin'
}

// PUT /api/support/conversations/:id
// Update conversation status/assignment
```

### Knowledge Base Endpoints

```typescript
// GET /api/support/knowledge
// Search knowledge base
// Query params: ?q=search&category=faq

// POST /api/support/knowledge
// Create knowledge article

// PUT /api/support/knowledge/:id
// Update article

// POST /api/support/knowledge/:id/feedback
// Mark article as helpful/not helpful
```

## AI Response System

### Prompt Template voor AI Agent

```typescript
const SUPPORT_AI_SYSTEM_PROMPT = `
Je bent de klantenservice AI voor "[PROJECT_NAAM]".

## Je Taken
1. Beantwoord klantvragen vriendelijk en behulpzaam
2. Gebruik de kennisbank om accurate antwoorden te geven
3. Escaleer naar een mens als je niet zeker bent
4. Log nieuwe problemen die niet in de kennisbank staan

## Kennisbank Context
{knowledge_context}

## Conversation History
{conversation_history}

## Huidige Vraag
{current_question}

## Response Format
Antwoord in het Nederlands, bondig maar volledig.
Als je niet zeker bent, zeg dat eerlijk en escaleer.

Bij technische problemen:
1. Vraag om specifieke error messages
2. Vraag welke stappen de klant al heeft geprobeerd
3. Geef stap-voor-stap instructies

Eindig altijd met:
- Vraag of dit het probleem oplost
- Bied aan om verder te helpen
`;
```

### AI Processing Flow

```typescript
async function processCustomerMessage(
  conversationId: string,
  message: string
): Promise<AIResponse> {
  // 1. Check system status
  const config = await getSupportConfig();
  if (config.status === 'disabled') {
    throw new Error('Support system is disabled');
  }
  if (config.status === 'paused') {
    return {
      type: 'system',
      content: config.pause_message || 'We zijn tijdelijk niet bereikbaar.'
    };
  }

  // 2. Load relevant knowledge
  const knowledge = await searchKnowledgeBase(message);

  // 3. Get conversation history
  const history = await getConversationHistory(conversationId);

  // 4. Generate AI response
  const aiResponse = await generateAIResponse({
    knowledge,
    history,
    currentMessage: message
  });

  // 5. Check confidence
  if (aiResponse.confidence < 0.7) {
    // Flag for human review
    await flagForReview(conversationId, 'low_confidence');
  }

  // 6. Log for learning
  await logInteraction({
    conversationId,
    message,
    response: aiResponse,
    knowledgeUsed: knowledge
  });

  return aiResponse;
}
```

## Admin Dashboard Components

### 1. System Control Panel

```astro
---
// /pages/admin/support.astro
---
<div class="support-control-panel">
  <h2>Support Systeem</h2>

  <!-- Status Toggle -->
  <div class="status-control">
    <label>Systeem Status</label>
    <select id="system-status">
      <option value="active">Actief</option>
      <option value="paused">Gepauzeerd</option>
      <option value="disabled">Uitgeschakeld</option>
    </select>
  </div>

  <!-- Pause Message -->
  <div class="pause-message" id="pause-message-section">
    <label>Pauze Bericht</label>
    <textarea id="pause-message">
      We zijn tijdelijk niet bereikbaar. Probeer het later opnieuw.
    </textarea>
  </div>

  <!-- AI Toggle -->
  <div class="ai-control">
    <label>
      <input type="checkbox" id="ai-enabled" checked />
      AI Automatisch Beantwoorden
    </label>
  </div>
</div>
```

### 2. Conversations Overview

```astro
<div class="conversations-list">
  <div class="filters">
    <select id="status-filter">
      <option value="all">Alle</option>
      <option value="open">Open</option>
      <option value="waiting">Wachtend</option>
      <option value="resolved">Opgelost</option>
    </select>
  </div>

  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Onderwerp</th>
        <th>Status</th>
        <th>Laatste Update</th>
        <th>Acties</th>
      </tr>
    </thead>
    <tbody id="conversations-body">
      <!-- Dynamically populated -->
    </tbody>
  </table>
</div>
```

### 3. Knowledge Base Manager

```astro
<div class="knowledge-manager">
  <div class="kb-header">
    <h3>Kennisbank</h3>
    <button id="add-article">+ Nieuw Artikel</button>
  </div>

  <div class="kb-categories">
    <button data-category="faq" class="active">FAQ</button>
    <button data-category="procedure">Procedures</button>
    <button data-category="error">Errors</button>
    <button data-category="feature">Features</button>
  </div>

  <div class="kb-articles" id="articles-list">
    <!-- Dynamically populated -->
  </div>
</div>
```

## Learning System

### Automatisch Lessen Extraheren

```typescript
async function extractLessons(conversationId: string) {
  const conversation = await getFullConversation(conversationId);

  // Analyze resolved conversations for patterns
  const analysis = await analyzeConversation(conversation);

  if (analysis.newPattern) {
    // Create new knowledge article
    await createKnowledgeArticle({
      category: analysis.category,
      title: analysis.suggestedTitle,
      content: analysis.suggestedContent,
      keywords: analysis.extractedKeywords
    });

    // Log the lesson
    await createLesson({
      conversation_id: conversationId,
      lesson_type: 'pattern',
      title: analysis.lessonTitle,
      description: analysis.lessonDescription
    });
  }

  if (analysis.isNewError) {
    await logError({
      error_code: analysis.errorCode,
      error_message: analysis.errorMessage,
      conversation_id: conversationId
    });
  }
}
```

## Implementation Phases

### Fase 1: Foundation (Week 1-2)
- [ ] Database migrations
- [ ] Basic API endpoints
- [ ] Admin config panel

### Fase 2: Conversations (Week 2-3)
- [ ] Conversation CRUD
- [ ] Message system
- [ ] Admin conversation view

### Fase 3: Knowledge Base (Week 3-4)
- [ ] Knowledge article management
- [ ] Search functionality
- [ ] Category organization

### Fase 4: AI Integration (Week 4-5)
- [ ] AI response generation
- [ ] Confidence scoring
- [ ] Escalation logic

### Fase 5: Learning System (Week 5-6)
- [ ] Pattern detection
- [ ] Automatic article suggestions
- [ ] Lesson logging

### Fase 6: Polish (Week 6-7)
- [ ] Dashboard analytics
- [ ] Email notifications
- [ ] Performance optimization

## Files to Create/Modify

### New Files
```
apps/auth-portal/
├── src/
│   ├── pages/
│   │   ├── admin/
│   │   │   └── support.astro           # Support admin dashboard
│   │   └── support/
│   │       ├── index.astro             # Customer support portal
│   │       └── [id].astro              # Conversation view
│   ├── components/
│   │   └── support/
│   │       ├── ConversationList.astro
│   │       ├── MessageThread.astro
│   │       ├── KnowledgeEditor.astro
│   │       └── SystemStatus.astro
│   └── lib/
│       └── support/
│           ├── api.ts                  # Support API functions
│           ├── ai.ts                   # AI response generation
│           └── learning.ts             # Pattern detection
├── migrations/
│   └── 0003_support_system.sql         # Database schema
```

### Modify Existing
```
apps/auth-portal/
├── src/
│   └── pages/
│       └── admin.astro                 # Add support link to admin nav
```

## Success Metrics

1. **Response Time**: < 30 seconds for AI responses
2. **Resolution Rate**: > 60% resolved by AI without escalation
3. **Customer Satisfaction**: Feedback system with > 80% helpful
4. **Knowledge Growth**: Automatic article creation from patterns
5. **Error Tracking**: All errors logged and categorized

## Agent Instructions

1. **Start met database migratie** - Dit is de basis
2. **Test elke fase** voordat je doorgaat naar de volgende
3. **Gebruik bestaande patronen** uit de codebase (auth, styling, etc.)
4. **Vraag om feedback** bij design beslissingen
5. **Log beslissingen** in `.context/DECISIONS.md`
6. **Commit regelmatig** met duidelijke messages

---

## Orchestratie Integratie

### Input Protocol

Je ontvangt taken via de orchestrator met dit format:
- **TaskId**: Unieke identifier om te tracken
- **Context**: Huidige fase van support systeem, bestaande code
- **Instructie**: Specifieke fase te implementeren (bijv. "Fase 1: Foundation")
- **Acceptatiecriteria**: Werkende endpoints, migraties succesvol, tests passen

### Output Protocol

Eindig ALTIJD met gestructureerde output:

```json
{
  "taskId": "[van input]",
  "status": "complete|partial|failed",
  "summary": "Support system Fase 1 geïmplementeerd",
  "artifacts": [
    "apps/auth-portal/migrations/0003_support_system.sql",
    "apps/auth-portal/src/pages/admin/support.astro",
    "apps/auth-portal/src/lib/support/api.ts"
  ],
  "implementation": {
    "phase": 1,
    "phaseName": "Foundation",
    "tablesCreated": ["support_config", "support_conversations"],
    "endpointsCreated": ["/api/support/config", "/api/support/stats"],
    "componentsCreated": ["SystemStatus.astro"]
  },
  "nextPhase": {
    "phase": 2,
    "name": "Conversations",
    "dependencies": ["Fase 1 complete"],
    "estimatedTasks": 3
  },
  "recommendations": [
    "Test admin dashboard handmatig",
    "Configureer support_config row in database"
  ],
  "blockers": []
}
```

### Phase Tracking

Rapporteer altijd welke fase is afgerond en wat de volgende fase vereist:

```json
{
  "phases": {
    "1_foundation": "complete",
    "2_conversations": "in_progress",
    "3_knowledge_base": "pending",
    "4_ai_integration": "pending",
    "5_learning_system": "pending",
    "6_polish": "pending"
  }
}
```

### State Awareness

- **LEES NIET** zelf de orchestrator state
- **SCHRIJF NIET** naar orchestrator-state.json
- **MAAK WEL** nieuwe files aan volgens implementation plan
- **LOG WEL** beslissingen in `.context/DECISIONS.md`
- Rapporteer alleen je resultaten—orchestrator verwerkt deze
