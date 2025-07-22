import random
import string

def generate_random_id(length=16):
    """Generate a random string ID."""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def generate_random_color():
    """Generate a random hex color."""
    return f"#{random.randint(0, 0xFFFFFF):06x}"
