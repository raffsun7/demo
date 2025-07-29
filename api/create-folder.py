import json
import requests
import base64
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_POST(self):
        try:
            # Load API configuration
            with open('api-config.json', 'r') as f:
                config = json.load(f)
            
            imagekit_config = config['imagekit']
            private_key = imagekit_config['private_key']
            
            # Parse request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            folder_name = request_data.get('folderName')
            parent_folder_path = request_data.get('parentFolderPath', '/')
            
            if not folder_name:
                raise ValueError('Folder name is required')
            
            # Create folder path
            if parent_folder_path == '/':
                folder_path = f"/{folder_name}"
            else:
                folder_path = f"{parent_folder_path.rstrip('/')}/{folder_name}"
            
            # ImageKit API call to create folder
            url = "https://api.imagekit.io/v1/folder"
            
            # Create basic auth header
            auth_string = f"{private_key}:"
            auth_bytes = auth_string.encode('ascii')
            auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
            
            headers = {
                'Authorization': f'Basic {auth_b64}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'folderName': folder_name,
                'parentFolderPath': parent_folder_path
            }
            
            response = requests.post(url, json=payload, headers=headers)
            
            if response.status_code == 201:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                result = {
                    'success': True,
                    'folder': response.json(),
                    'message': f'Folder "{folder_name}" created successfully'
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

