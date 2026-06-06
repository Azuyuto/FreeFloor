import os
import requests
from time import sleep

# ------------ KONFIGURACJA ------------
PIXABAY_API_KEY = "10461993-7d2cb4cc1ed7bebb05fa028d3"
API_URL = "https://pixabay.com/api/"
# Lista instrumentów: klucz=fraza do wyszukania, wartość=nazwa docelowego pliku (bez rozszerzenia)
instruments = {
    "Warszawa", "Kraków", "Łódź", "Wrocław", "Poznań",
    "Gdańsk", "Szczecin", "Bydgoszcz", "Lublin", "Katowice",
    "Białystok", "Gdynia", "Częstochowa", "Radom", "Sosnowiec",
    "Toruń", "Kielce", "Rzeszów", "Olsztyn", "Opole",
    "Elbląg", "Płock", "Zielona Góra", "Gorzów Wielkopolski", "Wałbrzych",
    "Legnica", "Zabrze", "Bytom", "Tychy", "Koszalin"
}
CATEGORY_FOLDER = "Superbohaterowie"
PER_PAGE = 5    # pobieramy 3 wyniki, weźmiemy pierwszy
DELAY = 0.5     # opóźnienie między zapytaniami (sekundy)

# ------------ FUNKCJE ------------
def fetch_image_url(query: str) -> str:
    """Wyszukuje w Pixabay i zwraca URL pierwszego obrazka."""
    params = {
        "key": PIXABAY_API_KEY,
        "q": query,
        "image_type": "photo",
        "per_page": PER_PAGE,
        "safesearch": "true"
    }
    resp = requests.get(API_URL, params=params, timeout=10)
    resp.raise_for_status()
    hits = resp.json().get("hits", [])
    if not hits:
        raise ValueError(f"Brak wyników dla zapytania: {query}")
    return hits[4]["largeImageURL"]

def download_image(img_url: str, dest_path: str):
    """Pobiera obrazek i zapisuje do pliku."""
    resp = requests.get(img_url, timeout=10)
    resp.raise_for_status()
    with open(dest_path, "wb") as f:
        f.write(resp.content)

# ------------ GŁÓWNA LOGIKA ------------
def main():
    os.makedirs(CATEGORY_FOLDER, exist_ok=True)

    for phrase in instruments:
        safe_name = phrase
        dest_file = os.path.join(CATEGORY_FOLDER, f"{safe_name}.jpg")
        try:
            print(f"Pobieram obraz dla: {phrase}")
            url = fetch_image_url(phrase)
            download_image(url, dest_file)
            print(f"→ Zapisano: {dest_file}")
        except Exception as e:
            print(f"❌ Błąd dla '{phrase}': {e}")
        sleep(DELAY)

if __name__ == "__main__":
    main()
