import json
import requests
import base64
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_GET(self):
        try:
            # Load API configuration
            with open('api-config.json', 'r') as f:
                config = json.load(f)
            
            imagekit_config = config['imagekit']
            private_key = imagekit_config['private_key']
            
            # Parse query parameters
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)
            
            search_query = query_params.get('q', [''])[0]
            tags = query_params.get('tags', [])
            limit = int(query_params.get('limit', ['50'])[0])
            skip = int(query_params.get('skip', ['0'])[0])
            
            # Create basic auth header
            auth_string = f"{private_key}:"
            auth_bytes = auth_string.encode('ascii')
            auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
            
            headers = {
                'Authorization': f'Basic {auth_b64}'
            }
            
            # Build search URL
            search_params = []
            if search_query:
                search_params.append(f'name="{search_query}"')
            if tags:
                for tag in tags:
                    search_params.append(f'tags="{tag}"')
            
            search_string = ' AND '.join(search_params) if search_params else ''
            
            url = f"https://api.imagekit.io/v1/files?searchQuery={search_string}&limit={limit}&skip={skip}"
            
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                result_data = response.json()
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                result = {
                    'success': True,
                    'files': result_data,
                    'query': search_query,
                    'tags': tags,
                    'total': len(result_data)
                }
                self.wfile.write(json.dumps(result).encode())
            else:
                raise Exception(f'ImageKit API error: {response.text}')
                
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            error_response = {
                'success': False,
                'error': str(e)
            }
            self.wfile.write(json.dumps(error_response).encode())

