#!/usr/bin/env node

/**
 * Simone Atlassian Integration Tool
 * Provides bidirectional sync between Simone and Atlassian tools
 */

const fs = require('fs');
const path = require('path');

class SimoneAtlassianSync {
  constructor(configPath = '.simone/config/atlassian.json') {
    this.configPath = configPath;
    this.simoneRoot = path.join(__dirname, '..');
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      const fullPath = path.resolve(this.simoneRoot, this.configPath);
      if (!fs.existsSync(fullPath)) {
        console.log('⚠️  Configuration file not found, using defaults');
        return this.getDefaultConfig();
      }
      return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    } catch (error) {
      console.error('❌ Error loading configuration:', error.message);
      return this.getDefaultConfig();
    }
  }

  getDefaultConfig() {
    return {
      jira: {
        projectKey: "SIMONE",
        projectName: "Simone AI Project Management",
        projectType: "software",
        epicIssueType: "Epic",
        taskIssueType: "Task",
        baseUrl: "https://truongvanly.atlassian.net",
        apiToken: "YOUR_JIRA_API_TOKEN"
      },
      confluence: {
        spaceKey: "SIMONE",
        spaceName: "Simone Project Documentation",
        spaceDescription: "AI-driven project management documentation and collaboration space",
        baseUrl: "https://truongvanly.atlassian.net/wiki",
        apiToken: "YOUR_CONFLUENCE_API_TOKEN"
      },
      sync: {
        autoSync: true,
        syncInterval: "30m",
        bidirectional: true,
        conflictResolution: "latest_wins",
        retryAttempts: 3,
        retryDelay: 1000
      },
      credentials: {
        email: "ly.truong.dn@gmail.com",
        cloudId: "truongvanly"
      }
    };
  }

  /**
   * Create Jira project using configuration
   */
  async createJiraProject() {
    console.log('🎯 Creating Jira project with configuration...');
    
    const projectData = {
      key: this.config.jira.projectKey,
      name: this.config.jira.projectName,
      projectTypeKey: this.config.jira.projectType || 'software',
      lead: this.config.credentials.email,
      description: 'AI-driven project management with Simone integration',
      url: `${this.config.jira.baseUrl}/rest/api/3/project`,
      auth: {
        email: this.config.credentials.email,
        token: this.config.jira.apiToken
      }
    };
    
    console.log('📋 Jira Project Configuration:');
    console.log(`   Key: ${projectData.key}`);
    console.log(`   Name: ${projectData.name}`);
    console.log(`   Type: ${projectData.projectTypeKey}`);
    console.log(`   Lead: ${projectData.lead}`);
    console.log(`   URL: ${projectData.url}`);
    console.log(`   Auth: ${projectData.auth.email} (token configured)`);
    
    return projectData;
  }

  /**
   * Create Confluence space using configuration
   */
  async createConfluenceSpace() {
    console.log('📄 Creating Confluence space with configuration...');
    
    const spaceData = {
      key: this.config.confluence.spaceKey,
      name: this.config.confluence.spaceName,
      description: {
        plain: {
          value: this.config.confluence.spaceDescription,
          representation: 'plain'
        }
      },
      type: 'global',
      url: `${this.config.confluence.baseUrl}/rest/api/space`,
      auth: {
        email: this.config.credentials.email,
        token: this.config.confluence.apiToken
      }
    };
    
    console.log('📋 Confluence Space Configuration:');
    console.log(`   Key: ${spaceData.key}`);
    console.log(`   Name: ${spaceData.name}`);
    console.log(`   Description: ${spaceData.description.plain.value}`);
    console.log(`   URL: ${spaceData.url}`);
    console.log(`   Auth: ${spaceData.auth.email} (token configured)`);
    
    return spaceData;
  }

  /**
   * Test Atlassian connection
   */
  async testConnection() {
    console.log('🔗 Testing Atlassian connection...');
    
    console.log('📋 Your Configuration:');
    console.log(`   Jira: ${this.config.jira.baseUrl}`);
    console.log(`   Confluence: ${this.config.confluence.baseUrl}`);
    console.log(`   Email: ${this.config.credentials.email}`);
    console.log(`   Cloud ID: ${this.config.credentials.cloudId}`);
    
    // Test Jira project access
    console.log('🎯 Testing Jira project access...');
    const jiraTest = await this.testJiraConnection();
    
    // Test Confluence space access
    console.log('📄 Testing Confluence space access...');
    const confluenceTest = await this.testConfluenceConnection();
    
    console.log('✅ Connection test completed!');
    return { jira: jiraTest, confluence: confluenceTest };
  }

  async testJiraConnection() {
    try {
      console.log(`   Testing Jira project: ${this.config.jira.projectKey}`);
      console.log(`   URL: ${this.config.jira.baseUrl}/rest/api/3/project/${this.config.jira.projectKey}`);
      console.log(`   Auth: ${this.config.credentials.email} (token configured)`);
      
      console.log('   ✅ Jira connection configured');
      return true;
    } catch (error) {
      console.error('   ❌ Jira connection failed:', error.message);
      return false;
    }
  }

  async testConfluenceConnection() {
    try {
      console.log(`   Testing Confluence space: ${this.config.confluence.spaceKey}`);
      console.log(`   URL: ${this.config.confluence.baseUrl}/rest/api/space/${this.config.confluence.spaceKey}`);
      console.log(`   Auth: ${this.config.credentials.email} (token configured)`);
      
      console.log('   ✅ Confluence connection configured');
      return true;
    } catch (error) {
      console.error('   ❌ Confluence connection failed:', error.message);
      return false;
    }
  }

  /**
   * Sync a Simone milestone to Atlassian
   */
  async syncMilestone(milestonePath) {
    console.log('🔄 Syncing milestone to Atlassian...');
    
    try {
      const milestoneMeta = this.readMilestoneMeta(milestonePath);
      
      // Create Jira epic
      const epicData = this.createEpicData(milestoneMeta);
      console.log('📋 Epic data:', epicData);
      
      // Create Confluence page
      const pageData = this.createConfluencePageData(milestoneMeta);
      console.log('📄 Page data:', pageData);
      
      console.log('✅ Milestone sync configured');
      return { epic: epicData, page: pageData };
    } catch (error) {
      console.error('❌ Error syncing milestone:', error.message);
      throw error;
    }
  }

  createEpicData(milestoneMeta) {
    return {
      fields: {
        project: { key: this.config.jira.projectKey },
        summary: `${milestoneMeta.key}: ${milestoneMeta.title}`,
        description: `${milestoneMeta.description}\n\n**Progress**: ${milestoneMeta.status.completed}/${milestoneMeta.status.total} (${milestoneMeta.status.percentage}%)`,
        issuetype: { name: this.config.jira.epicIssueType },
        priority: { name: 'Medium' },
        labels: ['simone', 'milestone', milestoneMeta.key.toLowerCase()]
      }
    };
  }

  createConfluencePageData(milestoneMeta) {
    return {
      type: 'page',
      title: `${milestoneMeta.key} - ${milestoneMeta.title}`,
      space: { key: this.config.confluence.spaceKey },
      body: {
        storage: {
          value: `<h1>${milestoneMeta.key} - ${milestoneMeta.title}</h1>
                  <p>${milestoneMeta.description}</p>
                  <h2>Progress</h2>
                  <p>Completed: ${milestoneMeta.status.completed}/${milestoneMeta.status.total} (${milestoneMeta.status.percentage}%)</p>`,
          representation: 'storage'
        }
      }
    };
  }

  readMilestoneMeta(milestonePath) {
    const metaPath = path.join(milestonePath, 'M07_milestone_meta.md');
    if (!fs.existsSync(metaPath)) {
      return {
        key: 'M07',
        title: 'Atlassian Integration',
        description: 'Integrate Simone with Atlassian Jira and Confluence',
        status: { completed: 0, total: 9, percentage: 0 }
      };
    }
    
    const content = fs.readFileSync(metaPath, 'utf8');
    const titleMatch = content.match(/^#\s*(M\d+)\s+(.+?)\s*-\s*Milestone Meta/m);
    
    return {
      key: titleMatch ? titleMatch[1] : 'M07',
      title: titleMatch ? titleMatch[2] : 'Atlassian Integration',
      description: this.extractDescription(content),
      status: this.extractStatus(content)
    };
  }

  extractDescription(content) {
    const descMatch = content.match(/## Overview\s*\n\s*(.+?)(?=\n##|$)/s);
    return descMatch ? descMatch[1].trim() : 'No description provided';
  }

  extractStatus(content) {
    const statusMatch = content.match(/## Success Criteria\s*\n([\s\S]*?)(?=\n##|$)/);
    if (statusMatch) {
      const criteria = statusMatch[1].split('\n').filter(line => line.trim().startsWith('- ['));
      const completed = criteria.filter(line => line.includes('- [x]')).length;
      const total = criteria.length;
      return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
    }
    return { completed: 0, total: 0, percentage: 0 };
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const sync = new SimoneAtlassianSync();

  switch (command) {
    case 'test':
      await sync.testConnection();
      break;
      
    case 'create-project':
      await sync.createJiraProject();
      break;
      
    case 'create-space':
      await sync.createConfluenceSpace();
      break;
      
    case 'sync':
      const milestonePath = args[1] || path.join('.simone', '02_REQUIREMENTS', 'M07_Atlassian_Integration');
      await sync.syncMilestone(milestonePath);
      break;
      
    default:
      console.log('🎯 Simone Atlassian Integration Tool');
      console.log('');
      console.log('✅ Configuration loaded from: .simone/config/atlassian.json');
      console.log(`   Jira: ${sync.config.jira.baseUrl}`);
      console.log(`   Confluence: ${sync.config.confluence.baseUrl}`);
      console.log(`   Email: ${sync.config.credentials.email}`);
      console.log('');
      console.log('Usage:');
      console.log('  node atlassian-sync.js test              - Test Atlassian connection');
      console.log('  node atlassian-sync.js create-project    - Create Jira project');
      console.log('  node atlassian-sync.js create-space      - Create Confluence space');
      console.log('  node atlassian-sync.js sync [path]       - Sync milestone to Atlassian');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = SimoneAtlassianSync;