from rest_framework.renderers import JSONRenderer


class EnvelopeJSONRenderer(JSONRenderer):
    """
    Standard DRF JSONRenderer enforcing Section 5.1 Response Envelope:
    Success: { "success": true, "data": { ... }, "message": "..." }
    Error:   { "success": false, "error": { "code": "...", "message": "..." } }
    """
    def render(self, data, accepted_media_type=None, renderer_context=None):
        if renderer_context is None:
            return super().render(data, accepted_media_type, renderer_context)

        response = renderer_context.get('response')
        status_code = response.status_code if response else 200

        # Don't re-wrap if it's swagger/openapi schema or already enveloped
        view = renderer_context.get('view')
        if getattr(view, '_ignore_envelope', False):
            return super().render(data, accepted_media_type, renderer_context)

        # Check if already shaped as envelope
        if isinstance(data, dict) and ('success' in data and ('data' in data or 'error' in data)):
            return super().render(data, accepted_media_type, renderer_context)

        if 200 <= status_code < 300:
            message = "Operation completed successfully"
            actual_data = data
            if isinstance(data, dict) and 'message' in data and len(data) == 1:
                message = data['message']
                actual_data = None
            elif isinstance(data, dict) and '_message' in data:
                message = data.pop('_message')

            envelope = {
                "success": True,
                "data": actual_data,
                "message": message
            }
        else:
            # Error responses
            error_code = "REQUEST_FAILED"
            error_msg = "An error occurred during request processing."

            if isinstance(data, dict):
                error_code = data.get('code', f"HTTP_{status_code}_ERROR")
                if 'detail' in data:
                    error_msg = data['detail']
                elif 'message' in data:
                    error_msg = data['message']
                elif 'error' in data:
                    if isinstance(data['error'], dict):
                        return super().render({"success": False, "error": data['error']}, accepted_media_type, renderer_context)
                    error_msg = str(data['error'])
                else:
                    # Serializer validation errors
                    error_msg = data
                    error_code = "VALIDATION_ERROR"
            elif isinstance(data, list):
                error_msg = data
                error_code = "VALIDATION_ERROR"
            elif data:
                error_msg = str(data)

            envelope = {
                "success": False,
                "error": {
                    "code": error_code,
                    "message": error_msg
                }
            }

        return super().render(envelope, accepted_media_type, renderer_context)
