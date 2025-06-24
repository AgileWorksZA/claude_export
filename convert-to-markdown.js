#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// File type lookup for syntax highlighting
const typeLookup = {
  "application/vnd.ant.react": "jsx",
  "text/html": "html",
  "application/javascript": "javascript",
  "text/css": "css",
  "application/json": "json"
};

// Escape HTML characters for markdown
function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>"']/g, function (match) {
    const entityMap = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return entityMap[match];
  });
}

// Convert Claude JSON conversation to Markdown
function convertClaudeJsonToMarkdown(conversation) {
  if (!conversation.chat_messages) {
    return "";
  }
  
  const bits = [];
  
  // Add conversation title and metadata
  bits.push(`# ${conversation.name || 'Untitled Conversation'}`);
  bits.push(`**Created:** ${new Date(conversation.created_at).toLocaleString()}`);
  bits.push(`**Updated:** ${new Date(conversation.updated_at).toLocaleString()}`);
  bits.push(`**UUID:** ${conversation.uuid}`);
  bits.push('---');

  conversation.chat_messages.forEach((message) => {
    // Add message header with sender and timestamp
    const timestamp = new Date(message.created_at).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
    
    const senderIcon = message.sender === 'human' ? '👤' : '🤖';
    bits.push(`## ${senderIcon} ${message.sender.charAt(0).toUpperCase() + message.sender.slice(1)}`);
    bits.push(`*${timestamp}*`);

    // Handle message content
    if (message.content && message.content.length > 0) {
      message.content.forEach((content) => {
        if (content.type === "text" && content.text) {
          bits.push(content.text);
        }
      });
    } else if (message.text) {
      // Fallback to message.text if no content array
      bits.push(message.text);
    }

    // Handle attachments
    if (message.attachments && message.attachments.length > 0) {
      bits.push("### 📎 Attachments");
      message.attachments.forEach((attachment) => {
        bits.push(`<details>`);
        bits.push(`<summary>${attachment.file_name} (${attachment.file_size} bytes, ${attachment.file_type})</summary>`);
        
        if (attachment.extracted_content) {
          // Determine file type for syntax highlighting
          const extension = path.extname(attachment.file_name).toLowerCase().slice(1);
          const language = typeLookup[attachment.file_type] || extension || 'text';
          
          bits.push('');
          bits.push(`\`\`\`${language}`);
          bits.push(attachment.extracted_content);
          bits.push('```');
        }
        
        bits.push(`</details>`);
      });
    }

    // Handle files (if different from attachments)
    if (message.files && message.files.length > 0) {
      message.files.forEach((file) => {
        bits.push(`**File:** ${file.file_name}`);
      });
    }

    bits.push('---');
  });

  return bits.join('\n\n');
}

// Sanitize filename for file system
function sanitizeFilename(filename) {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 200); // Limit length
}

// Main conversion function
function convertExportToMarkdown() {
  const dataDir = path.join(__dirname, 'claude_export_data');
  const outputDir = path.join(__dirname, 'markdown_output');
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    // Load conversations
    const conversationsPath = path.join(dataDir, 'conversations.json');
    const conversationsData = fs.readFileSync(conversationsPath, 'utf8');
    const conversations = JSON.parse(conversationsData);

    console.log(`Found ${conversations.length} conversations to convert...`);

    // Convert each conversation
    conversations.forEach((conversation, index) => {
      try {
        const markdown = convertClaudeJsonToMarkdown(conversation);
        
        // Create safe filename
        const baseName = sanitizeFilename(conversation.name || `conversation_${index + 1}`);
        const filename = `${String(index + 1).padStart(3, '0')}_${baseName}.md`;
        const outputPath = path.join(outputDir, filename);
        
        // Write markdown file
        fs.writeFileSync(outputPath, markdown, 'utf8');
        console.log(`✅ Converted: ${conversation.name} -> ${filename}`);
        
      } catch (error) {
        console.error(`❌ Error converting conversation ${index + 1}:`, error.message);
      }
    });

    // Also convert projects if they exist
    const projectsPath = path.join(dataDir, 'projects.json');
    if (fs.existsSync(projectsPath)) {
      const projectsData = fs.readFileSync(projectsPath, 'utf8');
      const projects = JSON.parse(projectsData);
      
      console.log(`\nFound ${projects.length} projects to convert...`);
      
      const projectsMarkdown = convertProjectsToMarkdown(projects);
      const projectsOutputPath = path.join(outputDir, '000_projects.md');
      fs.writeFileSync(projectsOutputPath, projectsMarkdown, 'utf8');
      console.log(`✅ Converted projects -> 000_projects.md`);
    }

    console.log(`\n🎉 Conversion complete! Check the '${outputDir}' directory for markdown files.`);
    
  } catch (error) {
    console.error('❌ Error during conversion:', error.message);
    process.exit(1);
  }
}

// Convert projects to markdown
function convertProjectsToMarkdown(projects) {
  const bits = [];
  bits.push('# Claude Projects');
  bits.push('');
  
  projects.forEach((project) => {
    bits.push(`## ${project.name}`);
    bits.push(`**Created:** ${new Date(project.created_at).toLocaleString()}`);
    bits.push(`**Updated:** ${new Date(project.updated_at).toLocaleString()}`);
    bits.push(`**Private:** ${project.is_private ? 'Yes' : 'No'}`);
    bits.push(`**UUID:** ${project.uuid}`);
    
    if (project.description) {
      bits.push('');
      bits.push('**Description:**');
      bits.push(project.description);
    }
    
    if (project.prompt_template) {
      bits.push('');
      bits.push('**Prompt Template:**');
      bits.push('```');
      bits.push(project.prompt_template);
      bits.push('```');
    }
    
    if (project.docs && project.docs.length > 0) {
      bits.push('');
      bits.push('### 📄 Documents');
      
      project.docs.forEach((doc) => {
        bits.push(`#### ${doc.filename}`);
        bits.push(`*Created: ${new Date(doc.created_at).toLocaleString()}*`);
        bits.push('');
        
        // Determine file type for syntax highlighting
        const extension = path.extname(doc.filename).toLowerCase().slice(1);
        const language = extension === 'md' ? 'markdown' : extension || 'text';
        
        bits.push(`\`\`\`${language}`);
        bits.push(doc.content);
        bits.push('```');
        bits.push('');
      });
    }
    
    bits.push('---');
    bits.push('');
  });
  
  return bits.join('\n');
}

// Run the conversion
if (require.main === module) {
  convertExportToMarkdown();
}

module.exports = { convertClaudeJsonToMarkdown, convertProjectsToMarkdown };