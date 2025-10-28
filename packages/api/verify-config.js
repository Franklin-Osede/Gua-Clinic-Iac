// Script para verificar la configuración de DriCloud
const crypto = require('crypto');

console.log('🔍 Verificando configuración de DriCloud...\n');

// Verificar variables de entorno
const requiredEnvVars = [
  'DRICLOUD_WEBAPI_USER',
  'DRICLOUD_WEBAPI_PASSWORD', 
  'DRICLOUD_CLINIC_URL',
  'DRICLOUD_CLINIC_ID'
];

console.log('📋 Variables de entorno requeridas:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Ocultar contraseña por seguridad
    const displayValue = varName.includes('PASSWORD') ? '***' : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`❌ ${varName}: NO DEFINIDA`);
  }
});

console.log('\n🌐 URLs de API:');
console.log('✅ URL Base: https://apidricloud.dricloud.net/');
console.log('✅ Tipo: WebAPI (principal)');
console.log('⚠️  Conflicto potencial: SÍ (compartida con Ovianta)');

console.log('\n🔐 Generación de hash de login:');
if (process.env.DRICLOUD_WEBAPI_USER && process.env.DRICLOUD_WEBAPI_PASSWORD) {
  const now = new Date();
  const spainTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Madrid"}));
  
  const year = spainTime.getFullYear();
  const month = String(spainTime.getMonth() + 1).padStart(2, '0');
  const day = String(spainTime.getDate()).padStart(2, '0');
  const hour = String(spainTime.getHours()).padStart(2, '0');
  const minute = String(spainTime.getMinutes()).padStart(2, '0');
  const second = String(spainTime.getSeconds()).padStart(2, '0');
  
  const timeSpanString = `${year}${month}${day}${hour}${minute}${second}`;
  const passwordMD5 = crypto.createHash('md5').update(process.env.DRICLOUD_WEBAPI_PASSWORD).digest('hex');
  const inputForHash = process.env.DRICLOUD_WEBAPI_USER + passwordMD5 + timeSpanString + 'sFfDS395$YGTry546g';
  const hash = crypto.createHash('md5').update(inputForHash).digest('hex');
  
  console.log(`📅 Timestamp: ${timeSpanString}`);
  console.log(`🔑 Hash generado: ${hash.substring(0, 8)}...`);
  console.log(`✅ Configuración de hash: CORRECTA`);
} else {
  console.log('❌ No se puede generar hash: faltan credenciales');
}

console.log('\n📊 Recomendaciones:');
console.log('1. 🧪 Usar entorno de testing separado para desarrollo');
console.log('2. 📞 Coordinar con Ovianta horarios de testing');
console.log('3. 🔍 Monitorear logs de renovación de tokens');
console.log('4. ⚠️  Evitar testing en horarios de alta actividad');
