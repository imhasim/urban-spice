import logging
from decimal import Decimal
import razorpay
from django.conf import settings

logger = logging.getLogger(__name__)


def is_razorpay_configured() -> bool:
    """Check if Razorpay credentials are set to non-placeholder values."""
    key_id = getattr(settings, "RAZORPAY_KEY_ID", "")
    key_secret = getattr(settings, "RAZORPAY_KEY_SECRET", "")
    if not key_id or not key_secret:
        return False
    if "replace_me" in key_id.lower() or "replace_me" in key_secret.lower():
        return False
    return True


def get_razorpay_client() -> razorpay.Client:
    """Initialize and return the official Razorpay client."""
    key_id = getattr(settings, "RAZORPAY_KEY_ID", "")
    key_secret = getattr(settings, "RAZORPAY_KEY_SECRET", "")
    if not key_id or not key_secret:
        raise ValueError(
            "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required. "
            "Please configure valid credentials in backend/.env."
        )
    return razorpay.Client(auth=(key_id, key_secret))


def create_razorpay_order_for_order(order) -> dict:
    """
    Creates a Razorpay order for an existing Urban Spice Order instance.
    Calculates the payable amount strictly on the server from order.total_amount.
    Razorpay amounts are in paise (1 INR = 100 paise).
    """
    if not is_razorpay_configured():
        raise ValueError(
            "Razorpay Test Mode credentials are not configured or are set to placeholder values. "
            "Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env."
        )

    client = get_razorpay_client()
    # Amount calculated on server in paise
    amount_in_paise = int(round(Decimal(str(order.total_amount)) * 100))

    if amount_in_paise <= 0:
        raise ValueError("Order total amount must be greater than zero.")

    payload = {
        "amount": amount_in_paise,
        "currency": "INR",
        "receipt": order.order_number,
        "notes": {
            "order_id": str(order.id),
            "order_number": order.order_number,
            "customer_name": order.customer_name,
            "customer_phone": order.customer_phone,
            "order_type": order.order_type,
        },
    }

    rzp_order = client.order.create(data=payload)
    order.razorpay_order_id = rzp_order["id"]
    order.save(update_fields=["razorpay_order_id", "updated_at"])

    return {
        "razorpay_order_id": rzp_order["id"],
        "amount": amount_in_paise,
        "currency": "INR",
        "key_id": settings.RAZORPAY_KEY_ID,
    }


def verify_razorpay_signature(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
) -> bool:
    """
    Verifies payment signature using official Razorpay Python SDK utility.
    Raises razorpay.errors.SignatureVerificationError if signature is invalid.
    """
    client = get_razorpay_client()
    params = {
        "razorpay_order_id": razorpay_order_id,
        "razorpay_payment_id": razorpay_payment_id,
        "razorpay_signature": razorpay_signature,
    }
    client.utility.verify_payment_signature(params)
    return True
