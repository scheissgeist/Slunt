#!/usr/bin/env node
/**
 * Slunt Data Analyzer - CLI Tool
 * Run: node analyze.js
 */

const DataAnalyzer = require('./src/analysis/DataAnalyzer');

console.log('🔍 Slunt Data Analyzer v1.0\n');

const analyzer = new DataAnalyzer('./data');

analyzer.analyze().then(results => {
  if (results) {
    console.log('✅ Analysis complete!\n');
    
    // Ask if user wants detailed export
    console.log('📄 Full report saved to: data/analysis_report.json');
    analyzer.exportResults();
  } else {
    console.log('❌ Analysis failed. Check data directory.');
  }
}).catch(error => {
  console.error('❌ Fatal error:', error);
});
