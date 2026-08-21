const fs = require('fs');
const path = require('path');

const data = require('./precos_fornecedor.json');
const codes = data['73'];

let md = '# Preços de Custo - Fornecedor (SMS24H)\n\n';
md += '> **País:** Brasil (Código 73)\n';
md += '> **Data da Consulta:** ' + new Date().toLocaleString('pt-BR') + '\n\n';
md += '| Código do Serviço | Custo ($/R$) | Estoque Atual |\n';
md += '|---|---|---|\n';

const sorted = Object.entries(codes).sort((a, b) => a[1].cost - b[1].cost);

for (const [code, info] of sorted) {
  md += `| \`${code}\` | **${info.cost.toFixed(2)}** | ${info.count} |\n`;
}

const outputPath = 'C:\\Users\\RAFAE\\.gemini\\antigravity-ide\\brain\\a921398a-4876-4200-bd65-72c9f9c49044\\precos_fornecedor.md';
fs.writeFileSync(outputPath, md);
console.log('Artifact criado!');
