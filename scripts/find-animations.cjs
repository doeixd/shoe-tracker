#!/usr/bin/env node

/**
 * Animation Detection Script
 *
 * This script scans your codebase to find existing Framer Motion animations
 * and helps you identify where to apply first-visit animation patterns.
 *
 * Run with: node scripts/find-animations.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  srcDir: 'src',
  extensions: ['.tsx', '.ts', '.jsx', '.js'],
  outputFile: 'animation-audit.md',
  excludeDirs: ['node_modules', '.git', 'dist', 'build', '.next'],
};

// Animation patterns to search for
const animationPatterns = [
  {
    name: 'motion.div',
    regex: /<motion\.div[^>]*>/g,
    description: 'Motion div components'
  },
  {
    name: 'motion components',
    regex: /<motion\.\w+[^>]*>/g,
    description: 'Any motion component'
  },
  {
    name: 'initial prop',
    regex: /initial\s*=\s*\{[^}]*\}/g,
    description: 'Components with initial animation prop'
  },
  {
    name: 'animate prop',
    regex: /animate\s*=\s*\{[^}]*\}/g,
    description: 'Components with animate prop'
  },
  {
    name: 'transition prop',
    regex: /transition\s*=\s*\{[^}]*\}/g,
    description: 'Components with transition prop'
  },
  {
    name: 'framer-motion import',
    regex: /import.*from.*["'](?:framer-motion|motion\/react)["']/g,
    description: 'Files importing framer-motion'
  }
];

// Results storage
const results = {
  files: [],
  summary: {
    totalFiles: 0,
    filesWithAnimations: 0,
    totalMatches: 0,
    patternCounts: {}
  }
};

/**
 * Check if file should be processed
 */
function shouldProcessFile(filePath) {
  const ext = path.extname(filePath);
  return config.extensions.includes(ext);
}

/**
 * Check if directory should be excluded
 */
function shouldExcludeDir(dirPath) {
  const dirName = path.basename(dirPath);
  return config.excludeDirs.includes(dirName);
}

/**
 * Scan file for animation patterns
 */
function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);

    const fileResult = {
      path: relativePath,
      matches: [],
      hasAnimations: false
    };

    // Check each pattern
    animationPatterns.forEach(pattern => {
      const matches = content.match(pattern.regex);
      if (matches) {
        fileResult.hasAnimations = true;
        fileResult.matches.push({
          pattern: pattern.name,
          description: pattern.description,
          count: matches.length,
          examples: matches.slice(0, 3) // Keep first 3 examples
        });

        // Update summary
        results.summary.totalMatches += matches.length;
        results.summary.patternCounts[pattern.name] =
          (results.summary.patternCounts[pattern.name] || 0) + matches.length;
      }
    });

    if (fileResult.hasAnimations) {
      results.files.push(fileResult);
      results.summary.filesWithAnimations++;
    }

    results.summary.totalFiles++;

  } catch (error) {
    console.warn(`Warning: Could not read file ${filePath}:`, error.message);
  }
}

/**
 * Recursively scan directory
 */
function scanDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);

    items.forEach(item => {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        if (!shouldExcludeDir(itemPath)) {
          scanDirectory(itemPath);
        }
      } else if (stat.isFile() && shouldProcessFile(itemPath)) {
        scanFile(itemPath);
      }
    });
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dirPath}:`, error.message);
  }
}

/**
 * Generate markdown report
 */
function generateReport() {
  const { files, summary } = results;

  let report = `# Animation Audit Report

Generated on: ${new Date().toISOString()}

## Summary

- **Total files scanned**: ${summary.totalFiles}
- **Files with animations**: ${summary.filesWithAnimations}
- **Total animation matches**: ${summary.totalMatches}

## Pattern Distribution

| Pattern | Count | Description |
|---------|-------|-------------|
`;

  // Add pattern counts
  Object.entries(summary.patternCounts).forEach(([pattern, count]) => {
    const patternInfo = animationPatterns.find(p => p.name === pattern);
    report += `| ${pattern} | ${count} | ${patternInfo?.description || 'N/A'} |\n`;
  });

  report += `
## Migration Recommendations

### High Priority Files (Most animations)

`;

  // Sort files by animation count
  const sortedFiles = [...files].sort((a, b) => {
    const aCount = a.matches.reduce((sum, match) => sum + match.count, 0);
    const bCount = b.matches.reduce((sum, match) => sum + match.count, 0);
    return bCount - aCount;
  });

  // Show top 10 files
  sortedFiles.slice(0, 10).forEach(file => {
    const totalMatches = file.matches.reduce((sum, match) => sum + match.count, 0);
    report += `#### ${file.path} (${totalMatches} animations)\n\n`;

    file.matches.forEach(match => {
      report += `- **${match.pattern}**: ${match.count} instances\n`;
      if (match.examples.length > 0) {
        report += `  \`\`\`tsx\n`;
        match.examples.forEach(example => {
          report += `  ${example.trim()}\n`;
        });
        report += `  \`\`\`\n`;
      }
    });
    report += '\n';
  });

  report += `
## Implementation Guide

### Step 1: Import the Hook

Add this import to files with animations:

\`\`\`tsx
import { useFirstVisit, getAnimationProps } from '~/hooks/useFirstVisit';
\`\`\`

### Step 2: Use the Hook

Add the hook at the component level:

\`\`\`tsx
function MyComponent() {
  const { isFirstVisit } = useFirstVisit();

  // ... rest of component
}
\`\`\`

### Step 3: Update Motion Components

**Before:**
\`\`\`tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
\`\`\`

**After:**
\`\`\`tsx
<motion.div
  {...getAnimationProps(isFirstVisit, {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  })}
>
\`\`\`

### Alternative: Use ConditionalMotion

\`\`\`tsx
import { ConditionalMotion } from '~/components/ui/ConditionalMotion';

<ConditionalMotion
  firstVisitAnimation={{
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  }}
>
  Content
</ConditionalMotion>
\`\`\`

## All Files with Animations

`;

  // List all files
  files.forEach(file => {
    const totalMatches = file.matches.reduce((sum, match) => sum + match.count, 0);
    report += `### ${file.path}\n\n`;
    report += `**Total animations**: ${totalMatches}\n\n`;

    file.matches.forEach(match => {
      report += `- ${match.pattern}: ${match.count}\n`;
    });
    report += '\n';
  });

  report += `
## Next Steps

1. **Review high-priority files** listed above
2. **Start with route-level components** (pages in src/routes/)
3. **Test each migration** by visiting routes and checking animations
4. **Use development controls** to reset visits during testing
5. **Consider accessibility** and reduced motion preferences

## Development Commands

\`\`\`bash
# Reset all visits for testing
localStorage.removeItem('visited_routes');

# Or use the hook's reset functions
const { resetVisit, clearAllVisits } = useFirstVisit();
\`\`\`

---

*Report generated by find-animations.js*
`;

  return report;
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Scanning for animations...');

  const srcPath = path.join(process.cwd(), config.srcDir);

  if (!fs.existsSync(srcPath)) {
    console.error(`❌ Source directory not found: ${srcPath}`);
    console.error('Make sure you\'re running this from the project root.');
    process.exit(1);
  }

  // Scan the source directory
  scanDirectory(srcPath);

  // Generate and save report
  const report = generateReport();
  const outputPath = path.join(process.cwd(), config.outputFile);

  try {
    fs.writeFileSync(outputPath, report, 'utf8');
    console.log('✅ Animation audit complete!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   - Files scanned: ${results.summary.totalFiles}`);
    console.log(`   - Files with animations: ${results.summary.filesWithAnimations}`);
    console.log(`   - Total animations found: ${results.summary.totalMatches}`);
    console.log('');
    console.log(`📄 Report saved to: ${config.outputFile}`);
    console.log('');
    console.log('🚀 Next steps:');
    console.log('   1. Review the generated report');
    console.log('   2. Start with high-priority files');
    console.log('   3. Follow the migration guide in FIRST_VISIT_ANIMATIONS.md');

  } catch (error) {
    console.error('❌ Failed to save report:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  scanDirectory,
  scanFile,
  generateReport,
  config
};
