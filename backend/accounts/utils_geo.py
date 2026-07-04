import requests # type: ignore

def get_client_ip(request):
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def get_country_currency_from_ip(ip):
    if not ip:
        return None, None

    try:
        res = requests.get(f"https://ipapi.co/{ip}/json/", timeout=3)
        data = res.json()
        return data.get("country_code"), data.get("currency")
    except:
        return None, None
