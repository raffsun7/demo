import json
import requests
import base64
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_DELETE(self):
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
            
            file_ids = request_data.get('fileIds', [])
            
            if not file_ids or not isinstance(file_ids, list):
                raise ValueError('File IDs array is required')
            
            # Create basic auth header
            auth_string = f"{private_key}:"
            auth_bytes = auth_string.encode('ascii')
            auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
            
            headers = {
                'Authorization': f'Basic {auth_b64}',
                'Content-Type': 'application/json'
            }
            
            # ImageKit API call to bulk delete files
            url = "https://api.imagekit.io/v1/files/batch/deleteByFileIds"
            payload = {
                'fileIds': file_ids
            }
            
            response = requests.delete(url, json=payload, headers=headers)
            
            if response.status_code == 200:
                result_data = response.json()
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                result = {
                    'success': True,
                    'message': f'Successfully deleted {len(file_ids)} files',
                    'details': result_data
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

