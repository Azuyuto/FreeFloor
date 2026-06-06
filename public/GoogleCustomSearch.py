#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Skrypt: download_google_images.py

Dla każdej frazy:
  1. Wyszukuje w Google Images jedno najlepsze zdjęcie.
  2. Pobiera je do katalogu 'Instrumenty_muzyczne'.
  3. Zapisuje jako '<fraza>.jpg' (spacje zamieniane na podkreślenia).
"""

import os
import glob
from urllib.parse import urlparse, unquote
from google_images_search import GoogleImagesSearch

# ------------ USTAWIENIA ------------
API_KEY = "AIzaSyC8LzzVU4vZTyBwXE8nWg2F-rKzx8AHykM"
CX      = "c3a4bc30584544aef"
OUTPUT_DIR = "categories/Flagi"    # folder docelowy

# Lista 30 itemsów
items = [
    "Flaga Watykanu"
]


# ------------ FUNKCJE ------------
def safe_filename(name: str) -> str:
    """
    Zamienia spacje na podkreślenia i usuwa niebezpieczne znaki.
    """
    base = name.strip().replace("logo ", "")
    return base

def get_extension_from_url(url: str) -> str:
    """
    Wyciąga rozszerzenie pliku z URL.
    Jeśli nie uda się znaleźć, zwraca '.jpg' jako domyślne.
    """
    path = urlparse(url).path            # np. '/images/foo.jpg'
    path = unquote(path)                 # dekoduje ewentualne %20 itp.
    _, ext = os.path.splitext(path)
    if ext.lower() in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
        return ext
    return '.jpg'

def download_and_rename(phrase: str):
    gis = GoogleImagesSearch(API_KEY, CX)
    gis.search({
        'q': phrase,
        'num': 1,
        'safe': 'high',
        'fileType': 'jpg|png',
        'imgType': 'photo'
    })
    results = gis.results()
    if not results:
        print(f"⚠️ Brak wyników dla: {phrase}")
        return

    img = results[0]
    url = img.url                       # URL pobranego obrazka
    ext = get_extension_from_url(url)   # np. '.jpg'

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    # 1) Pobierz plik do tymczasowego katalogu
    img.download(OUTPUT_DIR)

    # 2) Znajdź ostatnio pobrany plik (największe timestamp)
    pattern = os.path.join(OUTPUT_DIR, f"*{ext}")
    downloaded = sorted(glob.glob(pattern), key=os.path.getmtime)
    if not downloaded:
        print(f"❌ Nie znaleziono pobranego pliku dla {phrase}")
        return

    src = downloaded[-1]
    dst_name = safe_filename(phrase) + ext
    dst = os.path.join(OUTPUT_DIR, dst_name)
    os.replace(src, dst)
    print(f"✔️  Pobrano i zapisano: {dst}")

if __name__ == "__main__":
    for item in items:
        download_and_rename(item)