import sys
import traceback
import logging
from django.http import HttpResponseServerError

logger = logging.getLogger("django.request")


class ProductionTracebackMiddleware:
    """
    Diagnostic middleware that logs exceptions and provides full tracebacks
    to authenticated superusers or requests with the diagnostic trace header.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_exception(self, request, exception):
        tb = traceback.format_exc()
        # Always log to stderr and django.request logger
        print(f"\n=== PRODUCTION 500 EXCEPTION AT {request.path} ===\n{tb}\n", file=sys.stderr, flush=True)
        logger.error("Production 500 at %s: %s", request.path, str(exception), exc_info=True)

        user = getattr(request, "user", None)
        is_super = getattr(user, "is_superuser", False)
        has_secret = request.META.get("HTTP_X_DEBUG_TRACE") == "urban-spice-trace-2026"

        if is_super or has_secret:
            body = (
                f"<!DOCTYPE html><html><body>"
                f"<h2>Production Debug Traceback: {exception.__class__.__name__}</h2>"
                f"<p><strong>Path:</strong> {request.path}</p>"
                f"<p><strong>Message:</strong> {str(exception)}</p>"
                f"<pre style='background:#f4f4f4;padding:15px;border:1px solid #ccc;font-size:13px;'>{tb}</pre>"
                f"</body></html>"
            )
            return HttpResponseServerError(body, content_type="text/html")

        return None
