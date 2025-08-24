# VitePress Build Notes

## Double Curly Braces `{{` Issue

**Problem:** VitePress/Vue interprets double curly braces `{{ }}` as Vue template interpolation syntax, even inside markdown inline code blocks using backticks.

**Error Example:**
```
Error parsing JavaScript expression: Unexpected token, expected ","
```

**Solution:** Use `<code v-pre>` HTML tag instead of backticks for any code containing `{{`:

### Wrong (will break build):
```markdown
- 2D arrays: `{{1,2},{3,4}}` → `[[1,2],[3,4]]`
```

### Correct (works):
```markdown
- 2D arrays: <code v-pre>{{1,2},{3,4}}</code> → `[[1,2],[3,4]]`
```

**Note:** The `v-pre` directive tells Vue to skip compilation for this element, treating its content as raw text.

**Common scenarios requiring this fix:**
- PostgreSQL array literals: `{{1,2},{3,4}}`
- HTTP file variables: `{{host}}`
- Any text with double curly braces

## Quick Reference

| Syntax | Works? | Notes |
|--------|--------|-------|
| `` `{{foo}}` `` | No | Vue tries to parse as expression |
| `<code v-pre>{{foo}}</code>` | Yes | Correct approach |
| `{% raw %}{{foo}}{% endraw %}` | No | Jinja/Liquid syntax, not VitePress |
