#!/usr/bin/env node

// Script para ejecutar tests con Docker Test Containers
const { execSync } = require('child_process');

console.log('🐳 Iniciando Docker Test Containers para DriCloud...\n');

try {
  // 1. Verificar que Docker está corriendo
  console.log('1️⃣ Verificando Docker...');
  execSync('docker --version', { stdio: 'inherit' });
  console.log('✅ Docker disponible\n');

  // 2. Instalar dependencias
  console.log('2️⃣ Instalando dependencias...');
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencias instaladas\n');

  // 3. Ejecutar tests de integración
  console.log('3️⃣ Ejecutando tests de integración...');
  execSync('npm run test:integration', { stdio: 'inherit' });
  console.log('✅ Tests completados\n');

  console.log('🎉 Docker Test Containers ejecutados exitosamente!');

} catch (error) {
  console.error('❌ Error ejecutando Docker Test Containers:', error.message);
  process.exit(1);
}
