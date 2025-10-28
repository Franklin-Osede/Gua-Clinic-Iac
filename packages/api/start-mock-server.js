#!/usr/bin/env node

// Script para iniciar MockServer en modo desarrollo
const { GenericContainer } = require('testcontainers');
const { execSync } = require('child_process');
const path = require('path');

async function startMockServer() {
  let mockServer;
  
  try {
    console.log('🐳 Iniciando MockServer para desarrollo...\n');
    
    // 1. Verificar Docker
    console.log('1️⃣ Verificando Docker...');
    execSync('docker --version', { stdio: 'inherit' });
    console.log('✅ Docker disponible\n');
    
    // 2. Iniciar MockServer
    console.log('2️⃣ Iniciando MockServer container...');
    mockServer = await new GenericContainer('mockserver/mockserver:5.15.0')
      .withExposedPorts(1080)
      .withCopyFilesToContainer([
        {
          source: path.resolve(__dirname, 'test/mocks/dricloud-expectations.json'),
          target: '/config/expectations.json',
        },
      ])
      .withEnvironment({
        'MOCKSERVER_INITIALIZATION_JSON_PATH': '/config/expectations.json',
        'MOCKSERVER_SERVER_PORT': '1080'
      })
      .start();

    const mockServerUrl = `http://${mockServer.getHost()}:${mockServer.getMappedPort(1080)}`;
    console.log(`✅ MockServer running at: ${mockServerUrl}\n`);
    
    // 3. Configurar variables de entorno
    process.env.DRICLOUD_MOCK_URL = mockServerUrl;
    process.env.DRICLOUD_CLINIC_URL = 'test_clinic';
    process.env.NODE_ENV = 'development';
    process.env.DRICLOUD_MOCK_MODE = 'true';
    
    console.log('3️⃣ Configurando variables de entorno...');
    console.log(`   DRICLOUD_MOCK_URL: ${mockServerUrl}`);
    console.log(`   DRICLOUD_CLINIC_URL: test_clinic`);
    console.log(`   DRICLOUD_MOCK_MODE: true\n`);
    
    // 4. Iniciar API en modo desarrollo
    console.log('4️⃣ Iniciando API en modo desarrollo...');
    console.log('   Presiona Ctrl+C para detener el servidor\n');
    
    // Mantener el proceso vivo
    process.on('SIGINT', async () => {
      console.log('\n🛑 Deteniendo MockServer...');
      if (mockServer) {
        await mockServer.stop();
      }
      process.exit(0);
    });
    
    // Iniciar la API
    execSync('npm run start:dev', { stdio: 'inherit' });
    
  } catch (error) {
    console.error('❌ Error iniciando MockServer:', error.message);
    if (mockServer) {
      await mockServer.stop();
    }
    process.exit(1);
  }
}

startMockServer();
