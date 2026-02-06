/**
 * Support AI Service
 *
 * Handles AI-powered triage, response generation, and learning
 * for the support system.
 */

import type { Database, SupportPattern, SupportConversation, KnowledgeArticle } from './database';

export interface TriageResult {
  category: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  confidence: number;

  // Auto-response if possible
  canAutoRespond: boolean;
  suggestedResponse: string | null;
  matchedPattern: SupportPattern | null;

  // Help resources
  suggestedArticles: KnowledgeArticle[];
  similarConversations: SupportConversation[];

  // For learning
  extractedKeywords: string[];
  detectedErrorCodes: string[];
}

export interface PatternMatch {
  pattern: SupportPattern;
  confidence: number;
  matchedKeywords: string[];
}

export interface PatternSuggestion {
  name: string;
  trigger_keywords: string[];
  category: string;
  response_template_nl: string;
  response_template_en: string;
  confidence: number;
  based_on_conversation_id: string;
}

export interface ConversationContext {
  conversation: SupportConversation;
  messages: { sender_type: string; content: string }[];
  user: {
    id: string;
    email: string;
    name: string | null;
    plan: string;
    preferredLanguage: 'nl' | 'en';
  };
}

/**
 * Keywords that indicate urgency
 */
const URGENCY_KEYWORDS = {
  high: ['urgent', 'dringend', 'asap', 'immediately', 'critical', 'production', 'productie', 'down', 'broken', 'kapot'],
  low: ['question', 'vraag', 'wondering', 'curious', 'feature request', 'suggestion', 'suggestie'],
};

/**
 * Category keywords for automatic categorization
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  connection: ['connection', 'verbinding', 'connect', 'disconnect', 'oauth', 'token', 'expired', 'verlopen', 'MCP', 'API key'],
  billing: ['billing', 'factuur', 'invoice', 'payment', 'betaling', 'subscription', 'abonnement', 'plan', 'upgrade', 'limiet', 'limit', 'quota'],
  bug: ['bug', 'error', 'fout', 'crash', 'broken', 'kapot', 'not working', 'werkt niet', '500', '404', '401', '403'],
  feature: ['feature', 'functie', 'request', 'suggestion', 'suggestie', 'would be nice', 'zou fijn zijn', 'can you add', 'kun je toevoegen'],
  account: ['account', 'profile', 'profiel', 'settings', 'instellingen', 'password', 'wachtwoord', 'email'],
};

/**
 * Common error code patterns
 */
const ERROR_CODE_PATTERNS = [
  /\b(4\d{2}|5\d{2})\b/g,  // HTTP status codes
  /error[_\s-]?code[:\s]+(\w+)/gi,  // error_code: XXX
  /\[(ERR_\w+)\]/g,  // [ERR_XXX]
  /\b(ECONNREFUSED|ETIMEDOUT|ENOTFOUND)\b/gi,  // Node.js errors
];

export class SupportAI {
  constructor(private db: Database) {}

  /**
   * Analyze an incoming message and provide triage information
   */
  async analyzeMessage(content: string, context?: ConversationContext): Promise<TriageResult> {
    const lowerContent = content.toLowerCase();

    // Extract keywords
    const extractedKeywords = this.extractKeywords(lowerContent);

    // Detect error codes
    const detectedErrorCodes = this.detectErrorCodes(content);

    // Determine category
    const category = this.determineCategory(lowerContent, extractedKeywords);

    // Determine priority
    const priority = this.determinePriority(lowerContent, detectedErrorCodes);

    // Find matching patterns
    const patterns = await this.db.getActivePatterns();
    const matches = this.matchPatterns(content, patterns);

    // Find suggested articles
    const suggestedArticles = await this.findRelevantArticles(extractedKeywords, context?.user?.preferredLanguage || 'nl');

    // Determine if we can auto-respond
    const bestMatch = matches[0];
    const canAutoRespond = bestMatch && bestMatch.confidence >= bestMatch.pattern.min_confidence;

    // Generate response if we have a good match
    let suggestedResponse: string | null = null;
    if (canAutoRespond && bestMatch) {
      const lang = context?.user?.preferredLanguage || 'nl';
      suggestedResponse = this.generateResponse(bestMatch.pattern, context, lang);
    }

    return {
      category,
      priority,
      confidence: bestMatch?.confidence || 0,
      canAutoRespond,
      suggestedResponse,
      matchedPattern: bestMatch?.pattern || null,
      suggestedArticles: suggestedArticles.slice(0, 3),
      similarConversations: [], // TODO: Implement similarity search
      extractedKeywords,
      detectedErrorCodes,
    };
  }

  /**
   * Extract keywords from message content
   */
  private extractKeywords(content: string): string[] {
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);

    // Remove common stop words
    const stopWords = new Set([
      'the', 'and', 'for', 'that', 'with', 'have', 'this', 'from', 'they',
      'het', 'een', 'van', 'dat', 'met', 'voor', 'zijn', 'niet', 'maar',
      'kan', 'naar', 'ook', 'bij', 'dan', 'nog', 'wel', 'wat', 'als',
    ]);

    return [...new Set(words.filter(w => !stopWords.has(w)))];
  }

  /**
   * Detect error codes in message
   */
  private detectErrorCodes(content: string): string[] {
    const codes: string[] = [];

    for (const pattern of ERROR_CODE_PATTERNS) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        codes.push(match[1] || match[0]);
      }
    }

    return [...new Set(codes)];
  }

  /**
   * Determine the category based on content
   */
  private determineCategory(content: string, keywords: string[]): string {
    let bestCategory = 'other';
    let bestScore = 0;

    for (const [category, categoryKeywords] of Object.entries(CATEGORY_KEYWORDS)) {
      let score = 0;
      for (const keyword of categoryKeywords) {
        if (content.includes(keyword.toLowerCase())) {
          score += 1;
        }
      }
      // Also check extracted keywords
      for (const kw of keywords) {
        if (categoryKeywords.some(ck => ck.toLowerCase().includes(kw) || kw.includes(ck.toLowerCase()))) {
          score += 0.5;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }

    return bestCategory;
  }

  /**
   * Determine priority based on content and error codes
   */
  private determinePriority(content: string, errorCodes: string[]): 'low' | 'normal' | 'high' | 'urgent' {
    // Check for urgent keywords
    for (const keyword of URGENCY_KEYWORDS.high) {
      if (content.includes(keyword)) {
        return 'high';
      }
    }

    // Check for low-priority keywords
    for (const keyword of URGENCY_KEYWORDS.low) {
      if (content.includes(keyword)) {
        return 'low';
      }
    }

    // 5xx errors are high priority
    if (errorCodes.some(code => code.startsWith('5'))) {
      return 'high';
    }

    return 'normal';
  }

  /**
   * Match content against patterns
   */
  matchPatterns(content: string, patterns: SupportPattern[]): PatternMatch[] {
    const matches: PatternMatch[] = [];
    const lowerContent = content.toLowerCase();

    for (const pattern of patterns) {
      const keywords = JSON.parse(pattern.trigger_keywords) as string[];
      const matchedKeywords: string[] = [];

      // Check keyword matches
      for (const keyword of keywords) {
        if (lowerContent.includes(keyword.toLowerCase())) {
          matchedKeywords.push(keyword);
        }
      }

      // Check regex if present
      let regexMatch = false;
      if (pattern.trigger_regex) {
        try {
          const regex = new RegExp(pattern.trigger_regex, 'i');
          regexMatch = regex.test(content);
        } catch {
          // Invalid regex, ignore
        }
      }

      // Check error codes if present
      let errorCodeMatch = false;
      if (pattern.error_codes) {
        const patternCodes = JSON.parse(pattern.error_codes) as string[];
        const contentCodes = this.detectErrorCodes(content);
        errorCodeMatch = patternCodes.some(pc => contentCodes.includes(pc));
      }

      // Calculate confidence
      if (matchedKeywords.length > 0 || regexMatch || errorCodeMatch) {
        let confidence = 0;

        // Keyword match contributes 0-0.6
        confidence += Math.min(matchedKeywords.length / keywords.length, 1) * 0.6;

        // Regex match contributes 0.2
        if (regexMatch) confidence += 0.2;

        // Error code match contributes 0.2
        if (errorCodeMatch) confidence += 0.2;

        matches.push({
          pattern,
          confidence: Math.min(confidence, 1),
          matchedKeywords,
        });
      }
    }

    // Sort by confidence descending
    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Find relevant articles based on keywords
   */
  private async findRelevantArticles(keywords: string[], lang: 'nl' | 'en'): Promise<KnowledgeArticle[]> {
    const articles: KnowledgeArticle[] = [];

    // Search for each keyword and combine results
    for (const keyword of keywords.slice(0, 5)) { // Limit to first 5 keywords
      const found = await this.db.searchArticles(keyword, lang);
      for (const article of found) {
        if (!articles.some(a => a.id === article.id)) {
          articles.push(article);
        }
      }
    }

    return articles.slice(0, 5); // Return top 5
  }

  /**
   * Generate a response based on a pattern
   */
  generateResponse(pattern: SupportPattern, context: ConversationContext | undefined, lang: 'nl' | 'en'): string {
    let template = lang === 'en' && pattern.response_template_en
      ? pattern.response_template_en
      : pattern.response_template_nl;

    // Replace variables in template
    if (context) {
      template = template
        .replace(/\{\{user_name\}\}/g, context.user.name || context.user.email.split('@')[0])
        .replace(/\{\{user_email\}\}/g, context.user.email)
        .replace(/\{\{user_plan\}\}/g, context.user.plan);
    }

    return template;
  }

  /**
   * Learn from a resolved conversation
   */
  async learnFromResolution(conversation: SupportConversation, wasHelpful: boolean): Promise<void> {
    // Track pattern usage if a pattern was matched
    if (conversation.matched_pattern_id) {
      await this.db.trackPatternUsage(conversation.matched_pattern_id, wasHelpful);
    }
  }

  /**
   * Suggest a new pattern based on a successfully resolved conversation
   */
  async suggestPattern(conversation: SupportConversation): Promise<PatternSuggestion | null> {
    // Get conversation messages
    const data = await this.db.getConversationWithMessages(conversation.id);
    if (!data || data.messages.length < 2) return null;

    // Get the first user message and the admin response that resolved it
    const userMessage = data.messages.find(m => m.sender_type === 'user');
    const adminResponse = data.messages.find(m => m.sender_type === 'admin');

    if (!userMessage || !adminResponse) return null;

    // Extract keywords from user message
    const keywords = this.extractKeywords(userMessage.content.toLowerCase());

    // Only suggest if we have meaningful keywords
    if (keywords.length < 3) return null;

    // Create suggestion
    return {
      name: `Pattern from #${conversation.id.slice(0, 8)}`,
      trigger_keywords: keywords.slice(0, 10), // Top 10 keywords
      category: conversation.category || 'other',
      response_template_nl: adminResponse.content,
      response_template_en: '', // Admin can translate later
      confidence: 0.6,
      based_on_conversation_id: conversation.id,
    };
  }

  /**
   * Format article suggestions as a message
   */
  formatArticleSuggestions(articles: KnowledgeArticle[], lang: 'nl' | 'en'): string {
    if (articles.length === 0) return '';

    const header = lang === 'en'
      ? 'Here are some articles that might help:'
      : 'Hier zijn enkele artikelen die kunnen helpen:';

    const links = articles.map(article => {
      const title = lang === 'en' && article.title_en ? article.title_en : article.title_nl;
      return `- [${title}](/support/articles/${article.slug})`;
    }).join('\n');

    return `${header}\n\n${links}`;
  }
}
