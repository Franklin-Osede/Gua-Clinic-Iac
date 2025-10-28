#!/usr/bin/env node

// Script de Testing Inmediato para DriCloud
// Ejecutar: node testing-script.js

const axios = require('axios');

const API_BASE = 'http://localhost:3000';

async function testDriCloudIntegration() {
  console.log('🧪 INICIANDO TESTING DE DRICLOUD');
  console.log('=====================================\n');

  try {
    // 1. Verificar estado de tokens
    console.log('1️⃣ Verificando estado de tokens...');
    const tokenStats = await axios.get(`${API_BASE}/token-stats`);
    console.log('📊 Estado actual:', JSON.stringify(tokenStats.data, null, 2));
    console.log('');

    // 2. Test de especialidades médicas
    console.log('2️⃣ Probando especialidades médicas...');
    const specialties = await axios.get(`${API_BASE}/medical-specialties`);
    console.log('✅ Especialidades obtenidas:', specialties.data.length, 'especialidades');
    console.log('📋 Primera especialidad:', specialties.data[0]);
    console.log('');

    // Esperar 30 segundos (rate limiting)
    console.log('⏳ Esperando 30 segundos (rate limiting)...');
    await new Promise(resolve => setTimeout(resolve, 30000));

    // 3. Test de doctores
    console.log('3️⃣ Probando doctores...');
    const doctors = await axios.get(`${API_BASE}/doctors/1`);
    console.log('✅ Doctores obtenidos:', doctors.data.length, 'doctores');
    console.log('👨‍⚕️ Primer doctor:', doctors.data[0]);
    console.log('');

    // Esperar 30 segundos
    console.log('⏳ Esperando 30 segundos...');
    await new Promise(resolve => setTimeout(resolve, 30000));

    // 4. Test de disponibilidad
    console.log('4️⃣ Probando disponibilidad...');
    const today = new Date().toISOString().split('T')[0];
    const availability = await axios.get(`${API_BASE}/doctor-availability/1/${today}`);
    console.log('✅ Disponibilidad obtenida para doctor 1');
    console.log('📅 Fecha:', today);
    console.log('');

    // 5. Estado final de tokens
    console.log('5️⃣ Estado final de tokens...');
    const finalStats = await axios.get(`${API_BASE}/token-stats`);
    console.log('📊 Estado final:', JSON.stringify(finalStats.data, null, 2));

    console.log('\n🎉 TESTING COMPLETADO EXITOSAMENTE');
    console.log('=====================================');

  } catch (error) {
    console.error('❌ ERROR EN TESTING:', error.message);
    if (error.response) {
      console.error('📄 Respuesta:', error.response.data);
    }
  }
}

// Ejecutar testing
testDriCloudIntegration();
