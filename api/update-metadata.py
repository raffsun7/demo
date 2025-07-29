import json
import requests
import base64
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'PUT, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_PUT(self):
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
            
            file_id = request_data.get('fileId')
            tags = request_data.get('tags', [])
            custom_coordinates = request_data.get('customCoordinates')
            
            if not file_id:
                raise ValueError('File ID is required')
            
            # Create basic auth header
            auth_string = f"{private_key}:"
            auth_bytes = auth_string.encode('ascii')
            auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
            
            headers = {
                'Authorization': f'Basic {auth_b64}',
                'Content-Type': 'application/json'
            }
            
            # Prepare payload
            payload = {}
            if tags:
                payload['tags'] = tags
            if custom_coordinates:
                payload['customCoordinates'] = custom_coordinates
            
            # ImageKit API call to update file details
            url = f"https://api.imagekit.io/v1/files/{file_id}/details"
            response = requests.patch(url, json=payload, headers=headers)
            
            if response.status_code == 200:
                result_data = response.json()
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                result = {
                    'success': True,
                    'message': 'File metadata updated successfully',
                    'file': result_data
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

