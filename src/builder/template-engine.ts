/**
 * Simple template engine using string interpolation
 */
export class TemplateEngine {
  /**
   * Render a template with variables
   * Replaces {{variableName}} with values from data object
   */
  render(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? String(data[key]) : match;
    });
  }

  /**
   * Render a template with nested variables
   * Supports {{object.property}} syntax
   */
  renderAdvanced(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{([\w.]+)\}\}/g, (match, path) => {
      const value = this.getNestedProperty(data, path);
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Get nested property from object using dot notation
   */
  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Render template with conditional blocks
   * Supports {{#if variable}}...{{/if}} syntax
   * Handles nested conditionals recursively
   */
  renderWithConditionals(template: string, data: Record<string, any>): string {
    let result = template;
    let previousResult = '';

    // Keep processing until no more conditionals are found (handles nesting)
    while (result !== previousResult) {
      previousResult = result;

      // Match innermost if blocks first (non-greedy, no nested {{#if}} inside)
      result = result.replace(
        /\{\{#if\s+([\w.]+)\}\}((?:(?!\{\{#if)[\s\S])*?)\{\{\/if\}\}/g,
        (match, key, content) => {
          const value = this.getNestedProperty(data, key);
          return value ? content : '';
        }
      );
    }

    // Handle variable substitution
    result = this.renderAdvanced(result, data);

    return result;
  }

  /**
   * Render template with loops
   * Supports {{#each items}}...{{/each}} syntax
   */
  renderWithLoops(template: string, data: Record<string, any>): string {
    // Handle each blocks
    let result = template.replace(
      /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
      (match, key, content) => {
        const items = data[key];
        if (!Array.isArray(items)) return '';

        return items
          .map((item, index) => {
            // Process conditionals AND variables for each item
            return this.renderWithConditionals(content, {
              ...data,
              ...item,
              index,
              '@index': index,
            });
          })
          .join('');
      }
    );

    // Handle conditionals and variables outside loops
    result = this.renderWithConditionals(result, data);

    return result;
  }
}
