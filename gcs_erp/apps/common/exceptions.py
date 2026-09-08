from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Standard exception handler conforming to GCS ERP Section 5.1:
    {
        "success": false,
        "error": {
            "code": "ERROR_CODE",
            "message": "Human readable or detail error"
        }
    }
    """
    # Call REST framework's default exception handler first to get standard response
    response = exception_handler(exc, context)

    if response is not None:
        error_code = "API_ERROR"
        message = response.data

        # Determine error code based on status or exception type
        if response.status_code == status.HTTP_401_UNAUTHORIZED:
            error_code = "AUTHENTICATION_FAILED"
            if isinstance(response.data, dict) and 'detail' in response.data:
                message = response.data['detail']
            else:
                message = "Authentication credentials were not provided or are invalid."
        elif response.status_code == status.HTTP_403_FORBIDDEN:
            error_code = "PERMISSION_DENIED"
            if isinstance(response.data, dict) and 'detail' in response.data:
                message = response.data['detail']
            else:
                message = "You do not have permission to perform this action."
        elif response.status_code == status.HTTP_404_NOT_FOUND:
            error_code = "RESOURCE_NOT_FOUND"
            if isinstance(response.data, dict) and 'detail' in response.data:
                message = response.data['detail']
            else:
                message = "The requested resource was not found."
        elif response.status_code == status.HTTP_400_BAD_REQUEST:
            error_code = "VALIDATION_ERROR"
            # Format validation dictionary
            if isinstance(response.data, dict):
                if 'detail' in response.data:
                    message = response.data['detail']
                else:
                    message = response.data
        elif response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
            error_code = "RATE_LIMIT_EXCEEDED"
            message = "Request rate limit exceeded. Please retry later."
        else:
            error_code = f"HTTP_{response.status_code}_ERROR"

        response.data = {
            "success": False,
            "error": {
                "code": error_code,
                "message": message
            }
        }
        return response

    # Unhandled server errors (500)
    logger.exception(f"Unhandled exception in request: {exc}", exc_info=exc)
    return Response(
        {
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected server error occurred. Please contact system administrator."
            }
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
