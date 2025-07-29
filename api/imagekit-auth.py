import json
import hmac
import hashlib
import uuid
import time
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
            
            # Generate authentication parameters
            token = str(uuid.uuid4())
            expire = int(time.time()) + 2400  # 40 minutes
            
            # Create signature
            auth_string = f"{token}{expire}"
            signature = hmac.new(
                private_key.encode('utf-8'),
                auth_string.encode('utf-8'),
                hashlib.sha1
            ).hexdigest()
            
            response_data = {
                'token': token,
                'expire': expire,
                'signature': signature
            }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            error_response = {'error': str(e)}
            self.wfile.write(json.dumps(error_response).encode())

