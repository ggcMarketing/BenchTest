import { createLogger } from '../../../shared/utils/logger.js';
import { query } from '../../../shared/utils/db-client.js';

const logger = createLogger('trigger-engine');

export class TriggerEngine {
  constructor() {
    this.rules = new Map(); // Map<ruleId, rule>
    this.lastValues = new Map(); // Map<channelId, lastValue>
    this.activeFiles = new Map(); // Map<ruleId, fileId>
  }

  /**
   * Load storage rules from database
   */
  async loadRules() {
    try {
      const result = await query(
        'SELECT * FROM storage_rules WHERE enabled = true'
      );

      this.rules.clear();
      for (const rule of result.rows) {
        this.rules.set(rule.id, {
          ...rule,
          config: rule.config
        });
      }

      logger.info(`Loaded ${this.rules.size} storage rules`);
    } catch (error) {
      logger.error('Error loading storage rules:', error);
    }
  }

  /**
   * Evaluate if data should be stored
   */
  shouldStore(ruleId, channelId, value, timestamp) {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    // Check if channel is in rule
    if (!rule.channels.includes(channelId)) return false;

    switch (rule.mode) {
      case 'continuous':
        return this.evaluateContinuous(rule, channelId, value, timestamp);
      
      case 'change':
        return this.evaluateChange(rule, channelId, value);
      
      case 'event':
        return this.evaluateEvent(rule, channelId, value);
      
      case 'trigger':
        return this.evaluateTrigger(rule, channelId, value);
      
      default:
        return false;
    }
  }

  /**
   * Evaluate continuous logging
   */
  evaluateContinuous(rule, channelId, value, timestamp) {
    const config = rule.config.continuous || {};
    const interval = config.interval || 1000;

    const lastKey = `${rule.id}:${channelId}`;
    const lastTime = this.lastValues.get(lastKey) || 0;

    if (timestamp - lastTime >= interval) {
      this.lastValues.set(lastKey, timestamp);
      return true;
    }

    return false;
  }

  /**
   * Evaluate change-based logging
   */
  evaluateChange(rule, channelId, value) {
    const config = rule.config.change || {};
    const deadband = config.deadband || 0;

    const lastKey = `${rule.id}:${channelId}`;
    const lastValue = this.lastValues.get(lastKey);

    if (lastValue === undefined) {
      this.lastValues.set(lastKey, value);
      return true;
    }

    const change = Math.abs(value - lastValue);
    if (change >= deadband) {
      this.lastValues.set(lastKey, value);
      return true;
    }

    return false;
  }

  /**
   * Evaluate event-based logging
   */
  evaluateEvent(rule, channelId, value) {
    const config = rule.config.event || {};
    const trigger = config.trigger;

    if (!trigger) return false;

    if (trigger.type === 'signal') {
      if (trigger.channel === channelId) {
        if (trigger.condition === 'rising_edge') {
          const lastKey = `${rule.id}:${channelId}`;
          const lastValue = this.lastValues.get(lastKey) || 0;
          this.lastValues.set(lastKey, value);
          return lastValue === 0 && value === 1;
        }
        if (trigger.condition === 'falling_edge') {
          const lastKey = `${rule.id}:${channelId}`;
          const lastValue = this.lastValues.get(lastKey) || 0;
          this.lastValues.set(lastKey, value);
          return lastValue === 1 && value === 0;
        }
      }
    }

    return false;
  }

  /**
   * Evaluate custom trigger formula
   */
  evaluateTrigger(rule, channelId, value) {
    // TODO: Implement formula evaluation
    logger.warn('Custom trigger formulas not yet implemented');
    return false;
  }

  /**
   * Get rules for a channel
   */
  getRulesForChannel(channelId) {
    const rules = [];
    for (const [ruleId, rule] of this.rules) {
      if (rule.channels.includes(channelId)) {
        rules.push({ ruleId, rule });
      }
    }
    return rules;
  }

  /**
   * Start file-based logging for a rule
   */
  startFileLogging(ruleId, fileId) {
    this.activeFiles.set(ruleId, fileId);
    logger.info(`File logging started for rule ${ruleId}: ${fileId}`);
  }

  /**
   * Stop file-based logging for a rule
   */
  stopFileLogging(ruleId) {
    const fileId = this.activeFiles.get(ruleId);
    if (fileId) {
      this.activeFiles.delete(ruleId);
      logger.info(`File logging stopped for rule ${ruleId}`);
      return fileId;
    }
    return null;
  }

  /**
   * Get active file for a rule
   */
  getActiveFile(ruleId) {
    return this.activeFiles.get(ruleId);
  }

  /**
   * Clear cached values
   */
  clearCache() {
    this.lastValues.clear();
    logger.info('Trigger engine cache cleared');
  }
}
