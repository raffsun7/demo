import json
import requests
import base64
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
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
            
            folder_path = query_params.get('path', ['/'])[0]
            limit = int(query_params.get('limit', ['100'])[0])
            skip = int(query_params.get('skip', ['0'])[0])
            
            # Create basic auth header
            auth_string = f"{private_key}:"
            auth_bytes = auth_string.encode('ascii')
            auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
            
            headers = {
                'Authorization': f'Basic {auth_b64}'
            }
            
            # Get files
            files_url = f"https://api.imagekit.io/v1/files?path={folder_path}&limit={limit}&skip={skip}"
            files_response = requests.get(files_url, headers=headers)
            
            # Get folders
            folders_url = f"https://api.imagekit.io/v1/folder?path={folder_path}"
            folders_response = requests.get(folders_url, headers=headers)
            
            if files_response.status_code == 200:
                files_data = files_response.json()
                folders_data = folders_response.json() if folders_response.status_code == 200 else []
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                result = {
                    'success': True,
                    'files': files_data,
                    'folders': folders_data,
                    'currentPath': folder_path
                }
                self.wfile.write(json.dumps(result).encode())
            else:
                raise Exception(f'ImageKit API error: {files_response.text}')
                
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

