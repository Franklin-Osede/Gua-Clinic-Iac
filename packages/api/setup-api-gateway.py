#!/usr/bin/env python3
"""
Script para crear API Gateway con proxy al backend ECS
Resuelve el problema de Mixed Content (HTTPS → HTTP)
"""

import boto3
import sys
import json

REGION = "eu-north-1"
BACKEND_URL = "http://13.53.131.86:3000"  # URL del backend ECS
API_NAME = "gua-clinic-api-gateway"
STAGE_NAME = "prod"

def main():
    print("🚀 Configurando API Gateway para GUA Clinic...")
    
    # Inicializar cliente
    apigateway = boto3.client('apigateway', region_name=REGION)
    
    # 1. Crear o obtener REST API
    print("📝 Creando REST API...")
    try:
        response = apigateway.create_rest_api(
            name=API_NAME,
            description="API Gateway para GUA Clinic - Resuelve Mixed Content",
            endpointConfiguration={'types': ['REGIONAL']}
        )
        api_id = response['id']
        print(f"✅ API creada: {api_id}")
    except apigateway.exceptions.ConflictException:
        print("⚠️ La API ya existe, obteniendo ID...")
        apis = apigateway.get_rest_apis()
        for api in apis['items']:
            if api['name'] == API_NAME:
                api_id = api['id']
                print(f"✅ API encontrada: {api_id}")
                break
        else:
            print("❌ Error: No se pudo encontrar la API")
            sys.exit(1)
    
    # 2. Obtener Root Resource ID
    resources = apigateway.get_resources(restApiId=api_id)
    root_id = None
    for resource in resources['items']:
        if resource['path'] == '/':
            root_id = resource['id']
            break
    
    if not root_id:
        print("❌ Error: No se encontró root resource")
        sys.exit(1)
    
    print(f"✅ Root Resource ID: {root_id}")
    
    # 3. Función para crear endpoint
    def create_endpoint(path, method='GET'):
        print(f"📌 Configurando: {method} {path}")
        
        # Obtener o crear recurso
        path_parts = [p for p in path.split('/') if p]
        current_parent = root_id
        
        for part in path_parts:
            # Buscar si existe
            existing_resource = None
            for resource in resources.get('items', []):
                if resource['path'] == f"/{'/'.join(path_parts[:path_parts.index(part) + 1])}":
                    existing_resource = resource
                    break
            
            if existing_resource:
                current_parent = existing_resource['id']
            else:
                # Crear recurso
                try:
                    response = apigateway.create_resource(
                        restApiId=api_id,
                        parentId=current_parent,
                        pathPart=part
                    )
                    current_parent = response['id']
                    # Actualizar lista de recursos
                    resources = apigateway.get_resources(restApiId=api_id)
                except Exception as e:
                    print(f"  ⚠️ Error creando recurso {part}: {e}")
                    return
        
        resource_id = current_parent
        
        # Crear método si no existe
        try:
            apigateway.get_method(
                restApiId=api_id,
                resourceId=resource_id,
                httpMethod=method
            )
            print(f"  ⏭️  Método {method} ya existe para {path}")
        except apigateway.exceptions.NotFoundException:
            # Crear método
            apigateway.put_method(
                restApiId=api_id,
                resourceId=resource_id,
                httpMethod=method,
                authorizationType='NONE'
            )
            
            # Configurar integración HTTP Proxy
            apigateway.put_integration(
                restApiId=api_id,
                resourceId=resource_id,
                httpMethod=method,
                type='HTTP_PROXY',
                integrationHttpMethod=method,
                uri=f"{BACKEND_URL}{path}"
            )
            
            # Configurar respuesta 200 con CORS
            apigateway.put_method_response(
                restApiId=api_id,
                resourceId=resource_id,
                httpMethod=method,
                statusCode='200',
                responseParameters={
                    'method.response.header.Access-Control-Allow-Origin': False
                }
            )
            
            apigateway.put_integration_response(
                restApiId=api_id,
                resourceId=resource_id,
                httpMethod=method,
                statusCode='200',
                responseParameters={
                    'method.response.header.Access-Control-Allow-Origin': "'*'"
                }
            )
            
            print(f"  ✅ {method} {path} configurado")
    
    # 4. Crear endpoints principales
    endpoints = [
        ('/bootstrap', 'GET'),
        ('/bootstrap', 'POST'),
        ('/medical-specialties', 'GET'),
        ('/health', 'GET'),
    ]
    
    for path, method in endpoints:
        create_endpoint(path, method)
    
    # 5. Crear proxy catch-all para rutas dinámicas
    print("📌 Configurando proxy catch-all...")
    
    # Buscar {proxy+}
    proxy_resource = None
    for resource in resources.get('items', []):
        if resource['path'] == '/{proxy+}':
            proxy_resource = resource
            break
    
    if not proxy_resource:
        try:
            response = apigateway.create_resource(
                restApiId=api_id,
                parentId=root_id,
                pathPart='{proxy+}'
            )
            proxy_resource = response
        except Exception as e:
            print(f"  ⚠️ Error creando proxy: {e}")
    
    if proxy_resource:
        proxy_id = proxy_resource['id']
        try:
            apigateway.get_method(
                restApiId=api_id,
                resourceId=proxy_id,
                httpMethod='ANY'
            )
            print("  ⏭️  Proxy ANY ya existe")
        except:
            apigateway.put_method(
                restApiId=api_id,
                resourceId=proxy_id,
                httpMethod='ANY',
                authorizationType='NONE'
            )
            
            apigateway.put_integration(
                restApiId=api_id,
                resourceId=proxy_id,
                httpMethod='ANY',
                type='HTTP_PROXY',
                integrationHttpMethod='ANY',
                uri=f"{BACKEND_URL}/{{proxy}}"
            )
            
            print("  ✅ Proxy catch-all configurado")
    
    # 6. Desplegar API
    print("🚀 Desplegando API...")
    try:
        deployment = apigateway.create_deployment(
            restApiId=api_id,
            stageName=STAGE_NAME
        )
        print(f"✅ Deployment ID: {deployment['id']}")
    except Exception as e:
        print(f"⚠️ Intentando obtener deployment existente: {e}")
        # Intentar obtener deployments
        try:
            deployments = apigateway.get_deployments(restApiId=api_id)
            if deployments.get('items'):
                print(f"✅ Deployment encontrado: {deployments['items'][0]['id']}")
        except:
            pass
    
    # 7. Obtener URL final
    api_url = f"https://{api_id}.execute-api.{REGION}.amazonaws.com/{STAGE_NAME}"
    
    print("\n" + "="*50)
    print("✅ API Gateway configurado exitosamente")
    print("="*50)
    print(f"\n📋 Información:")
    print(f"   API ID: {api_id}")
    print(f"   Stage: {STAGE_NAME}")
    print(f"   Region: {REGION}")
    print(f"\n🌐 URL HTTPS del API Gateway:")
    print(f"   {api_url}")
    print(f"\n📝 Para usar en WordPress, actualiza el plugin con:")
    print(f"   api_url='{api_url}'")
    print(f"\n⚠️ IMPORTANTE: Actualiza el backend URL si cambia:")
    print(f"   BACKEND_URL='{BACKEND_URL}'")
    print(f"\n💡 Para verificar, prueba:")
    print(f"   curl {api_url}/health")
    print()
    
    return api_url

if __name__ == '__main__':
    try:
        api_url = main()
        # Guardar URL en archivo para uso posterior
        with open('/tmp/gua-api-gateway-url.txt', 'w') as f:
            f.write(api_url)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)





