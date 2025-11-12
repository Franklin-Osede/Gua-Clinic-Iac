#!/usr/bin/env node

/**
 * Script para optimizar imágenes de doctores
 * Reduce el tamaño de las imágenes de ~12MB a ~200-500KB
 * 
 * Requiere: npm install -D sharp
 * Uso: node optimize-doctor-images.js
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_DIR = path.join(__dirname, 'public/doctors');
const OUTPUT_DIR = path.join(__dirname, 'public/doctors-optimized');

// Configuración de optimización
const OPTIMIZATION_CONFIG = {
  // Para PNG: convertir a WebP con calidad 80
  png: {
    format: 'webp',
    quality: 80,
    maxWidth: 800, // Máximo 800px de ancho
    maxHeight: 800, // Máximo 800px de alto
  },
  // Para JPG: optimizar y convertir a WebP
  jpg: {
    format: 'webp',
    quality: 80,
    maxWidth: 800,
    maxHeight: 800,
  },
  jpeg: {
    format: 'webp',
    quality: 80,
    maxWidth: 800,
    maxHeight: 800,
  },
};

async function optimizeImage(inputPath, outputPath) {
  try {
    const ext = path.extname(inputPath).toLowerCase().slice(1);
    const config = OPTIMIZATION_CONFIG[ext] || OPTIMIZATION_CONFIG.jpg;
    
    const stats = await fs.stat(inputPath);
    const originalSize = stats.size;
    
    console.log(`📸 Optimizando: ${path.basename(inputPath)} (${(originalSize / 1024 / 1024).toFixed(2)} MB)`);
    
    let image = sharp(inputPath);
    
    // Obtener metadata para redimensionar si es necesario
    const metadata = await image.metadata();
    const needsResize = metadata.width > config.maxWidth || metadata.height > config.maxHeight;
    
    if (needsResize) {
      image = image.resize(config.maxWidth, config.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }
    
    // Convertir a WebP con calidad optimizada
    await image
      .webp({ quality: config.quality })
      .toFile(outputPath);
    
    const optimizedStats = await fs.stat(outputPath);
    const optimizedSize = optimizedStats.size;
    const reduction = ((1 - optimizedSize / originalSize) * 100).toFixed(1);
    
    console.log(`✅ Optimizado: ${path.basename(outputPath)} (${(optimizedSize / 1024 / 1024).toFixed(2)} MB) - Reducción: ${reduction}%`);
    
    return {
      original: originalSize,
      optimized: optimizedSize,
      reduction: parseFloat(reduction),
    };
  } catch (error) {
    console.error(`❌ Error optimizando ${inputPath}:`, error.message);
    return null;
  }
}

async function main() {
  try {
    // Crear directorio de salida
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    
    // Leer todos los archivos de imágenes
    const files = await fs.readdir(INPUT_DIR);
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.png', '.jpg', '.jpeg'].includes(ext);
    });
    
    console.log(`🚀 Encontradas ${imageFiles.length} imágenes para optimizar\n`);
    
    const results = [];
    let totalOriginal = 0;
    let totalOptimized = 0;
    
    for (const file of imageFiles) {
      const inputPath = path.join(INPUT_DIR, file);
      const outputName = path.basename(file, path.extname(file)) + '.webp';
      const outputPath = path.join(OUTPUT_DIR, outputName);
      
      const result = await optimizeImage(inputPath, outputPath);
      if (result) {
        results.push({ file, ...result });
        totalOriginal += result.original;
        totalOptimized += result.optimized;
      }
    }
    
    console.log('\n📊 Resumen:');
    console.log(`   Total original: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Total optimizado: ${(totalOptimized / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Reducción total: ${((1 - totalOptimized / totalOriginal) * 100).toFixed(1)}%`);
    console.log(`\n✅ Imágenes optimizadas guardadas en: ${OUTPUT_DIR}`);
    console.log(`\n💡 Próximos pasos:`);
    console.log(`   1. Revisa las imágenes optimizadas`);
    console.log(`   2. Si están bien, reemplaza las originales:`);
    console.log(`      cp -r public/doctors-optimized/* public/doctors/`);
    console.log(`   3. O sube las optimizadas a Cloudflare R2`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();

