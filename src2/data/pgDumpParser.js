import fs from 'fs';
import path from 'path';

// Parse PostgreSQL COPY ... FROM stdin blocks
export function parsePgDump(sqlContent) {
  const tables = {};
  const copyRegex = /COPY\s+public\.([a-z_0-9]+)\s*\(([^)]+)\)\s+FROM\s+stdin;([\s\S]*?)\\\./g;
  
  let match;
  while ((match = copyRegex.exec(sqlContent)) !== null) {
    const tableName = match[1];
    const columns = match[2].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    const rowsRaw = match[3].trim().split('\n');
    
    const rows = [];
    for (const rawLine of rowsRaw) {
      if (!rawLine.trim() || rawLine.trim() === '\\.') continue;
      const values = rawLine.split('\t').map(val => {
        if (val === '\\N') return null;
        // Unescape \n, \t
        return val.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
      });
      
      const rowObj = {};
      columns.forEach((col, idx) => {
        rowObj[col] = values[idx] !== undefined ? values[idx] : null;
      });
      rows.push(rowObj);
    }
    tables[tableName] = rows;
  }
  return tables;
}
