#!/usr/bin/env python3
import zipfile
import os
from pathlib import Path

# Directorio del plugin
plugin_dir = Path(__file__).parent
desktop = Path.home() / "Desktop"
zip_path = desktop / "gua-clinic-widget-FINAL-v1.0.1.zip"

# Archivos a incluir
files = [
    "gua-clinic-widget.php",
    "gua-widget.iife.js",
    "readme.txt"
]

print("📦 Creando ZIP del plugin...")

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for file in files:
        file_path = plugin_dir / file
        if file_path.exists():
            zipf.write(file_path, file)
            print(f"  ✅ {file} agregado")
        else:
            print(f"  ⚠️  {file} no encontrado")

zip_size = zip_path.stat().st_size / (1024 * 1024)  # MB
print(f"\n✅ ZIP creado exitosamente")
print(f"   Ubicación: {zip_path}")
print(f"   Tamaño: {zip_size:.2f} MB")
