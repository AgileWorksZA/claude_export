# Claude Export to Markdown Converter

This script converts Claude AI export data (JSON format) to readable Markdown files.

## Overview

The converter processes Claude's official export format and generates well-formatted Markdown files for each conversation and project. It's adapted from Simon Willison's Claude JSON to Markdown converter but enhanced for batch processing of local export files.

## Files Structure

```
claude_export/
├── claude_export_data/          # Your exported Claude data
│   ├── conversations.json       # All your conversations
│   ├── projects.json           # Your Claude projects  
│   └── users.json              # User information
├── convert-to-markdown.js      # The conversion script
├── markdown_output/            # Generated markdown files
│   ├── 000_projects.md         # All projects in one file
│   ├── 001_conversation_name.md # Individual conversations
│   ├── 002_conversation_name.md
│   └── ...
└── README.md                   # This file
```

## Usage

### Quick Start
```bash
cd /path/to/claude_export
node convert-to-markdown.js
```

### What it does
1. **Reads** all conversations from `claude_export_data/conversations.json`
2. **Converts** each conversation to a separate Markdown file
3. **Processes** projects from `claude_export_data/projects.json` into one file
4. **Preserves** all message content, attachments, and metadata
5. **Creates** numbered files for easy browsing

### Output Features

- **📝 Clean Markdown**: Proper headers, formatting, and structure
- **👤🤖 Message Attribution**: Clear sender identification with icons
- **📎 Attachment Handling**: Embedded file contents with syntax highlighting
- **⏰ Timestamps**: Readable dates and times
- **🔍 Metadata**: UUIDs, creation dates, and other useful info
- **📁 File Organization**: Numbered files (001, 002, etc.) for easy sorting

### File Naming Convention

- `000_projects.md` - All Claude projects (always first)
- `001_conversation_title.md` - Individual conversations
- Numbers are zero-padded for proper sorting
- Special characters in titles are replaced with underscores
- Long titles are truncated to 200 characters

## Export Format Details

The script handles Claude's export JSON structure:

### Conversations
- **uuid**: Unique conversation identifier
- **name**: Conversation title
- **created_at/updated_at**: Timestamps
- **chat_messages**: Array of message objects
  - **sender**: "human" or "assistant"
  - **content**: Array of content objects (text, attachments, etc.)
  - **attachments**: File attachments with extracted content

### Projects
- **name**: Project title
- **description**: Project description
- **docs**: Project documents with content
- **is_private**: Privacy setting
- **prompt_template**: Custom prompt templates

## Customization

You can modify the script to:

- **Change output format**: Edit the markdown generation functions
- **Filter conversations**: Add date ranges or keyword filters
- **Adjust file naming**: Modify the `sanitizeFilename()` function
- **Add metadata**: Include additional fields in the output
- **Syntax highlighting**: Extend the `typeLookup` object for more file types

## Dependencies

- **Node.js**: Version 12+ (uses built-in modules only)
- **No external packages required**

## Troubleshooting

### Common Issues

1. **"Cannot find module" error**
   - Ensure you're running from the correct directory
   - Make sure Node.js is installed

2. **"Permission denied" error**
   - Run: `chmod +x convert-to-markdown.js`

3. **Empty output directory**
   - Check that `claude_export_data/conversations.json` exists
   - Verify the JSON file is valid

4. **Garbled text in output**
   - The script handles UTF-8 encoding automatically
   - Check your terminal/editor encoding settings

### Validation

To verify your export data structure:
```bash
# Check if JSON is valid
node -e "console.log('Valid JSON:', !!JSON.parse(require('fs').readFileSync('claude_export_data/conversations.json')))"

# Count conversations
node -e "console.log('Conversations:', JSON.parse(require('fs').readFileSync('claude_export_data/conversations.json')).length)"
```

## Advanced Usage

### Batch Processing Multiple Exports
If you have multiple Claude exports, create separate directories and run the converter in each:

```bash
for dir in export_*/; do
  cd "$dir"
  node ../convert-to-markdown.js
  cd ..
done
```

### Integration with Documentation Systems
The generated Markdown files work well with:

- **Static site generators** (Jekyll, Hugo, MkDocs)
- **Documentation platforms** (GitBook, Notion import)
- **Knowledge bases** (Obsidian, Logseq)
- **Version control** (Git repositories)

## Contributing

This script is adapted from Simon Willison's work and enhanced for local batch processing. Feel free to modify it for your specific needs.

## Credits

- Based on [Simon Willison's Claude JSON to Markdown converter](https://observablehq.com/@simonw/convert-claude-json-to-markdown)
- Enhanced for Claude's official export format
- Optimized for batch processing and local file handling