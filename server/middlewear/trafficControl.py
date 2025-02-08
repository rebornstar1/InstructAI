class CustomMiddleware:
    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        # This is where you can process the request before passing it to the Flask app
        print("Custom Middleware: Before request")
        
        # Call the Flask app and get the response
        response = self.app(environ, start_response)
        
        # You can process the response here if needed
        print("Custom Middleware: After request")
        
        return response